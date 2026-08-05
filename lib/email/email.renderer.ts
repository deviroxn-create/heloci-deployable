function getTemplateValue(payload: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, payload);
}

export function renderTemplate(template: string, data: any) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = getTemplateValue(data, key);
    return value == null ? "" : String(value);
  });
}
