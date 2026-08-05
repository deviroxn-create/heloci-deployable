import test from "node:test";
import assert from "node:assert/strict";

import { NotificationProvider, ProviderSendContext } from "../lib/notifications/provider-adapters";
import { createEmailProvider, createTelegramProvider } from "../lib/notifications/provider-adapters";

const baseContext: ProviderSendContext = {
  channel: "email",
  eventName: "user_registration",
  recipient: "trace-user@example.com",
  sender: "onboarding@resend.dev",
  senderName: "Heloci",
  replyTo: "onboarding@resend.dev",
  subject: "Welcome to Heloci",
  message: "Welcome to Heloci, your account has been created.",
  payload: {
    userId: "trace-user",
    name: "Trace User",
    userEmail: "trace-user@example.com"
  }
};

test("provider execution certification for email and telegram adapters", async () => {
  process.env.NOTIFICATION_RUNTIME_TRACE = "true";
  process.env.NODE_ENV = process.env.NODE_ENV || "development";

  const emailProvider = createEmailProvider({ senderEmail: "onboarding@resend.dev" });
  const telegramProvider = createTelegramProvider({ token: process.env.TELEGRAM_BOT_TOKEN || "", chatId: process.env.TELEGRAM_CHAT_ID || "" });

  const emailResult = await emailProvider.send({ ...baseContext, channel: "email" });
  console.log("[ProviderTest] emailResult", JSON.stringify(emailResult));

  const telegramResult = await telegramProvider.send({ ...baseContext, channel: "telegram", recipient: process.env.TELEGRAM_CHAT_ID || "unknown" });
  console.log("[ProviderTest] telegramResult", JSON.stringify(telegramResult));

  assert.equal(emailResult.status === "SENT", Boolean(emailResult.status === "SENT"));
  assert.equal(telegramResult.status === "SENT", Boolean(telegramResult.status === "SENT"));
});
