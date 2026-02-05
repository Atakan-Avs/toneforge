"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthlyQuota = monthlyQuota;
function monthlyQuota(plan) {
    switch (plan) {
        case "PRO":
            return 500;
        case "PREMIUM":
            return 2000;
        case "FREE":
        default:
            return 20;
    }
}
//# sourceMappingURL=planQuota.js.map