export type GenerateReplyInput = {
  userMessage: string;
  brandVoice?: {
    name?: string | null;
    guidelines?: string | null;
    bannedWords?: string[] | null;
    exampleReplies?: string[] | null;
  } | null;
  template?: {
    content?: string | null;
  } | null;
  language?: "tr" | "en";
};

export type GenerateReplyOutput = {
  reply: string;
  model: string;
  provider: "huggingface";
  meta?: Record<string, unknown>;
};

export interface AIProvider {
  generateReply(input: GenerateReplyInput): Promise<GenerateReplyOutput>;
}