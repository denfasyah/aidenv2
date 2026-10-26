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
 * Embedding model — verified working via Google REST API (Oct 2026).
 * text-embedding-004 was shut down Jan 2026. gemini-embedding-001 is active.
 * Default output = 3072 dims (Matryoshka; can also use 768 or 1536).
 */
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 3072;
