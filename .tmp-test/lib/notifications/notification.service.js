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
exports.notificationService = void 0;
exports.getNotificationSettings = getNotificationSettings;
exports.saveNotificationSettings = saveNotificationSettings;
exports.extractTemplateVariables = extractTemplateVariables;
exports.renderNotificationTemplate = renderNotificationTemplate;
exports.notify = notify;
exports.getNotificationLogs = getNotificationLogs;
exports.retryNotification = retryNotification;
exports.retryFailedNotifications = retryFailedNotifications;
exports.cancelPendingNotification = cancelPendingNotification;
exports.getNotificationTemplates = getNotificationTemplates;
exports.saveNotificationTemplate = saveNotificationTemplate;
exports.getNotificationPreferences = getNotificationPreferences;
exports.saveNotificationPreference = saveNotificationPreference;
exports.getCommunicationTimeline = getCommunicationTimeline;
exports.runNotificationTest = runNotificationTest;
const provider_adapters_ts_1 = require("./provider-adapters.ts");
const configuration_service_ts_1 = require("./configuration.service.ts");
const template_service_ts_1 = require("./template.service.ts");
let prismaClient;
async function getPrismaClient() {
    if (!prismaClient) {
        prismaClient = (await Promise.resolve().then(() => __importStar(require("../prisma/client")))).prisma;
    }
    return prismaClient;
}
const providers = (settings) => [
    (0, provider_adapters_ts_1.createEmailProvider)(settings),
    (0, provider_adapters_ts_1.createTelegramProvider)({ token: settings.telegramBotToken, chatId: settings.telegramChatId }),
    (0, provider_adapters_ts_1.createWhatsAppProvider)(),
    (0, provider_adapters_ts_1.createInternalProvider)()
];
async function getNotificationSettings() {
    const config = await (0, configuration_service_ts_1.loadCommunicationSettings)();
    const templates = await (0, template_service_ts_1.getSettingsTemplateMap)();
    return {
        ...config,
        templates
    };
}
async function saveNotificationSettings(settings) {
    await (0, configuration_service_ts_1.saveCommunicationSettings)(settings);
    await (0, template_service_ts_1.syncTemplatesFromSettings)(settings.templates);
    return settings;
}
function extractTemplateVariables(template, _payload = {}) {
    return (0, template_service_ts_1.extractTemplateVariables)(template);
}
function renderNotificationTemplate(template, payload) {
    return (0, template_service_ts_1.renderTemplate)(template, payload);
}
async function persistNotificationLog(input) {
    const prisma = await getPrismaClient();
    return prisma.notificationLog.create({
        data: {
            eventName: input.eventName,
            channel: input.channel,
            recipient: input.recipient,
            sender: input.sender,
            subject: input.subject,
            messagePreview: input.messagePreview,
            templateUsed: input.templateUsed,
            payload: input.payload,
            provider: input.provider,
            deliveryStatus: input.deliveryStatus,
            retryCount: input.retryCount ?? 0,
            errorMessage: input.errorMessage,
            userId: input.userId,
            sentAt: input.deliveryStatus === "SENT" || input.deliveryStatus === "DELIVERED" || input.deliveryStatus === "READ" ? new Date() : undefined
        }
    });
}
async function appendTimelineEntry(userId, eventName, title, details, metadata) {
    if (!userId)
        return;
    const prisma = await getPrismaClient();
    await prisma.communicationTimelineEntry.create({
        data: {
            userId,
            eventName,
            title,
            details,
            metadata: metadata
        }
    });
}
async function shouldDeliverChannel(settings, channel, eventName) {
    const prisma = await getPrismaClient();
    const preference = await prisma.notificationPreference.findFirst({
        where: {
            OR: [
                { eventName, channel, scopeType: "GLOBAL" },
                { eventName, channel, scopeType: "ORGANIZATION", scopeId: process.env.ORGANIZATION_ID },
                { eventName, channel, scopeType: "PROGRAM", scopeId: process.env.DEFAULT_PROGRAM_ID },
                { eventName, channel, scopeType: "ADMIN_USER", userId: process.env.ADMIN_USER_ID },
                { eventName, channel, scopeType: "APPLICANT", userId: process.env.DEFAULT_APPLICANT_ID }
            ]
        },
        orderBy: { createdAt: "desc" }
    });
    if (preference) {
        return preference.enabled;
    }
    if (!settings.enabled || !settings.events[eventName]) {
        return false;
    }
    return settings.channels[channel];
}
async function notify(eventName, payload = {}) {
    try {
        const settings = await getNotificationSettings();
        if (!settings.enabled || !settings.events[eventName]) {
            return { delivered: false, reason: "disabled" };
        }
        const locale = payload.locale || "en";
        const recipient = (payload.recipient || payload.recipientEmail || payload.userEmail || settings.senderEmail);
        const sender = (payload.sender || settings.senderEmail);
        const channels = [];
        const currentProviders = providers(settings);
        let timelineTitle = "";
        let timelineBody = "";
        for (const channel of ["email", "telegram", "whatsapp", "internal"]) {
            const channelEnabled = await shouldDeliverChannel(settings, channel, eventName);
            if (!channelEnabled)
                continue;
            channels.push(channel);
            const templateRecord = await (0, template_service_ts_1.getPublishedTemplate)(eventName, channel, locale);
            const template = {
                subject: templateRecord.subject,
                body: templateRecord.plainText || templateRecord.html.replace(/<[^>]+>/g, " "),
                title: templateRecord.title
            };
            const title = renderNotificationTemplate(template.title, payload);
            const body = renderNotificationTemplate(template.body, payload);
            const subject = renderNotificationTemplate(template.subject, payload);
            timelineTitle = title;
            timelineBody = body;
            const provider = currentProviders.find((candidate) => candidate.channel === channel);
            if (!provider)
                continue;
            const context = {
                channel,
                eventName,
                recipient: recipient || settings.senderEmail,
                sender,
                subject,
                message: body,
                html: channel === "email" ? `<div><h3>${title}</h3><p>${body.replace(/\n/g, "<br />")}</p></div>` : undefined,
                payload
            };
            const logEntry = await persistNotificationLog({
                eventName,
                channel,
                recipient: context.recipient,
                sender,
                subject,
                messagePreview: body,
                templateUsed: templateRecord.id,
                payload,
                provider: provider.channel,
                deliveryStatus: "QUEUED",
                userId: payload.userId
            });
            try {
                const result = await provider.send(context);
                const prisma = await getPrismaClient();
                await prisma.notificationLog.update({
                    where: { id: logEntry.id },
                    data: {
                        deliveryStatus: result.status,
                        providerResponse: result.providerResponse,
                        errorMessage: result.errorMessage,
                        sentAt: result.status === "SENT" || result.status === "DELIVERED" || result.status === "READ" ? new Date() : undefined,
                        deliveredAt: result.status === "DELIVERED" || result.status === "READ" ? new Date() : undefined,
                        readAt: result.status === "READ" ? new Date() : undefined
                    }
                });
            }
            catch (error) {
                const prisma = await getPrismaClient();
                await prisma.notificationLog.update({
                    where: { id: logEntry.id },
                    data: {
                        deliveryStatus: "FAILED",
                        errorMessage: error instanceof Error ? error.message : "Unknown provider error"
                    }
                });
            }
        }
        if (payload.userId) {
            await appendTimelineEntry(payload.userId, eventName, timelineTitle, timelineBody, { channel: channels.join(",") });
        }
        return {
            delivered: channels.length > 0,
            eventName,
            channels
        };
    }
    catch (error) {
        console.error("[notify]", error);
        return {
            delivered: false,
            reason: "notification_error",
            error: error instanceof Error ? error.message : "Unknown notification error"
        };
    }
}
async function getNotificationLogs() {
    const prisma = await getPrismaClient();
    return prisma.notificationLog.findMany({
        orderBy: { createdAt: "desc" }
    });
}
async function retryNotification(id) {
    const prisma = await getPrismaClient();
    const log = await prisma.notificationLog.findUnique({ where: { id } });
    if (!log)
        return null;
    await prisma.notificationLog.update({
        where: { id },
        data: { deliveryStatus: "QUEUED", retryCount: { increment: 1 }, errorMessage: null }
    });
    return log;
}
async function retryFailedNotifications() {
    const prisma = await getPrismaClient();
    const failed = await prisma.notificationLog.findMany({
        where: { deliveryStatus: "FAILED" }
    });
    for (const log of failed) {
        await retryNotification(log.id);
    }
    return failed.length;
}
async function cancelPendingNotification(id) {
    const prisma = await getPrismaClient();
    return prisma.notificationLog.update({
        where: { id },
        data: { deliveryStatus: "CANCELLED" }
    });
}
async function getNotificationTemplates() {
    const prisma = await getPrismaClient();
    return prisma.notificationTemplate.findMany({
        orderBy: { updatedAt: "desc" }
    });
}
async function saveNotificationTemplate(input) {
    const prisma = await getPrismaClient();
    const existing = await prisma.notificationTemplate.findFirst({
        where: { name: input.name, eventName: input.eventName, channel: input.channel }
    });
    if (existing) {
        return prisma.notificationTemplate.update({
            where: { id: existing.id },
            data: {
                ...input,
                version: (existing.version || 0) + 1
            }
        });
    }
    return prisma.notificationTemplate.create({
        data: {
            ...input,
            variables: input.variables || []
        }
    });
}
async function getNotificationPreferences() {
    const prisma = await getPrismaClient();
    return prisma.notificationPreference.findMany({ orderBy: { createdAt: "desc" } });
}
async function saveNotificationPreference(input) {
    const prisma = await getPrismaClient();
    const existing = await prisma.notificationPreference.findFirst({
        where: {
            scopeType: input.scopeType || "GLOBAL",
            scopeId: input.scopeId,
            userId: input.userId,
            eventName: input.eventName,
            channel: input.channel
        }
    });
    if (existing) {
        return prisma.notificationPreference.update({ where: { id: existing.id }, data: { enabled: input.enabled } });
    }
    return prisma.notificationPreference.create({
        data: {
            scopeType: input.scopeType || "GLOBAL",
            scopeId: input.scopeId,
            userId: input.userId,
            eventName: input.eventName,
            channel: input.channel,
            enabled: input.enabled
        }
    });
}
async function getCommunicationTimeline(userId) {
    const prisma = await getPrismaClient();
    return prisma.communicationTimelineEntry.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
    });
}
async function runNotificationTest(settings) {
    await saveNotificationSettings(settings);
    return notify("admin_test", { name: "Admin", userEmail: settings.senderEmail, recipientEmail: settings.senderEmail });
}
exports.notificationService = {
    getSettings: getNotificationSettings,
    notify,
    saveSettings: saveNotificationSettings,
    runTest: runNotificationTest
};
