import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

export async function generateEmbedding(chunk: string): Promise<number[]> {
  const { embedding } = await embed({
    value: chunk,
    model: openai.embedding("text-embedding-3-small"),
  });

  return embedding;
}

export async function generateBatchEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const embeddings = await Promise.all(
    texts.map((text) => generateEmbedding(text))
  );
  return embeddings;
}
