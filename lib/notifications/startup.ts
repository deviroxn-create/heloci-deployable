import { getDomainEventBus } from "../events/domain-event-bus.ts";
import { NotificationDomainSubscriber } from "./notification-domain-subscriber.ts";

const notificationRuntimeInitialized = Symbol.for("heloci.notificationRuntimeInitialized");

function logStartup(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[Startup] ${message}`);
  }
}

export function initializeNotificationRuntime(): void {
  if ((globalThis as any)[notificationRuntimeInitialized]) {
    return;
  }

  const bus = getDomainEventBus();
  const subscriber = new NotificationDomainSubscriber(bus);
  subscriber.register();

  logStartup("Notification Runtime Initialized");
  logStartup("Domain Subscriber Registered");
  logStartup("Runtime Ready");

  (globalThis as any)[notificationRuntimeInitialized] = true;
}

initializeNotificationRuntime();
