import { NextResponse } from "next/server";
import { processDocumentRequestReminders, processProgramDeadlineNotifications } from "@/lib/workflows/deadline-service";

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!expectedSecret || authorization !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const remindersSent = await processDocumentRequestReminders();
  const deadlineNotifications = await processProgramDeadlineNotifications();

  return NextResponse.json({ remindersSent, deadlineNotifications });
}
