import type { GenerateReplyInput } from "./types";

function safeJoin(lines: (string | null | undefined)[]) {
  return lines.filter(Boolean).join("\n");
}

export function buildPrompt(input: GenerateReplyInput) {
  const lang = input.language ?? "tr";

  const brand = input.brandVoice;
  const template = input.template?.content ?? "";

  const brandRules = safeJoin([
    brand?.name ? `Brand voice name: ${brand.name}` : null,
    brand?.guidelines ? `Brand guidelines:\n${brand.guidelines}` : null,
    brand?.bannedWords?.length ? `Banned words: ${brand.bannedWords.join(", ")}` : null,
    brand?.exampleReplies?.length ? `Example replies:\n- ${brand.exampleReplies.join("\n- ")}` : null,
  ]);

  const system = lang === "tr"
    ? `Sen profesyonel bir müşteri destek temsilcisisin. Kısa, net, kibar ve çözüm odaklı yanıt ver. Gereksiz uzatma.`
    : `You are a professional customer support agent. Be concise, polite, and solution-oriented. No unnecessary fluff.`;

  const constraints = lang === "tr"
    ? `Kurallar:
- Asla hassas veri isteme (kart bilgisi, şifre vb.)
- Suçlayıcı konuşma.
- Marka diline uy.
- Yanıtı tek mesaj olarak ver.`
    : `Rules:
- Never ask for sensitive data (card details, passwords, etc.)
- Avoid blaming language.
- Follow brand voice.
- Output as a single message.`;

  const templateHint = template
    ? (lang === "tr" ? `Şablon (uygun bulursan kullan):\n${template}` : `Template (use if helpful):\n${template}`)
    : "";

  const user = lang === "tr"
    ? `Müşteri mesajı:\n${input.userMessage}`
    : `Customer message:\n${input.userMessage}`;

  // HF text-generation modelleri çoğu zaman tek string prompt alıyor.
  // Burada “tek prompt” standardı:
  return safeJoin([
    `### SYSTEM\n${system}`,
    brandRules ? `\n### BRAND VOICE\n${brandRules}` : null,
    `\n### CONSTRAINTS\n${constraints}`,
    templateHint ? `\n### TEMPLATE\n${templateHint}` : null,
    `\n### USER\n${user}`,
    `\n### ASSISTANT\n`,
  ]);
}