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
