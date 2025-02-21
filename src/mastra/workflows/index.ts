import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { PgVector } from "@mastra/pg";
import { openai } from "@ai-sdk/openai";
import { generateText, generateObject } from "ai";
import { storeMemeEmbedding } from "./pgvector";
import { generateEmbedding } from "./embeddings";
import { FirecrawlIntegration } from "@mastra/firecrawl";

export const firecrawl = new FirecrawlIntegration({
  config: {
    API_KEY: process.env.FIRECRAWL_API_KEY!,
  },
});

const connectionString = process.env.POSTGRES_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("POSTGRES_CONNECTION_STRING is required");
}

const pgVector = new PgVector(connectionString);

await pgVector.createIndex("products", 1536);

const MemeSchema = z.object({
  url: z.string(),
  imageUrl: z.string(),
  title: z.string(),
  aiDescription: z.string().optional(),
});

const MemeWithEmbeddingSchema = MemeSchema.extend({
  embedding: z.array(z.number()),
});

type Meme = z.infer<typeof MemeSchema>;

export const memeRagWorkflow = new Workflow({
  name: "meme-scraper-workflow",
  triggerSchema: z.object({
    page: z.number().default(1),
  }),
});

const scrapeMemesStep = new Step({
  id: "scrapeMemesStep",
  outputSchema: z.object({
    memes: z.array(MemeSchema),
  }),
  execute: async ({ context }) => {
    const url = `https://knowyourmeme.com/memes/popular/page/${context.triggerData.page}`;

    const client = await firecrawl.getApiClient();

    try {
      const res = await client.crawlUrls({
        body: {
          url: url,
          limit: 10,
          scrapeOptions: {
            formats: ["markdown"],
          },
        },
      });

      if (res.error) {
        console.error({ error: JSON.stringify(res.error, null, 2) });
        throw new Error(res.error.error);
      }

      const crawlId = res.data?.id;

      let crawl = await client.getCrawlStatus({
        path: {
          id: crawlId!,
        },
      });

      while (crawl.data?.status === "scraping") {
        await new Promise((resolve) => setTimeout(resolve, 5000));

        crawl = await client.getCrawlStatus({
          path: {
            id: crawlId!,
          },
        });
      }

      if (
        !crawl.data ||
        !crawl.data.data ||
        !crawl.data.data[0] ||
        !crawl.data.data[0].markdown
      ) {
        throw new Error("No markdown content found in crawl response");
      }

      const content = crawl.data.data[0].markdown;

      const prompt = `
        Extract a JSON object from the text below. The JSON object should contain an array of objects, each with the following structure:

        {
          "url": "<Extracted URL>",
          "imageUrl": "<Extracted Image URL>",
          "title": "<Extracted Title>"
        }

        Ensure that:

        "url" contains a valid URL if present.
        "imageUrl" contains a valid image URL if present.
        "title" is a descriptive title if available.
        Return only a valid JSON object with the extracted data. If no relevant information is found, return an empty array.

        Text:
        ${content}

        Output Format:
        Return only a valid JSON object with no additional commentary, Markdown formatting, or explanations.
      `;

      const { object } = await generateObject({
        model: openai("gpt-4o"),
        output: "array",
        schema: MemeSchema,
        prompt: prompt,
      });

      // Filter out any memes that don't have required fields
      const validMemes = (object as Meme[]).filter(
        (meme) => meme.url && meme.imageUrl && meme.title
      );

      return { memes: validMemes };
    } catch (error) {
      console.error({ error: JSON.stringify(error, null, 2) });
      // Return empty array instead of undefined
      return { memes: [] };
    }
  },
});

const generateEmbeddingsStep = new Step({
  id: "generateEmbeddingsStep",
  input: z.array(MemeSchema),
  output: z.array(MemeWithEmbeddingSchema),
  execute: async ({ context }) => {
    const scrapeMemesResult = context?.steps?.scrapeMemesStep;
    if (!scrapeMemesResult || scrapeMemesResult.status !== "success") {
      throw new Error("Previous step failed or not completed");
    }

    const memes = scrapeMemesResult.output.memes;
    if (!memes || !Array.isArray(memes)) {
      throw new Error("Memes not found in step results or invalid format");
    }

    const results = [];
    for (const meme of memes) {
      const prompt = `Generate a detailed description of this meme. Title: ${meme.title}`;
      const aiDescription = await generateText({
        model: openai("gpt-4o"),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image", image: meme.imageUrl },
            ],
          },
        ],
        maxTokens: 500,
      });

      const memeText = [meme.title, aiDescription.text]
        .filter(Boolean)
        .join(" ");

      const embedding = await generateEmbedding(memeText);
      results.push({
        ...meme,
        aiDescription: aiDescription.text || "",
        embedding,
      });
    }

    return results;
  },
});

const storeEmbeddingsStep = new Step({
  id: "storeEmbeddingsStep",
  input: z.array(MemeWithEmbeddingSchema),
  output: z.object({ success: z.boolean() }),
  execute: async ({ context }) => {
    const generateEmbeddingsResult = context?.steps?.generateEmbeddingsStep;
    if (
      !generateEmbeddingsResult ||
      generateEmbeddingsResult.status !== "success"
    ) {
      throw new Error("Previous step failed or not completed");
    }

    const memesWithEmbeddings = generateEmbeddingsResult.output;
    if (!memesWithEmbeddings || !Array.isArray(memesWithEmbeddings)) {
      throw new Error("Memes not found in step results or invalid format");
    }

    const embeddings = memesWithEmbeddings.map((m) => m.embedding);
    const memes = memesWithEmbeddings.map(({ embedding, ...meme }) => meme);

    await storeMemeEmbedding(embeddings, memes);
    return { success: true };
  },
});

memeRagWorkflow
  .step(scrapeMemesStep)
  .then(generateEmbeddingsStep)
  .then(storeEmbeddingsStep)
  .commit();
