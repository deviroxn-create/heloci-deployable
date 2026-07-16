"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAssistant = askAssistant;
const openai_1 = __importDefault(require("openai"));
const env_1 = require("@/env");
const prompts_1 = require("@/lib/ai/prompts");
const openai = new openai_1.default({ apiKey: env_1.env.OPENAI_API_KEY });
async function askAssistant(question) {
    const response = await openai.responses.create({
        model: "gpt-4.1",
        input: `${prompts_1.eligibilityPrompt}
Question: ${question}`
    });
    const firstOutput = response.output?.[0];
    if (firstOutput && firstOutput.type === "message") {
        return firstOutput.content?.find((item) => item.type === "output_text")?.text ?? "We could not generate guidance at this time.";
    }
    return "We could not generate guidance at this time.";
}
