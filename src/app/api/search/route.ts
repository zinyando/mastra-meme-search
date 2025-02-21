import { NextResponse } from "next/server";
import { searchMemes } from "@/mastra/workflows/pgvector";

export async function POST(req: Request) {
  try {
    const { query: searchQuery } = await req.json();

    const { memes, scores } = await searchMemes(searchQuery);

    return NextResponse.json({ memes, scores });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
