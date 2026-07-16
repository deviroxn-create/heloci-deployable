export function validateRule(rule: unknown): boolean {
  if (!rule || typeof rule !== "object") return false;
  return true;
}

export function explainRule(rule: unknown): string[] {
  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    return [];
  }

  const entries = Object.entries(rule as Record<string, unknown>);
  const explanation: string[] = [];

  for (const [operator, _operand] of entries) {
    if (operator === "and" || operator === "or") {
      explanation.push(`${operator.toUpperCase()} condition group`);
      continue;
    }

    if (operator === "==") {
      explanation.push("Equals");
      continue;
    }

    if (operator === ">=" || operator === ">" || operator === "<" || operator === "<=") {
      explanation.push("Comparison");
      continue;
    }

    if (operator === "in") {
      explanation.push("In list");
      continue;
    }

    if (operator === "score") {
      explanation.push("Adds score");
    }
  }

  return explanation;
}

export function testRule(rule: unknown, _sampleProfile: unknown): { result: boolean; explanation: string[] } {
  return {
    result: validateRule(rule),
    explanation: explainRule(rule)
  };
}
