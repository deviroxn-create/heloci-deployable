import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma/client";
import type { NotificationChannel, NotificationEventName } from "./notification.service";

export type CommunicationSettings = {
  enabled: boolean;
  channels: Record<NotificationChannel, boolean>;
  senderEmail: string;
  telegramBotToken: string;
  telegramChatId: string;
  events: Record<NotificationEventName, boolean>;
};

const settingsFilePath = path.join(process.cwd(), "lib", "notifications", "notification.settings.json");

let cachedSettings: CommunicationSettings | null = null;
let isLoading = false;
let testOverrideCommunicationSettings: CommunicationSettings | null = null;

export function setCommunicationSettingsForTest(settings: CommunicationSettings | null) {
  testOverrideCommunicationSettings = settings;
}

function getDefaultSettings(): CommunicationSettings {
  return {
    enabled: true,
    channels: {
      email: true,
      telegram: false,
      whatsapp: false,
      internal: true
    },
    senderEmail: "support@heloci.us", // Use verified Heloci domain, never env vars
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
      application_conditional: true,
      application_withdrawn: true,
      document_uploaded: true,
      document_approved: true,
      document_rejected: true,
      document_replacement_requested: true,
      application_approved: true,
      application_rejected: true,
      application_waitlisted: true,
      documents_requested: true,
      // Additional Milestone 6A events
      submitted: true,
      status_changed: true,
      approved: true,
      rejected: true,
      review_assigned: true,
      review_completed: true,
      sla_breach: true,
      deadline_approaching: true,
      user_created: true,
      user_role_changed: true,
      staff_action: true,
      rent_to_own_request: true,
      government_program_application: true,
      ngo_program_application: true,
      homeowner_listing_submitted: true,
      ai_conversation_started: true,
      ai_recommendation_generated: true,
      message_created: true,
      admin_action: true,
      ops_alert: true,
      program_published: true,
      staff_invited: true,
      staff_invitation_accepted: true,
      staff_role_changed: true,
      staff_removed: true,
      system_error: true,
      admin_test: true,
      custom_email: true
    } as any
  };
}

export function mergeCommunicationSettings(settings: Partial<CommunicationSettings> | null | undefined): CommunicationSettings {
  const defaults = getDefaultSettings();

  if (!settings) {
    return defaults;
  }

  return {
    enabled: settings.enabled ?? defaults.enabled,
    channels: {
      ...defaults.channels,
      ...(settings.channels || {})
    },
    senderEmail: settings.senderEmail || defaults.senderEmail, // Never fallback to env vars with unverified addresses
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || settings.telegramBotToken || defaults.telegramBotToken,
    telegramChatId: process.env.TELEGRAM_CHAT_ID || settings.telegramChatId || defaults.telegramChatId,
    events: {
      ...defaults.events,
      ...(settings.events || {})
    }
  };
}

export async function loadCommunicationSettings(): Promise<CommunicationSettings> {
  if (testOverrideCommunicationSettings) {
    return testOverrideCommunicationSettings;
  }

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
    const dbSettings = await prisma.communicationSettings.findUnique({ where: { id: "default" } });
    if (dbSettings) {
      const normalizedDbSettings = {
        enabled: dbSettings.enabled,
        channels: (dbSettings.channels as Record<string, boolean> | null) ?? undefined,
        senderEmail: dbSettings.senderEmail || undefined,
        telegramBotToken: dbSettings.telegramBotToken || undefined,
        telegramChatId: dbSettings.telegramChatId || undefined,
        events: (dbSettings.events as Record<string, boolean> | null) ?? undefined
      };
      cachedSettings = mergeCommunicationSettings(normalizedDbSettings as unknown as Partial<CommunicationSettings>);
    } else {
      cachedSettings = await loadSettingsFromJson();
    }
  } catch {
    cachedSettings = await loadSettingsFromJson();
  } finally {
    isLoading = false;
  }

  return cachedSettings;
}

async function loadSettingsFromJson(): Promise<CommunicationSettings> {
  const defaults = getDefaultSettings();

  try {
    const raw = await fs.readFile(settingsFilePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<CommunicationSettings>;
    const settings = mergeCommunicationSettings(parsed);
    await migrateSettingsToDatabase(settings);
    return settings;
  } catch {
    return defaults;
  }
}

export async function saveCommunicationSettings(settings: CommunicationSettings) {
  cachedSettings = { ...settings };

  await prisma.communicationSettings.upsert({
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

async function migrateSettingsToDatabase(settings: CommunicationSettings) {
  const existing = await prisma.communicationSettings.findUnique({ where: { id: "default" } });
  if (existing) return;

  await prisma.communicationSettings.create({
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

export function clearCommunicationSettingsCache() {
  cachedSettings = null;
}
