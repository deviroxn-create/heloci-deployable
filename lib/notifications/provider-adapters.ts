/**
 * Provider adapters for pluggable communication delivery.
 *
 * These adapters keep the business logic decoupled from the underlying
 * delivery transport so new channels can be added without changing callers.
 */
import { Resend } from "resend";
import type { NotificationChannel, NotificationDeliveryState, NotificationPayload } from "./notification.service.ts";

export interface NotificationDeliveryResult {
  status: NotificationDeliveryState;
  providerResponse?: unknown;
  errorMessage?: string;
}

export interface ProviderSendContext {
  channel: NotificationChannel;
  eventName: string;
  recipient: string;
  sender?: string;
  subject: string;
  message: string;
  html?: string;
  payload: NotificationPayload;
}

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(context: ProviderSendContext): Promise<NotificationDeliveryResult>;
  validate?(): Promise<boolean>;
  health?(): Promise<{ healthy: boolean; detail?: string }>;
  test?(context: ProviderSendContext): Promise<NotificationDeliveryResult>;
}

export function createEmailProvider(settings: { senderEmail: string }): NotificationProvider {
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
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: `${settings.senderEmail.startsWith("<") ? "Heloci" : "Heloci"} <${settings.senderEmail}>`,
          to: context.recipient,
          subject: context.subject,
          html: context.html || `<div>${context.message}</div>`
        });

        return { status: "SENT", providerResponse: { delivered: true } };
      } catch (error) {
        return {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown email error",
          providerResponse: { error }
        };
      }
    }
  };
}

export function createTelegramProvider(settings: { token: string; chatId: string }): NotificationProvider {
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
      } catch (error) {
        return {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown telegram error",
          providerResponse: { error }
        };
      }
    }
  };
}

export function createWhatsAppProvider(): NotificationProvider {
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

export function createInternalProvider(): NotificationProvider {
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
        const prisma = (await import("../prisma/client")).prisma;
        const userId = context.payload.userId as string | undefined;
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
        } else {
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
      } catch (error) {
        return {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown internal notification error",
          providerResponse: { error }
        };
      }
    }
  };
}
