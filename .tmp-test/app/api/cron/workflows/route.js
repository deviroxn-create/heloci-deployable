"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const deadline_service_1 = require("@/lib/workflows/deadline-service");
async function POST() {
    const remindersSent = await (0, deadline_service_1.processDocumentRequestReminders)();
    const deadlineNotifications = await (0, deadline_service_1.processProgramDeadlineNotifications)();
    return server_1.NextResponse.json({ remindersSent, deadlineNotifications });
}
