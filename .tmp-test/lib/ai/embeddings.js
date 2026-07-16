"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmbedding = createEmbedding;
const openai_1 = __importDefault(require("openai"));
const env_1 = require("@/env");
const openai = new openai_1.default({ apiKey: env_1.env.OPENAI_API_KEY });
async function createEmbedding(input) {
    const result = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input
    });
    return result.data[0]?.embedding ?? [];
}
