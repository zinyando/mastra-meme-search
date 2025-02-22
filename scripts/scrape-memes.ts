const WORKFLOW_URL =
  "http://localhost:4111/api/workflows/memeRagWorkflow/execute";

(async () => {
  const totalPages = 50;

  for (let page = 1; page <= totalPages; page++) {
    console.log(`Processing page ${page} of ${totalPages}...`);

    try {
      const response = await fetch(WORKFLOW_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Completed page ${page}`, {
        runId: result.runId,
        results: result.results,
      });

      // Add a small delay between requests to be nice to the server
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error processing page ${page}:`, error);
      // Continue with next page even if current one fails
    }
  }

  console.log("🎉 Scraping completed!");
})().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
