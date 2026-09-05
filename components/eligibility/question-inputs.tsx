"use client";

import { CheckCircle2, Minus, Plus, Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { RenderedQuestion } from "@/lib/forms/renderer";

/* ─────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────── */

function isMultiSelectValue(value: unknown): value is string[] {
  return Array.isArray(value);
}


/* ─────────────────────────────────────────────
   Radio Cards (single-select, ≤ 8 options)
───────────────────────────────────────────── */

interface RadioCardsProps {
  options: Array<{ value: string; label: string }>;
  value: unknown;
  onChange: (value: string) => void;
}

export function RadioCards({ options, value, onChange }: RadioCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
      {options.map((option) => {
        const selected = String(value ?? "") === String(option.value);
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "group relative flex min-h-[80px] cursor-pointer items-center rounded-2xl border p-5 text-left shadow-sm transition-all duration-200",
              "hover:-translate-y-0.5 hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
              selected
                ? "border-[#006AFF] bg-[#f0f7ff] shadow-md"
                : "border-slate-200 bg-white hover:border-[#006AFF]/40 hover:bg-[#fafcff]"
            )}
          >
            <span className="flex-1 font-semibold text-slate-900">{option.label}</span>
            {selected && (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#006AFF]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Multi-Select Cards
───────────────────────────────────────────── */

interface MultiSelectCardsProps {
  options: Array<{ value: string; label: string }>;
  value: unknown;
  onChange: (value: string[]) => void;
  helpText?: string;
}

export function MultiSelectCards({ options, value, onChange, helpText }: MultiSelectCardsProps) {
  const selected: string[] = isMultiSelectValue(value) ? value : [];

  function toggle(optionValue: string) {
    const next = selected.includes(optionValue)
      ? selected.filter((v) => v !== optionValue)
      : [...selected, optionValue];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {helpText && (
        <p className="text-sm text-slate-500">Select all that apply</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2" role="group">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(option.value)}
              className={cn(
                "group relative flex min-h-[68px] cursor-pointer items-center rounded-2xl border p-4 text-left shadow-sm transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
                isSelected
                  ? "border-[#006AFF] bg-[#f0f7ff] shadow-md"
                  : "border-slate-200 bg-white hover:border-[#006AFF]/40 hover:bg-[#fafcff]"
              )}
            >
              <span className="flex-1 font-medium text-slate-900">{option.label}</span>
              {isSelected && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#006AFF]" />
              )}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-emerald-700 font-medium">
          {selected.length} selected
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Numeric Stepper
───────────────────────────────────────────── */

interface NumericStepperProps {
  value: unknown;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  suffix?: string;
}

export function NumericStepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
  suffix
}: NumericStepperProps) {
  const numValue = typeof value === "number" ? value : typeof value === "string" ? Number(value) || min : min;

  function increment() {
    const next = Math.min(max, numValue + step);
    onChange(next);
  }

  function decrement() {
    const next = Math.max(min, numValue - step);
    onChange(next);
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={decrement}
        disabled={numValue <= min}
        aria-label={`Decrease ${label ?? "value"}`}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border-2 text-slate-700 transition",
          numValue <= min
            ? "border-slate-200 text-slate-300 cursor-not-allowed"
            : "border-slate-300 hover:border-[#006AFF] hover:text-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30"
        )}
      >
        <Minus className="h-5 w-5" />
      </button>

      <div className="flex min-w-[80px] flex-col items-center">
        <span className="text-4xl font-bold tabular-nums text-slate-900">
          {numValue}
        </span>
        {suffix && (
          <span className="mt-0.5 text-sm text-slate-500">{suffix}</span>
        )}
      </div>

      <button
        type="button"
        onClick={increment}
        disabled={numValue >= max}
        aria-label={`Increase ${label ?? "value"}`}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border-2 text-slate-700 transition",
          numValue >= max
            ? "border-slate-200 text-slate-300 cursor-not-allowed"
            : "border-slate-300 hover:border-[#006AFF] hover:text-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30"
        )}
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Searchable Chip Selector (locations / states)
───────────────────────────────────────────── */

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Washington DC"
];

interface SearchableChipsProps {
  value: unknown;
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

export function SearchableChips({
  value,
  onChange,
  suggestions = US_STATES,
  placeholder = "Search states or cities…"
}: SearchableChipsProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selected: string[] = isMultiSelectValue(value) ? value : [];

  const filtered = query.trim()
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(query.toLowerCase()) &&
          !selected.includes(s)
      )
    : [];

  function add(item: string) {
    if (!selected.includes(item)) {
      onChange([...selected, item]);
    }
    setQuery("");
    inputRef.current?.focus();
  }

  function remove(item: string) {
    onChange(selected.filter((s) => s !== item));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      if (filtered.length > 0) {
        add(filtered[0]);
      } else if (query.trim()) {
        add(query.trim());
      }
    }
    if (e.key === "Backspace" && !query && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#006AFF]/10 px-3 py-1 text-sm font-medium text-[#006AFF]"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label={`Remove ${item}`}
                className="rounded-full hover:text-[#0057e6] focus:outline-none"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
        />
      </div>

      {/* Suggestions dropdown */}
      {filtered.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
          {filtered.slice(0, 8).map((item) => (
            <li key={item}>
              <button
                type="button"
                onClick={() => add(item)}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-[#f0f7ff] hover:text-[#006AFF]"
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected.length === 0 && (
        <p className="text-xs text-slate-400">
          Type to search, then press Enter or click to add
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Income Range Selector (special number variant)
───────────────────────────────────────────── */

const INCOME_RANGES = [
  { value: "under_1000", label: "Under $1,000", icon: "💸", description: "Very low income" },
  { value: "1000_3000", label: "$1,000 – $3,000", icon: "💵", description: "Low income" },
  { value: "3000_5000", label: "$3,000 – $5,000", icon: "💵", description: "Moderate income" },
  { value: "5000_8000", label: "$5,000 – $8,000", icon: "💵💵", description: "Lower-middle income" },
  { value: "8000_15000", label: "$8,000 – $15,000", icon: "💵💵", description: "Middle income" },
  { value: "15000_plus", label: "$15,000+", icon: "💵💵💵", description: "Higher income" },
  { value: "prefer_not_to_say", label: "Prefer not to say", icon: "🤐", description: "Skip this question" }
];

interface IncomeRangeSelectorProps {
  value: unknown;
  onChange: (value: string) => void;
}

export function IncomeRangeSelector({ value, onChange }: IncomeRangeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
      {INCOME_RANGES.map((range) => {
        const selected = String(value ?? "") === range.value;
        return (
          <button
            key={range.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(range.value)}
            className={cn(
              "relative flex min-h-[80px] cursor-pointer items-center rounded-2xl border p-4 text-left shadow-sm transition-all duration-200",
              "hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
              selected
                ? "border-[#006AFF] bg-[#f0f7ff] shadow-md"
                : "border-slate-200 bg-white hover:border-[#006AFF]/40 hover:bg-[#fafcff]"
            )}
          >
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{range.label}</div>
              <div className="mt-0.5 text-xs text-slate-500">{range.description}</div>
            </div>
            {selected && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#006AFF]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Boolean Yes/No/Not Sure
───────────────────────────────────────────── */

interface BooleanCardsProps {
  value: unknown;
  onChange: (value: string) => void;
}

const BOOL_OPTIONS = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
  { value: "not_sure", label: "Not sure" }
];

export function BooleanCards({ value, onChange }: BooleanCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3" role="radiogroup">
      {BOOL_OPTIONS.map((option) => {
        const selected = String(value ?? "") === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-[80px] items-center justify-center rounded-2xl border p-4 text-center shadow-sm transition-all duration-200",
              "hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#006AFF]/30",
              selected
                ? "border-[#006AFF] bg-[#f0f7ff] shadow-md"
                : "border-slate-200 bg-white hover:border-[#006AFF]/40 hover:bg-[#fafcff]"
            )}
          >
            <span className={cn("text-sm font-semibold", selected ? "text-[#006AFF]" : "text-slate-700")}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Text Input
───────────────────────────────────────────── */

interface TextInputProps {
  value: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export function TextInput({ value, onChange, placeholder, multiline }: TextInputProps) {
  if (multiline) {
    return (
      <textarea
        rows={4}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Type your answer…"}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Type your answer…"}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
    />
  );
}

/* ─────────────────────────────────────────────
   Date Input
───────────────────────────────────────────── */

interface DateInputProps {
  value: unknown;
  onChange: (value: string) => void;
}

export function DateInput({ value, onChange }: DateInputProps) {
  return (
    <input
      type="date"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm transition focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
    />
  );
}

/* ─────────────────────────────────────────────
   Master Question Renderer
───────────────────────────────────────────── */

interface QuestionRendererProps {
  question: RenderedQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const type = question.type?.toLowerCase() ?? "text";
  const options = question.options ?? [];
  const label = question.label ?? "";
  const helpText = question.helpText;

  // Household size stepper
  if (/household.?size|family.?size|number.*member/i.test(label)) {
    return (
      <NumericStepper
        value={value}
        onChange={(v) => onChange(v)}
        min={1}
        max={20}
        step={1}
        label="people"
        suffix="people in household"
      />
    );
  }

  // Age stepper
  if (/^age$|your age|how old/i.test(label)) {
    return (
      <NumericStepper
        value={value}
        onChange={(v) => onChange(v)}
        min={18}
        max={100}
        step={1}
        label="years old"
        suffix="years old"
      />
    );
  }

  // Income number — always use income range cards
  if (
    (type === "number" || type === "text") &&
    (/income|salary|earn|monthly.?pay/i.test(label) || /income/i.test(helpText ?? ""))
  ) {
    return <IncomeRangeSelector value={value} onChange={(v) => onChange(v)} />;
  }

  // Boolean
  if (type === "boolean") {
    return <BooleanCards value={value} onChange={(v) => onChange(v)} />;
  }

  // Select with ≤ 8 options → radio cards
  if (type === "select" || type === "radio") {
    if (options.length > 0 && options.length <= 8) {
      return (
        <RadioCards options={options} value={value} onChange={(v) => onChange(v)} />
      );
    }
    // Larger lists — searchable (treat like location)
    return (
      <SearchableChips
        value={Array.isArray(value) ? value : value ? [String(value)] : []}
        onChange={(v) => onChange(v[0] ?? "")}
        suggestions={options.map((o) => o.label)}
        placeholder={`Search ${label.toLowerCase()}…`}
      />
    );
  }

  // Multi-select
  if (type === "multiselect" || type === "multi-select") {
    // Location / state / city → searchable chips
    if (/location|state|city|area|where/i.test(label) || options.length > 8) {
      return (
        <SearchableChips
          value={value}
          onChange={(v) => onChange(v)}
          suggestions={options.length > 0 ? options.map((o) => o.label) : US_STATES}
          placeholder={`Search ${label.toLowerCase()}…`}
        />
      );
    }
    // Housing goals / assistance types → multi-select cards
    return (
      <MultiSelectCards
        options={options}
        value={value}
        onChange={(v) => onChange(v)}
        helpText={helpText}
      />
    );
  }

  // Textarea
  if (type === "textarea") {
    return (
      <TextInput
        value={value}
        onChange={(v) => onChange(v)}
        placeholder={helpText}
        multiline
      />
    );
  }

  // Date
  if (type === "date") {
    return <DateInput value={value} onChange={(v) => onChange(v)} />;
  }

  // Plain number (non-income, non-household)
  if (type === "number") {
    return (
      <input
        type="number"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={helpText ?? "Enter a number"}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-[#006AFF]/20"
      />
    );
  }

  // Default text
  return (
    <TextInput
      value={value}
      onChange={(v) => onChange(v)}
      placeholder={helpText}
    />
  );
}
