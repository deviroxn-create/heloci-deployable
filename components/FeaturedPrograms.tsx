"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Program = {
  id: string;
  name: string;
  slug: string;
  housingGoal?: string | null;
  category?: string | null;
  matchDescription?: string | null;
  summary?: string | null;
  organization?: { id: string; name: string } | null;
};

export default function FeaturedPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const resp = await fetch("/api/programs/featured");
        const data = await resp.json();
        if (!mounted) return;
        if (resp.ok) setPrograms(data);
      } catch (err) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Card className="p-6">Loading featured programs…</Card>;

  if (programs.length === 0) return <Card className="p-6">No featured programs available.</Card>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {programs.map((p) => (
        <Card key={p.id} className="rounded-[16px] p-6 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">{p.name}</h3>
              {p.organization ? <p className="text-sm text-slate-500">{p.organization.name}</p> : null}
              {p.matchDescription ? <p className="mt-2 text-sm text-slate-600">{p.matchDescription}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link href={`/programs/${p.slug}`}>View details</Link>
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
