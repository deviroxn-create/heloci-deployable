export function trackEvent(event: string, metadata: Record<string, unknown> = {}) {
  console.log("[Analytics]", event, metadata);
}
