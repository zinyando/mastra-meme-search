import { NextResponse } from 'next/server';
import { memeRagWorkflow } from '@/mastra/workflows';

export async function POST(request: Request) {
  try {
    // Get the page range from request body or use defaults
    const body = await request.json();
    const startPage = body.startPage || 1;
    const endPage = Math.min(body.endPage || 10, 50); // Cap at 50 pages

    const results = [];
    const errors = [];

    for (let page = startPage; page <= endPage; page++) {
      try {
        // Create a new run for each page
        const { runId, start } = memeRagWorkflow.createRun();
        console.log(`Starting run ${runId} for page ${page}`);

        const runResult = await start({
          triggerData: { page },
        });

        results.push({
          page,
          runId,
          results: runResult.results,
        });

        // Add a small delay between runs
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          page,
          error: errorMessage,
        });
      }
    }

    return NextResponse.json({
      success: true,
      startPage,
      endPage,
      completedPages: results.length,
      failedPages: errors.length,
      results,
      errors,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
