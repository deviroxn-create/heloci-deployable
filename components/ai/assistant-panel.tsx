"use client";
import { useState } from "react";

export function AssistantPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAsk = async () => {
    setAnswer("Generating guidance...");
    setAnswer("This is a placeholder for the Heloci AI assistant.");
  };

  return (
    <div className="rounded-3xl border border-border bg-white p-6 shadow-card">
      <h2 className="text-lg font-semibold text-slate-950">AI Assistant</h2>
      <p className="mt-2 text-sm text-slate-600">Ask about eligibility, documents, or housing guidance.</p>
      <div className="mt-4 space-y-3">
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask your Heloci assistant…" className="w-full rounded-3xl border border-border bg-surface px-4 py-3" rows={3} />
        <button onClick={handleAsk} className="rounded-full bg-brand px-5 py-3 text-white hover:bg-blue-700">
          Ask Heloci
        </button>
      </div>
      {answer && <div className="mt-5 rounded-3xl bg-surface p-4 text-sm text-slate-700">{answer}</div>}
    </div>
  );
}
