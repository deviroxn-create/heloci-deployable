"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { DecisionType } from "@/lib/reviews/decision.types";

interface TemplateOption {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface TemplateSelectorProps {
  organizationId: string;
  decisionType: DecisionType;
  onTemplateSelect: (template: TemplateOption) => void;
  loading?: boolean;
}

export function TemplateSelector({
  organizationId,
  decisionType,
  onTemplateSelect,
  loading = false,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [templatesLoading, setTemplatesLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [organizationId, decisionType]);

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true);
      const params = new URLSearchParams({
        organizationId,
        category: decisionType,
        isActive: "true",
      });
      const response = await fetch(`/api/decisions/templates?${params}`);
      if (!response.ok) throw new Error("Failed to load templates");
      const result = await response.json();
      setTemplates(result.data.templates || []);
    } catch (err) {
      console.error("Error loading templates:", err);
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleSelect = (templateId: string) => {
    setSelectedId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      onTemplateSelect(template);
    }
  };

  if (templatesLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 text-brand animate-spin" />
        <span className="text-sm text-slate-500">Loading templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-slate-500">No templates available for this decision type.</p>
    );
  }

  return (
    <div className="space-y-2">
      <Select value={selectedId} onValueChange={handleSelect} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a template (optional)" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedId && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedId("");
            onTemplateSelect({ id: "", name: "", subject: "", body: "" });
          }}
          disabled={loading}
        >
          Clear Template
        </Button>
      )}
    </div>
  );
}
