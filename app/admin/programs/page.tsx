"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AdminProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<Array<{ id: string; name: string; slug: string; housingGoal: string | null; description: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/admin/programs");
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load programs.");
        setPrograms(Array.isArray(result) ? result : []);
      } catch (err) {
        setError((err as Error).message || "Unable to load programs.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Programs</h1>
          <p className="text-sm text-slate-600">Create and manage eligibility programs for your organization.</p>
        </div>
        <Button onClick={() => router.push("/admin/programs/new")}>Create Program</Button>
      </div>

      {loading ? <Card className="p-6">Loading…</Card> : error ? <Card className="p-6 text-red-600">{error}</Card> : null}

      <div className="grid gap-4">
        {programs.map((program) => (
          <Card key={program.id} className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-lg font-semibold">{program.name}</h2>
              <p className="text-sm text-slate-600">{program.description || "No description"}</p>
            </div>
            <Link href={`/admin/programs/${program.id}/rules`} className="text-sm font-semibold text-[#006AFF]">
              Edit Rules
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
