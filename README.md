# Mastra Meme Search

A semantic meme search engine that uses AI to understand and find memes based on natural language queries. Built with Mastra's document processing capabilities, the system scrapes memes from Know Your Meme and enables semantic search using pgvector.

## Features

- Semantic meme search with natural language understanding
- Real-time search interface with instant results
- Responsive design with modern UI components
- Clear search functionality with URL state management
- Meme scraping from Know Your Meme using Mastra's Firecrawl
- Vector embeddings stored in PostgreSQL with pgvector
- Built with Next.js 15 and TypeScript for type safety

## Tech Stack

- Next.js 15.1.7 with Turbopack
- React 19
- TypeScript 5.7
- Tailwind CSS 3.4
- PostgreSQL with pgvector
- Mastra Core and Firecrawl for web scraping
- OpenAI for embeddings generation

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL with pgvector extension
- Environment variables:
  ```
  POSTGRES_CONNECTION_STRING=your_postgres_connection_string
  OPENAI_API_KEY=your_openai_api_key
  FIRECRAWL_API_KEY=your_firecrawl_api_key
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

3. Set up environment variables as listed in the Prerequisites section

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Run the meme scraper:
   ```bash
   npm run scrape
   ```

## Development

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run scrape` - Run meme scraper script

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
