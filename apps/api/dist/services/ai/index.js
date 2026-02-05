"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIProvider = getAIProvider;
exports.generateReply = generateReply;
const huggingfaceProvider_1 = require("./huggingfaceProvider");
let provider = null;
function getAIProvider() {
    if (!provider) {
        provider = new huggingfaceProvider_1.HuggingFaceProvider();
    }
    return provider;
}
async function generateReply(input) {
    const ai = getAIProvider();
    return ai.generateReply(input);
}
//# sourceMappingURL=index.js.map