"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const goals = [
  { label: "Rent a home", value: "rent" },
  { label: "Buy a home", value: "buy" },
  { label: "Rent-to-Own", value: "rent_to_own" },
  { label: "Emergency housing", value: "emergency" },
  { label: "Teacher Housing", value: "assistance" },
  { label: "Not sure", value: "explore" }
];

export default function HousingGoalPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 h-20 w-64">
            <Image src="/heloci-logo-lockup.svg" alt="Heloci logo" width={256} height={80} className="mx-auto" />
          </div>
          <h1 className="text-4xl font-semibold text-[#2D323C]">Find the right housing path</h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            Choose a goal to help Heloci personalize your eligibility profile and match you with the best programs.
          </p>
        </div>

        <Card className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Button
              key={goal.value}
              variant="outline"
              className="w-full rounded-3xl border-[#006AFF] bg-white text-[#2D323C] hover:bg-[#E8F0FF]"
              onClick={() => router.push(`/profile?goal=${goal.value}`)}
            >
              {goal.label}
            </Button>
          ))}
        </Card>
      </div>
    </div>
  );
}
