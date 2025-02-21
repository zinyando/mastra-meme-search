# Meme Search Engine

A powerful meme search engine that uses AI to understand and find memes based on natural language queries. The system scrapes memes from Know Your Meme, generates AI descriptions, and enables semantic search using pgvector.

## Features

- Scrapes memes from Know Your Meme
- Generates AI descriptions for memes using GPT-4 Vision
- Semantic search using pgvector in Supabase
- Modern, responsive UI with Next.js
- Image modal with original source links

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key
- Environment variables:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_KEY=your_supabase_service_key
  OPENAI_API_KEY=your_openai_api_key
  ```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL scripts in `supabase/schema.sql` and `supabase/functions/match_memes.sql`
   - Copy your project URL and service key

3. Configure environment:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase and OpenAI credentials

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Run the meme scraper workflow:
   ```typescript
   import { memeRagWorkflow } from './src/mastra/workflows';

   await memeRagWorkflow.trigger({
     startPage: 1,
     batchSize: 100,
     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
     supabaseKey: process.env.SUPABASE_SERVICE_KEY,
     openaiKey: process.env.OPENAI_API_KEY,
   });
   ```

## Usage

1. Open http://localhost:3000 in your browser
2. Enter a search query in the search box
3. Results will be displayed in a grid
4. Click on a meme to view details and the original source

## Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: 
  - Next.js API routes for search endpoints
  - Supabase for vector storage and similarity search
  - OpenAI for embeddings and image description
- **Data Pipeline**:
  - Puppeteer for web scraping
  - GPT-4 Vision for meme description
  - text-embedding-ada-002 for vector embeddings

## License

MIT
