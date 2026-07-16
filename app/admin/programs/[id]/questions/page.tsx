"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProgramQuestionsPage() {
  const [pages, setPages] = useState([{ id: "page-1", title: "About you", questions: [] }]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dynamic form builder</h1>
          <p className="text-sm text-slate-600">Create pages and questions that render for any active program.</p>
        </div>
        <Button>Publish Question Set</Button>
      </div>

      {pages.map((page) => (
        <Card key={page.id} className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{page.title}</h2>
            <Button variant="outline">Add Question</Button>
          </div>
          <p className="text-sm text-slate-600">Questions and conditions can be stored through the Prisma-backed schema for each program.</p>
        </Card>
      ))}

      <Button variant="outline" onClick={() => setPages((value) => [...value, { id: `page-${value.length + 1}`, title: `Page ${value.length + 1}`, questions: [] }])}>Add Page</Button>
    </div>
  );
}
