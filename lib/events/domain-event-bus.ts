import type { DomainEvent } from "./domain-event.ts";
import type { DomainEventHandler, EventSubscription } from "./event-handler.ts";

const DOMAIN_EVENT_BUS_SYMBOL = Symbol.for("heloci.domainEventBus");
let globalBus: DomainEventBus | null = null;

export class DomainEventBus {
  private subscriptions = new Map<string, Set<DomainEventHandler>>();
  public readonly instanceId = `bus-${Math.random().toString(36).slice(2)}`;

  publish<TEvent extends DomainEvent>(event: TEvent): void {
    const handlers = this.subscriptions.get(event.eventName);

    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DomainEventBus] publish event=${event.eventName} handlers=${handlers?.size ?? 0} busId=${this.instanceId}`);
      if (!handlers || handlers.size === 0) {
        console.debug(`[DomainEventBus] no handlers for event=${event.eventName} subscriptions=${Array.from(this.subscriptions.keys()).join(",")} busId=${this.instanceId}`);
      }
    }

    if (!handlers || handlers.size === 0) {
      return;
    }

    for (const handler of Array.from(handlers)) {
      void handler(event);
    }
  }

  subscribe<TEvent extends DomainEvent>(eventName: string, handler: DomainEventHandler<TEvent>): EventSubscription<TEvent> {
    const eventHandlers = this.subscriptions.get(eventName) ?? new Set<DomainEventHandler>();
    eventHandlers.add(handler as DomainEventHandler);
    this.subscriptions.set(eventName, eventHandlers);

    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DomainEventBus] subscribe event=${eventName} totalHandlers=${eventHandlers.size} busId=${this.instanceId}`);
    }

    return { eventName, handler: handler as DomainEventHandler };
  }

  unsubscribe<TEvent extends DomainEvent>(subscription: EventSubscription<TEvent>): void {
    const handlers = this.subscriptions.get(subscription.eventName);

    if (!handlers) {
      return;
    }

    handlers.delete(subscription.handler as DomainEventHandler);

    if (handlers.size === 0) {
      this.subscriptions.delete(subscription.eventName);
    }
  }

  clear(): void {
    this.subscriptions.clear();
  }
}

export function getDomainEventBus(): DomainEventBus {
  if ((globalThis as any)[DOMAIN_EVENT_BUS_SYMBOL]) {
    const existingBus = (globalThis as any)[DOMAIN_EVENT_BUS_SYMBOL] as DomainEventBus;
    if (process.env.NODE_ENV !== "production") {
      console.debug(`[DomainEventBus] getDomainEventBus existing busId=${existingBus.instanceId}`);
    }
    return existingBus;
  }

  if (!globalBus) {
    globalBus = new DomainEventBus();
  }

  (globalThis as any)[DOMAIN_EVENT_BUS_SYMBOL] = globalBus;
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[DomainEventBus] getDomainEventBus created busId=${globalBus.instanceId}`);
  }
  return globalBus;
}
