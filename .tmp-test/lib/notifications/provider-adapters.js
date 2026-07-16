"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailProvider = createEmailProvider;
exports.createTelegramProvider = createTelegramProvider;
exports.createWhatsAppProvider = createWhatsAppProvider;
exports.createInternalProvider = createInternalProvider;
/**
 * Provider adapters for pluggable communication delivery.
 *
 * These adapters keep the business logic decoupled from the underlying
 * delivery transport so new channels can be added without changing callers.
 */
const resend_1 = require("resend");
function createEmailProvider(settings) {
    return {
        channel: "email",
        async validate() {
            return Boolean(process.env.RESEND_API_KEY);
        },
        async health() {
            return { healthy: Boolean(process.env.RESEND_API_KEY), detail: process.env.RESEND_API_KEY ? "Resend API configured" : "Resend API key missing" };
        },
        async test(context) {
            return this.send(context);
        },
        async send(context) {
            const apiKey = process.env.RESEND_API_KEY;
            if (!apiKey) {
                return { status: "FAILED", errorMessage: "Resend is not configured" };
            }
            try {
                const resend = new resend_1.Resend(apiKey);
                await resend.emails.send({
                    from: `${settings.senderEmail.startsWith("<") ? "Heloci" : "Heloci"} <${settings.senderEmail}>`,
                    to: context.recipient,
                    subject: context.subject,
                    html: context.html || `<div>${context.message}</div>`
                });
                return { status: "SENT", providerResponse: { delivered: true } };
            }
            catch (error) {
                return {
                    status: "FAILED",
                    errorMessage: error instanceof Error ? error.message : "Unknown email error",
                    providerResponse: { error }
                };
            }
        }
    };
}
function createTelegramProvider(settings) {
    return {
        channel: "telegram",
        async validate() {
            return Boolean(settings.token && settings.chatId);
        },
        async health() {
            if (!settings.token || !settings.chatId) {
                return { healthy: false, detail: "Telegram token or chat ID missing" };
            }
            return { healthy: true, detail: "Telegram configured" };
        },
        async test(context) {
            return this.send(context);
        },
        async send(context) {
            const token = settings.token;
            const chatId = settings.chatId;
            if (!token || !chatId) {
                return { status: "FAILED", errorMessage: "Telegram credentials are missing" };
            }
            try {
                const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chat_id: chatId, text: context.message })
                });
                return {
                    status: response.ok ? "SENT" : "FAILED",
                    providerResponse: { ok: response.ok, status: response.status },
                    errorMessage: response.ok ? undefined : "Telegram request failed"
                };
            }
            catch (error) {
                return {
                    status: "FAILED",
                    errorMessage: error instanceof Error ? error.message : "Unknown telegram error",
                    providerResponse: { error }
                };
            }
        }
    };
}
function createWhatsAppProvider() {
    return {
        channel: "whatsapp",
        async validate() {
            return false;
        },
        async health() {
            return { healthy: false, detail: "WhatsApp provider is not configured" };
        },
        async test(context) {
            return this.send(context);
        },
        async send(context) {
            return {
                status: "PENDING",
                errorMessage: `WhatsApp provider hook is not configured for ${context.eventName}`,
                providerResponse: { queued: true }
            };
        }
    };
}
function createInternalProvider() {
    return {
        channel: "internal",
        async validate() {
            return true;
        },
        async health() {
            return { healthy: true, detail: "Internal notifications available" };
        },
        async test(context) {
            return this.send(context);
        },
        async send(context) {
            try {
                const prisma = (await Promise.resolve().then(() => __importStar(require("../prisma/client")))).prisma;
                const userId = context.payload.userId;
                const title = context.subject || context.eventName;
                const body = context.message;
                if (userId) {
                    await prisma.notification.create({
                        data: {
                            userId,
                            title,
                            body,
                            category: context.eventName
                        }
                    });
                }
                else {
                    const admins = await prisma.user.findMany({
                        where: { role: "ADMIN" },
                        select: { id: true }
                    });
                    await prisma.notification.createMany({
                        data: admins.map((admin) => ({
                            userId: admin.id,
                            title,
                            body,
                            category: context.eventName
                        }))
                    });
                }
                return { status: "DELIVERED", providerResponse: { created: true } };
            }
            catch (error) {
                return {
                    status: "FAILED",
                    errorMessage: error instanceof Error ? error.message : "Unknown internal notification error",
                    providerResponse: { error }
                };
            }
        }
    };
}
