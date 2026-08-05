import type { TemplateResolution, UnresolvedTemplateResolution } from "./template-resolution.types";
import type { DispatchRequest } from "./dispatch.types";

export class Dispatcher {
  dispatch(resolution: TemplateResolution | UnresolvedTemplateResolution): DispatchRequest | null {
    if (!resolution || !resolution.templateKey) {
      return null;
    }

    const request: DispatchRequest = {
      event: resolution.event,
      audienceRole: resolution.audienceRole,
      channel: resolution.channel,
      recipientId: undefined,
      templateKey: resolution.templateKey,
      metadata: { source: "template-resolution" }
    };

    // STEP 3: Log all dispatch requests with recipient routing
    console.log(
      `📤 [Dispatcher] Creating dispatch request:`,
      {
        event: request.event,
        template: request.templateKey,
        audience: request.audienceRole,
        channel: request.channel,
        recipient: {
          id: request.recipientId,
          metadata: request.metadata
        }
      }
    );

    if (process.env.NODE_ENV !== "production" || process.env.NOTIFICATION_RUNTIME_TRACE === "true") {
      console.debug(
        `[Dispatcher] dispatch event=${request.event} audienceRole=${request.audienceRole} channel=${request.channel} templateKey=${request.templateKey}`
      );
    }

    return request;
  }
}
