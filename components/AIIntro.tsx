import { Clock3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AIIntroProps {
  userName?: string | null;
  onStart: () => void;
}

export default function AIIntro({ userName, onStart }: AIIntroProps) {
  return (
    <Card className="mx-auto max-w-2xl border-slate-200 bg-gradient-to-br from-[#f5faff] to-white p-8 text-center shadow-sm sm:p-10">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#006AFF]/10 text-[#006AFF]">
        <Sparkles className="h-7 w-7" />
      </div>

      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-[#006AFF]">Heloci Housing Assistant</p>
      <h2 className="mt-3 text-3xl font-semibold text-slate-950">Hi {userName || "there"} 👋</h2>
      <p className="mt-4 text-lg leading-8 text-slate-700">
        I&apos;ll ask a few friendly questions to find housing programs that fit your situation.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Clock3 className="h-4 w-4 text-[#006AFF]" />
        <span>Takes about 3 minutes</span>
      </div>

      <Button type="button" onClick={onStart} className="mt-8 min-h-[44px] bg-[#006AFF] px-6 text-white hover:bg-[#0057e6]">
        Let&apos;s start →
      </Button>
    </Card>
  );
}
