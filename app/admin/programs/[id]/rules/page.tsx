"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProgramRulesPage() {
  const params = useParams<{ id: string }>();
  const [rules, _setRules] = useState<any>({ and: [] });
  const [name, setName] = useState("v1");
  const [preview, setPreview] = useState<string[]>([]);
  const [result, setResult] = useState<string>("Not tested yet");

  const sampleProfile = useMemo(() => ({
    employment: { status: "teacher" },
    income: { monthly: 3000 }
  }), []);

  async function handleSave() {
    const response = await fetch(`/api/admin/programs/${params.id}/rules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules, name })
    });
    const data = await response.json();
    if (!response.ok) {
      setResult(data.error || "Unable to save");
      return;
    }
    setResult(`Saved rule version ${data.version}`);
  }

  useEffect(() => {
    setPreview(["If employment status equals Teacher AND monthly income >= 2000"]);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Rules</h1>
        <p className="text-sm text-slate-600">Build JSON Logic-based eligibility rules without writing code.</p>
      </div>

      <Card className="p-6 space-y-4">
        <label htmlFor="rule-name" className="block text-sm font-medium">Rule name</label>
        <input id="rule-name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded border border-slate-300 px-3 py-2" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold">Profile fields</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>personal.age</li>
              <li>income.monthly</li>
              <li>employment.status</li>
            </ul>
          </div>
          <div className="rounded border border-slate-200 p-4">
            <p className="mb-3 text-sm font-semibold">Operators</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>equals</li>
              <li>greater than</li>
              <li>in list</li>
            </ul>
          </div>
          <div className="rounded border border-slate-200 p-4">
            <label htmlFor="rule-value" className="mb-3 block text-sm font-semibold">Values</label>
            <input id="rule-value" className="w-full rounded border border-slate-300 px-3 py-2" defaultValue="teacher" />
          </div>
        </div>
        <div className="rounded border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold">Preview</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {preview.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setResult(`Test result: ${JSON.stringify(sampleProfile)}`)}>Test Rule</Button>
          <Button variant="outline" onClick={handleSave}>Save Rule</Button>
        </div>
        <p className="text-sm text-slate-600">{result}</p>
      </Card>
    </div>
  );
}
