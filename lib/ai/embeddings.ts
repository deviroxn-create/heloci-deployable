import OpenAI from "openai";
import { env } from "@/env";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function createEmbedding(input: string) {
  const result = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input
  });
  return result.data[0]?.embedding ?? [];
}
