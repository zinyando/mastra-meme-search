import { PgVector } from "@mastra/pg";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

const connectionString = process.env.POSTGRES_CONNECTION_STRING;
if (!connectionString) {
  throw new Error("POSTGRES_CONNECTION_STRING is required");
}

const pgVector = new PgVector(connectionString);

interface MemeMetadata {
  url: string;
  imageUrl: string;
  title: string;
  aiDescription: string;
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Generate embedding for the query
    const { embedding } = await embed({
      value: query,
      model: openai.embedding("text-embedding-3-small"),
    });

    // Get similar titles using vector similarity search
    const results = await pgVector.query("memes", embedding, 5);

    // Extract unique titles from the results
    const suggestions = [
      ...new Set(
        results.map((result) => (result.metadata as MemeMetadata).title)
      ),
    ];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
