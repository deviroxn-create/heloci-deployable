export interface ShadowCommunication {
  event: string;
  audience: string;
  recipient: string;
  channel: string;
  template?: string | null;
}

export interface ShadowComparisonEntry {
  kind: "match" | "mismatch" | "missing" | "extra";
  legacy?: ShadowCommunication;
  shadow?: ShadowCommunication;
  differences: string[];
}

export interface ShadowComparisonReport {
  event: string;
  hasDifferences: boolean;
  comparisons: ShadowComparisonEntry[];
  summary: {
    matches: number;
    mismatches: number;
    missing: number;
    extra: number;
  };
}

function normalizeCommunication(communication: ShadowCommunication) {
  return {
    event: communication.event,
    audience: communication.audience,
    recipient: communication.recipient,
    channel: communication.channel,
    template: communication.template ?? null
  };
}

function compareCommunication(legacy: ShadowCommunication, shadow: ShadowCommunication): ShadowComparisonEntry {
  const differences = ["audience", "recipient", "channel", "template"].filter((field) => {
    const legacyValue = legacy[field as keyof ShadowCommunication];
    const shadowValue = shadow[field as keyof ShadowCommunication];
    return String(legacyValue ?? "") !== String(shadowValue ?? "");
  });

  if (differences.length === 0) {
    return {
      kind: "match",
      legacy: normalizeCommunication(legacy),
      shadow: normalizeCommunication(shadow),
      differences: []
    };
  }

  return {
    kind: "mismatch",
    legacy: normalizeCommunication(legacy),
    shadow: normalizeCommunication(shadow),
    differences
  };
}

export function compareShadowCommunications(event: string, legacyCommunications: ShadowCommunication[], shadowCommunications: ShadowCommunication[]): ShadowComparisonReport {
  const normalizedLegacy = legacyCommunications.map(normalizeCommunication);
  const normalizedShadow = shadowCommunications.map(normalizeCommunication);
  const comparisons: ShadowComparisonEntry[] = [];

  const maxLength = Math.max(normalizedLegacy.length, normalizedShadow.length);
  for (let index = 0; index < maxLength; index += 1) {
    const legacy = normalizedLegacy[index];
    const shadow = normalizedShadow[index];

    if (legacy && shadow) {
      comparisons.push(compareCommunication(legacy, shadow));
      continue;
    }

    if (legacy) {
      comparisons.push({
        kind: "missing",
        legacy,
        differences: ["communication-missing-in-shadow"]
      });
      continue;
    }

    comparisons.push({
      kind: "extra",
      shadow,
      differences: ["communication-extra-in-shadow"]
    });
  }

  const summary = comparisons.reduce(
    (accumulator, comparison) => {
      switch (comparison.kind) {
        case "match":
          accumulator.matches += 1;
          break;
        case "mismatch":
          accumulator.mismatches += 1;
          break;
        case "missing":
          accumulator.missing += 1;
          break;
        case "extra":
          accumulator.extra += 1;
          break;
      }
      return accumulator;
    },
    { matches: 0, mismatches: 0, missing: 0, extra: 0 }
  );

  return {
    event,
    hasDifferences: summary.mismatches > 0 || summary.missing > 0 || summary.extra > 0,
    comparisons,
    summary
  };
}
