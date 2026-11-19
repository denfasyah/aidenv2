/**
 * Singleton Google Generative AI provider instance.
 * Uses GEMINI_API_KEY from environment variables.
 */
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

/** Default chat model */
export const CHAT_MODEL = "gemini-2.5-flash";

/**
 * Embedding model — gemini-embedding-001 (Google Gemini).
 * Output dimensionality set to 1536 (standard Matryoshka dimension supported by pgvector HNSW max 2000).
 */
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 1536;
