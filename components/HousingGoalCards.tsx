"use client";

import { Building2, Home, Landmark, ShieldPlus, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const options = [
  {
    value: "first_home",
    title: "Buy My First Home",
    description: "Down payment help and mortgage programs",
    icon: Home
  },
  {
    value: "affordable_rent",
    title: "Affordable Rent",
    description: "Section 8, vouchers, and below-market units",
    icon: Building2
  },
  {
    value: "emergency",
    title: "Emergency Housing",
    description: "Rapid rehousing and shelter support",
    icon: ShieldPlus
  },
  {
    value: "down_payment",
    title: "Down Payment Help",
    description: "Grants and assistance for closing costs",
    icon: Landmark
  },
  {
    value: "veteran",
    title: "Veteran Housing",
    description: "Supportive programs for veterans and families",
    icon: Sparkles
  },
  {
    value: "senior",
    title: "Senior Housing",
    description: "Accessible and age-friendly housing",
    icon: Users
  }
];

interface HousingGoalCardsProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export default function HousingGoalCards({ value, onChange }: HousingGoalCardsProps) {
  const toggleValue = (candidate: string) => {
    const next = value.includes(candidate)
      ? value.filter((entry) => entry !== candidate)
      : [...value, candidate];
    onChange(next);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleValue(option.value)}
            className={`rounded-3xl border p-4 text-left transition ${selected ? "border-[#006AFF] bg-[#006AFF]/10" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-2xl p-2 ${selected ? "bg-[#006AFF] text-white" : "bg-slate-100 text-slate-700"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{option.title}</p>
                <p className="mt-1 text-sm text-slate-600">{option.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
