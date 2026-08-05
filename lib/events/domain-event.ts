export type DomainEventPayload = Record<string, unknown>;

export interface DomainEvent<TPayload extends DomainEventPayload = DomainEventPayload> {
  eventName: string;
  occurredAt: string;
  aggregateId?: string;
  payload: TPayload;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export function createDomainEvent<TPayload extends DomainEventPayload>(
  eventName: string,
  payload: TPayload,
  options: {
    aggregateId?: string;
    metadata?: Record<string, unknown>;
    correlationId?: string;
    occurredAt?: string;
  } = {}
): DomainEvent<TPayload> {
  return {
    eventName,
    occurredAt: options.occurredAt ?? new Date().toISOString(),
    aggregateId: options.aggregateId,
    payload,
    metadata: options.metadata,
    correlationId: options.correlationId
  };
}
