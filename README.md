# Mastra Meme Search

A semantic meme search engine that uses AI to understand and find memes based on natural language queries. Built with Mastra's document processing capabilities, the system scrapes memes from Know Your Meme and enables semantic search using pgvector.

## Features

- Scrapes memes from Know Your Meme using Mastra's document processing
- Stores meme metadata and embeddings in PostgreSQL with pgvector
- Semantic search using text embeddings
- Next.js-based API endpoints
- Built with TypeScript for type safety

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL with pgvector extension
- Environment variables:
  ```
  POSTGRES_CONNECTION_STRING=your_postgres_connection_string
  OPENAI_API_KEY=your_openai_api_key
  ```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up PostgreSQL:
   - Ensure pgvector extension is installed
   - Run the schema creation script:
     ```bash
     psql $POSTGRES_CONNECTION_STRING -f schema.sql
     ```

3. Configure environment:
   - Copy `.env.example` to `.env`
   - Set your PostgreSQL connection string and OpenAI API key

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Run the meme scraper workflow:
   ```typescript
   import { memeRagWorkflow } from './src/mastra/workflows';

   await memeRagWorkflow.trigger({
     page: 1
   });
   ```

## Architecture

- **Frontend**: Next.js with TypeScript
- **Backend**: 
  - Next.js API routes for search endpoints
  - PostgreSQL with pgvector for vector storage and similarity search
  - OpenAI for text embeddings
- **Data Pipeline**:
  - Mastra's document processing for web scraping
  - OpenAI embeddings for vector search
  - Mastra workflows for orchestration

## API Endpoints

### POST /api/search
Search for memes using natural language queries.

Request body:
```json
{
  "query": "your search query"
}
```

Response:
```json
{
  "memes": [
    {
      "url": "meme source url",
      "imageUrl": "meme image url",
      "title": "meme title",
      "aiDescription": "AI-generated description"
    }
  ],
  "scores": [0.95, 0.85] // similarity scores
}
```

## License

MIT
