import { CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { RenderedQuestion } from "@/lib/forms/renderer";

interface QuestionCardProps {
  question: RenderedQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}

function isMultiSelectValue(value: unknown): value is string[] {
  return Array.isArray(value);
}

function getChoiceDetails(optionValue: string, label: string) {
  const normalizedValue = optionValue.toLowerCase();
  if (normalizedValue.includes("prefer")) {
    return { icon: "🤐", description: "Skip this question" };
  }
  if (normalizedValue.includes("true") || /yes|yup|sure/i.test(label)) {
    return { icon: "✅", description: "Select this option" };
  }
  if (normalizedValue.includes("false") || /no|not/i.test(label)) {
    return { icon: "❌", description: "Select this option" };
  }
  return { icon: "✦", description: "Select this option" };
}

export default function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const type = question.type?.toLowerCase() ?? "text";

  if (type === "select") {
    if (question.options && question.options.length <= 6) {
      return (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {question.options.map((option) => {
          const selected = String(value ?? "") === String(option.value);
          const details = getChoiceDetails(String(option.value), option.label);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-[84px] cursor-pointer rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#006AFF] hover:bg-[#f7faff] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
                selected && "border-[#006AFF] bg-[#f7faff] shadow-md"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl leading-none">{details.icon}</div>
                <div>
                  <div className="font-semibold text-slate-900">{option.label}</div>
                  <div className="mt-1 text-sm text-slate-500">{details.description}</div>
                </div>
              </div>
            </button>
          );
          })}
        </div>
      );
    }

    return (
      <div className="mt-4">
        <Select value={String(value ?? "")} onValueChange={(nextValue) => onChange(nextValue)}>
          <SelectTrigger className="min-h-[56px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-[#006AFF] hover:bg-[#f7faff] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (type === "radio") {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {question.options?.map((option) => {
          const selected = String(value ?? "") === String(option.value);
          const details = getChoiceDetails(String(option.value), option.label);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-[84px] cursor-pointer rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#006AFF] hover:bg-[#f7faff] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
                selected && "border-[#006AFF] bg-[#f7faff] shadow-md"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl leading-none">{details.icon}</div>
                <div>
                  <div className="font-semibold text-slate-900">{option.label}</div>
                  <div className="mt-1 text-sm text-slate-500">{details.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "multiselect") {
    return (
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {question.options?.map((option) => {
          const selected = isMultiSelectValue(value) && value.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                const selectedValues = isMultiSelectValue(value) ? [...value] : [];
                const nextValues = selectedValues.includes(option.value)
                  ? selectedValues.filter((item) => item !== option.value)
                  : [...selectedValues, option.value];
                onChange(nextValues);
              }}
              className={cn(
                "min-h-[56px] cursor-pointer rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#006AFF] hover:bg-[#f7faff] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
                selected && "border-[#006AFF] bg-[#f7faff] shadow-md"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900">{option.label}</div>
                  {question.helpText ? <div className="mt-1 text-sm text-slate-500">{question.helpText}</div> : null}
                </div>
                {selected ? <CheckCircle2 className="h-5 w-5 text-[#006AFF]" /> : null}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "number") {
    const incomeChoices = [
      { value: "1000-5000", label: "$1,000 - $5,000", icon: "💵", description: "Lower income" },
      { value: "5000-10000", label: "$5,000 - $10,000", icon: "💵", description: "Moderate income" },
      { value: "10000-25000", label: "$10,000 - $25,000", icon: "💵💵", description: "Middle income" },
      { value: "25000-50000", label: "$25,000 - $50,000", icon: "💵💵", description: "Higher income" },
      { value: "50000+", label: "$50,000 and above", icon: "💵💵💵", description: "Upper income" },
      { value: "prefer_not_to_say", label: "Prefer not to say", icon: "🤐", description: "Skip this question" }
    ];

    const isIncomePrompt = /income/i.test(question.label || "") || /income/i.test(question.helpText || "");

    if (isIncomePrompt) {
      return (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {incomeChoices.map((option) => {
            const selected = String(value ?? "") === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={cn(
                  "min-h-[92px] rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#006AFF] hover:bg-[#f7faff] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
                  selected && "border-[#006AFF] bg-[#f7faff] shadow-md"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl leading-none">{option.icon}</div>
                  <div>
                    <div className="font-semibold text-slate-900">{option.label}</div>
                    <div className="mt-1 text-sm text-slate-500">{option.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <input
        type="number"
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        className="mt-4 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
        placeholder={question.helpText ?? "Enter a number"}
      />
    );
  }

  if (type === "textarea") {
    return (
      <textarea
        rows={4}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        className="mt-4 min-h-24 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
      />
    );
  }

  if (type === "boolean") {
    return (
      <div className="mt-4 flex flex-wrap gap-3">
        {[
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
          { value: "not_sure", label: "Not sure" }
        ].map((option) => {
          const selected = String(value ?? "") === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#006AFF] hover:bg-[#f7faff] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
                selected && "border-[#006AFF] bg-[#f7faff] shadow-md"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? "")}
      onChange={(event) => onChange(event.target.value)}
      className="mt-4 w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
      placeholder={question.helpText ?? "Type your answer"}
    />
  );
}
