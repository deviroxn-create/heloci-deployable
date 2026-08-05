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
  senderName?: string;
  replyTo?: string;
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
      
      // CRITICAL FIX: Resolution priority for sender email (verified by runtime evidence)
      // Priority 1: context.sender (from resolved SenderIdentity in database)
      // Priority 2: settings.senderEmail (from organization configuration)
      // Priority 3: Fallback verified Heloci domain (support@heloci.us)
      // NEVER use ENV variables for sender - COMMUNICATION_SENDER_EMAIL may contain unverified Gmail
      const senderEmail = context.sender || settings.senderEmail || "support@heloci.us";
      const providerEnabled = Boolean(apiKey && senderEmail);
      
      if (!apiKey) {
        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Email] enabled=false reason=missing_api_key recipient=${context.recipient}`);
        }
        return {
          status: "FAILED",
          errorMessage: "Resend is not configured. Set RESEND_API_KEY before sending application emails."
        };
      }
      
      if (!senderEmail) {
        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Email] enabled=false reason=missing_sender_email recipient=${context.recipient}`);
        }
        return {
          status: "FAILED",
          errorMessage: "CONFIGURATION_ERROR: No verified email sender found. Please add a SenderIdentity in the Communication Settings and mark it as default. Resend can only send from verified domains."
        };
      }

      try {
        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Email] selectedProvider=resend recipient=${context.recipient} sender=${senderEmail} subject=${context.subject} enabled=${providerEnabled}`);
        }

        const resend = new Resend(apiKey);
        
        // Use the sender from context (verified database sender), not fallbacks
        const fromEmail = senderEmail;
        const fromName = context.senderName || "Heloci";
        const replyTo = context.replyTo || fromEmail;

        const requestPayload = {
          from: `${fromName} <${fromEmail}>`,
          to: context.recipient,
          replyTo: replyTo !== fromEmail ? replyTo : undefined,
          subject: context.subject,
          html: context.html || `<div>${context.message}</div>`
        };

        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Email] requestPayload=${JSON.stringify(requestPayload)}`);
        }

        const response = await resend.emails.send(requestPayload);

        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Email] providerResponse=${JSON.stringify(response)}`);
        }

        // Resend SDK returns { data: { id: "..." }, error: null } on success
        // or { data: null, error: { message: "..." } } on failure
        const hasError = (response as any)?.error;
        const emailId = (response as any)?.data?.id || (response as any)?.id;

        if (hasError) {
          const errorMsg = (response as any).error?.message || "Unknown Resend error";
          if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
            console.debug(`[ProviderAdapter][Email] resendError=${errorMsg}`);
          }
          return {
            status: "FAILED",
            errorMessage: errorMsg,
            providerResponse: response
          };
        }

        if (emailId) {
          if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
            console.debug(`[ProviderAdapter][Email] successfulDelivery emailId=${emailId}`);
          }
          return { status: "SENT", providerResponse: { delivered: true, from: fromEmail, to: context.recipient, id: emailId } };
        }

        // Unexpected response format - no id and no error
        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Email] unexpectedResponseFormat=${JSON.stringify(response)}`);
        }
        return {
          status: "FAILED",
          errorMessage: "Unexpected Resend response format (no email ID returned)",
          providerResponse: response
        };
      } catch (error) {
        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Email] providerResponse=failed error=${error instanceof Error ? error.message : String(error)} stack=${error instanceof Error ? error.stack : "none"}`);
        }
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
      const providerEnabled = Boolean(token && chatId);
      if (!token || !chatId) {
        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Telegram] enabled=false recipient=${context.recipient} tokenConfigured=${Boolean(token)} chatIdConfigured=${Boolean(chatId)}`);
        }
        return { status: "FAILED", errorMessage: "Telegram credentials are missing" };
      }

      try {
        const requestBody = { chat_id: chatId, text: context.message };
        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Telegram] selectedProvider=telegram-api recipient=${context.recipient} enabled=${providerEnabled} requestBody=${JSON.stringify(requestBody)}`);
        }

        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody)
        });

        const status = response.ok ? "SENT" as const : "FAILED" as const;
        const result: NotificationDeliveryResult = {
          status,
          providerResponse: { ok: response.ok, status: response.status },
          errorMessage: response.ok ? undefined : "Telegram request failed"
        };

        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Telegram] providerResponse=${JSON.stringify(result.providerResponse)} success=${result.status === "SENT"}`);
        }

        return result;
      } catch (error) {
        if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
          console.debug(`[ProviderAdapter][Telegram] providerResponse=failed error=${error instanceof Error ? error.message : String(error)} stack=${error instanceof Error ? error.stack : "none"}`);
        }
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
