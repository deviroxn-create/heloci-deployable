export type ConditionalRule = {
  key?: string;
  equals?: string;
  in?: string[];
};

export interface ConditionalQuestionLike {
  condition?: ConditionalRule | null;
  key: string;
  required?: boolean;
}

export function shouldShowQuestion(question: ConditionalQuestionLike, answers: Record<string, unknown>) {
  const condition = question.condition;
  if (!condition) {
    return true;
  }

  const answer = answers[condition.key ?? question.key];
  if (condition.equals !== undefined) {
    return String(answer) === String(condition.equals);
  }

  if (condition.in && Array.isArray(condition.in)) {
    return condition.in.some((value) => String(answer) === String(value));
  }

  return true;
}

export function canContinueQuestion(question: ConditionalQuestionLike, value: unknown) {
  if (!question.required) {
    return true;
  }

  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}
