import { openai } from "@ai-sdk/openai";
import { PgVector } from "@mastra/pg";
import { embed } from "ai";

const connectionString = process.env.POSTGRES_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("POSTGRES_CONNECTION_STRING is required");
}

const pgVector = new PgVector(connectionString);

await pgVector.createIndex("memes", 1536);

interface MemeMetadata {
  url: string;
  imageUrl: string;
  title: string;
  aiDescription: string;
}

export async function storeMemeEmbedding(
  embeddings: number[][],
  memes: MemeMetadata[]
) {
  if (embeddings.length !== memes.length) {
    throw new Error("Number of embeddings must match number of memes");
  }

  const result = await pgVector.upsert(
    "memes",
    embeddings,
    memes.map((meme) => ({
      url: meme.url,
      imageUrl: meme.imageUrl,
      title: meme.title,
      aiDescription: meme.aiDescription,
    }))
  );

  return result;
}

export async function searchMemes(query?: string) {
  if (!query) {
    return { memes: [], scores: [] };
  }

  const { embedding } = await embed({
    value: query,
    model: openai.embedding("text-embedding-3-small"),
  });

  const results = await pgVector.query("memes", embedding, 10);

  return {
    memes: results.map((result) => result.metadata as MemeMetadata),
    scores: results.map((result) => result.score as number),
  };
}
