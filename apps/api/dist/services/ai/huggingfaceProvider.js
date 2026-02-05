"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceProvider = void 0;
const promptBuilder_1 = require("./promptBuilder");
async function fetchWithTimeout(url, init, timeoutMs) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...init, signal: controller.signal });
        return res;
    }
    finally {
        clearTimeout(id);
    }
}
class HuggingFaceProvider {
    constructor() {
        const token = process.env.HF_API_TOKEN;
        const model = process.env.HF_MODEL;
        if (!token)
            throw new Error("HF_API_TOKEN is missing");
        if (!model)
            throw new Error("HF_MODEL is missing");
        this.token = token.trim();
        this.model = model.trim();
        this.timeoutMs = Number(process.env.HF_TIMEOUT_MS ?? 20000);
        this.temperature = Number(process.env.HF_TEMPERATURE ?? 0.4);
    }
    async generateReply(input) {
        // We keep your existing prompt builder to preserve behavior.
        const prompt = (0, promptBuilder_1.buildPrompt)(input);
        // ✅ NEW: Hugging Face Router (OpenAI-compatible)
        // base_url: https://router.huggingface.co/v1  (docs)
        const url = "https://router.huggingface.co/v1/chat/completions";
        const res = await fetchWithTimeout(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: this.temperature,
            }),
        }, this.timeoutMs).catch((err) => {
            throw new Error(`HF router request failed: ${err?.message ?? "unknown error"}`);
        });
        const text = await res.text();
        let data = null;
        try {
            data = JSON.parse(text);
        }
        catch {
            throw new Error(`HF router invalid JSON (status ${res.status}): ${text.slice(0, 300)}`);
        }
        if (!res.ok) {
            // Router errors usually include a message in the body
            throw new Error(data?.error?.message ?? data?.message ?? `HF router error ${res.status}`);
        }
        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (!reply)
            throw new Error("HF router returned empty reply");
        return {
            reply,
            provider: "huggingface",
            model: data.model ?? this.model,
            meta: { endpoint: "router", temperature: this.temperature },
        };
    }
}
exports.HuggingFaceProvider = HuggingFaceProvider;
//# sourceMappingURL=huggingfaceProvider.js.map