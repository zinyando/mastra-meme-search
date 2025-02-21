import { OpenAI } from 'ai';
import { NextResponse } from 'next/server';
import { PgVector } from '@mastra/pg';

const COLLECTION_NAME = 'memes';

export async function POST(req: Request) {
  try {
    const { query: searchQuery } = await req.json();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Generate embedding for the search query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: searchQuery,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Search for similar memes using PgVector
    const store = new PgVector(process.env.POSTGRES_CONNECTION_STRING!);
    const results = await store.search(COLLECTION_NAME, queryEmbedding, {
      limit: 10,
      similarityThreshold: 0.5,
    });

    return NextResponse.json({ memes: results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
