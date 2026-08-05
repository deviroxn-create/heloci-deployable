import type { DomainEvent } from "./domain-event.ts";

export type DomainEventHandler<TEvent extends DomainEvent = DomainEvent> = (
  event: TEvent
) => void | Promise<void>;

export interface EventSubscription<TEvent extends DomainEvent = DomainEvent> {
  eventName: string;
  handler: DomainEventHandler<TEvent>;
}
