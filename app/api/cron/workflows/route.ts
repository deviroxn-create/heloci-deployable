import { NextResponse } from "next/server";
import { processDocumentRequestReminders, processProgramDeadlineNotifications } from "@/lib/workflows/deadline-service";

export async function POST() {
  const remindersSent = await processDocumentRequestReminders();
  const deadlineNotifications = await processProgramDeadlineNotifications();

  return NextResponse.json({ remindersSent, deadlineNotifications });
}
