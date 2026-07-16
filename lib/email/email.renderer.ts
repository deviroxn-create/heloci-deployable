import Handlebars from "handlebars";

export function renderTemplate(template: string, data: any) {
  const compiled = Handlebars.compile(template);
  return compiled(data);
}
