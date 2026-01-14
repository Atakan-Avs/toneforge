import type { AIProvider, GenerateReplyInput } from "./types";
import { HuggingFaceProvider } from "./huggingfaceProvider";

let provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!provider) {
    provider = new HuggingFaceProvider();
  }
  return provider;
}

export async function generateReply(input: GenerateReplyInput) {
  const ai = getAIProvider();
  return ai.generateReply(input);
}