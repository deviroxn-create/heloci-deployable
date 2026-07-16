"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCommunicationSettings = loadCommunicationSettings;
exports.saveCommunicationSettings = saveCommunicationSettings;
exports.clearCommunicationSettingsCache = clearCommunicationSettingsCache;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const client_1 = require("@/lib/prisma/client");
const settingsFilePath = path_1.default.join(process.cwd(), "lib", "notifications", "notification.settings.json");
let cachedSettings = null;
let isLoading = false;
function getDefaultSettings() {
    return {
        enabled: true,
        channels: {
            email: true,
            telegram: false,
            whatsapp: false,
            internal: true
        },
        senderEmail: process.env.COMMUNICATION_SENDER_EMAIL || "support@heloci.ngo",
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || "",
        telegramChatId: process.env.TELEGRAM_CHAT_ID || "",
        events: {
            user_registration: true,
            user_login: true,
            eligibility_assessment_started: true,
            eligibility_assessment_completed: true,
            program_matched: true,
            new_recommendation_available: true,
            application_started: true,
            application_submitted: true,
            document_uploaded: true,
            application_approved: true,
            application_rejected: true,
            application_waitlisted: true,
            documents_requested: true,
            rent_to_own_request: true,
            government_program_application: true,
            ngo_program_application: true,
            homeowner_listing_submitted: true,
            ai_conversation_started: true,
            ai_recommendation_generated: true,
            admin_action: true,
            program_published: true,
            staff_invited: true,
            staff_invitation_accepted: true,
            staff_role_changed: true,
            staff_removed: true,
            system_error: true,
            admin_test: true
        }
    };
}
async function loadCommunicationSettings() {
    if (cachedSettings) {
        return cachedSettings;
    }
    if (isLoading) {
        while (isLoading && !cachedSettings) {
            await new Promise((resolve) => setTimeout(resolve, 20));
        }
        return cachedSettings ?? getDefaultSettings();
    }
    isLoading = true;
    try {
        const dbSettings = await client_1.prisma.communicationSettings.findUnique({ where: { id: "default" } });
        if (dbSettings) {
            cachedSettings = {
                enabled: dbSettings.enabled,
                channels: dbSettings.channels,
                senderEmail: dbSettings.senderEmail,
                telegramBotToken: dbSettings.telegramBotToken || "",
                telegramChatId: dbSettings.telegramChatId || "",
                events: dbSettings.events
            };
        }
        else {
            cachedSettings = await loadSettingsFromJson();
        }
    }
    catch {
        cachedSettings = await loadSettingsFromJson();
    }
    finally {
        isLoading = false;
    }
    return cachedSettings;
}
async function loadSettingsFromJson() {
    const defaults = getDefaultSettings();
    try {
        const raw = await fs_1.promises.readFile(settingsFilePath, "utf8");
        const parsed = JSON.parse(raw);
        const settings = {
            ...defaults,
            ...parsed,
            channels: { ...defaults.channels, ...(parsed.channels || {}) },
            events: { ...defaults.events, ...(parsed.events || {}) }
        };
        await migrateSettingsToDatabase(settings);
        return settings;
    }
    catch {
        return defaults;
    }
}
async function saveCommunicationSettings(settings) {
    cachedSettings = { ...settings };
    await client_1.prisma.communicationSettings.upsert({
        where: { id: "default" },
        update: {
            enabled: settings.enabled,
            channels: settings.channels,
            senderEmail: settings.senderEmail,
            telegramBotToken: settings.telegramBotToken,
            telegramChatId: settings.telegramChatId,
            events: settings.events
        },
        create: {
            id: "default",
            enabled: settings.enabled,
            channels: settings.channels,
            senderEmail: settings.senderEmail,
            telegramBotToken: settings.telegramBotToken,
            telegramChatId: settings.telegramChatId,
            events: settings.events
        }
    });
    return settings;
}
async function migrateSettingsToDatabase(settings) {
    const existing = await client_1.prisma.communicationSettings.findUnique({ where: { id: "default" } });
    if (existing)
        return;
    await client_1.prisma.communicationSettings.create({
        data: {
            id: "default",
            enabled: settings.enabled,
            channels: settings.channels,
            senderEmail: settings.senderEmail,
            telegramBotToken: settings.telegramBotToken,
            telegramChatId: settings.telegramChatId,
            events: settings.events
        }
    });
}
function clearCommunicationSettingsCache() {
    cachedSettings = null;
}
