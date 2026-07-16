import OpenAI from "openai";
import { env } from "@/env";
import { eligibilityPrompt } from "@/lib/ai/prompts";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function askAssistant(question: string) {
  const response = await openai.responses.create({
    model: "gpt-4.1",
    input: `${eligibilityPrompt}
Question: ${question}`
  });

  const firstOutput = response.output?.[0];

  if (firstOutput && firstOutput.type === "message") {
    return firstOutput.content?.find((item) => item.type === "output_text")?.text ?? "We could not generate guidance at this time.";
  }

  return "We could not generate guidance at this time.";
}
