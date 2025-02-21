import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import puppeteer from "puppeteer";
import { PgVector } from "@mastra/pg";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { storeMemeEmbedding } from "./pgvector";
import { generateEmbedding } from "./embeddings";

const connectionString = process.env.POSTGRES_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("POSTGRES_CONNECTION_STRING is required");
}

const pgVector = new PgVector(connectionString);

await pgVector.createIndex("products", 1536);

// Define schemas for our data
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
    batchSize: z.number().default(100),
    openaiKey: z.string(),
  }),
});

const scrapeMemesStep = new Step({
  id: "scrapeMemesStep",
  outputSchema: z.object({
    memes: z.array(MemeSchema),
  }),
  execute: async ({ context }) => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    const memes: Meme[] = [];

    try {
      await page.goto("https://knowyourmeme.com/memes/popular");
      await page.waitForSelector(".entry-grid-body .entry");

      const newMemes = await page.evaluate(() => {
        const memeElements = document.querySelectorAll(
          ".entry-grid-body .entry"
        );
        return Array.from(memeElements).map((element) => {
          const linkEl = element.querySelector("a");
          const imgEl = element.querySelector("img");
          const titleEl = element.querySelector("h2");

          return {
            url: linkEl?.href || "",
            imageUrl: imgEl?.src || "",
            title: titleEl?.textContent?.trim() || "",
          };
        });
      });

      memes.push(...newMemes.filter((m) => m.url && m.imageUrl));

      if (memes.length >= context.triggerData.batchSize) {
        memes.length = context.triggerData.batchSize;
      }
    } finally {
      await browser.close();
    }

    return { memes };
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
