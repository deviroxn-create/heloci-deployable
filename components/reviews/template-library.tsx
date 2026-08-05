"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Search, Edit2, Copy, Archive, AlertCircle } from "lucide-react";
import type { DecisionType } from "@/lib/reviews/decision.types";

interface Template {
  id: string;
  name: string;
  category: DecisionType;
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
}

interface TemplateLibraryProps {
  organizationId: string;
}

const decisionTypes: DecisionType[] = [
  "approved",
  "conditional_approval",
  "rejected",
  "waitlisted",
  "escalated",
  "needs_info",
  "withdrawn",
  "closed",
];

export function TemplateLibrary({ organizationId }: TemplateLibraryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    category: "" as DecisionType | "",
    isDefault: false,
  });

  useEffect(() => {
    loadTemplates();
  }, [organizationId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ organizationId, isActive: "true" });
      const response = await fetch(`/api/decisions/templates?${params}`);
      if (!response.ok) throw new Error("Failed to load templates");
      const result = await response.json();
      setTemplates(result.data.templates || []);
    } catch (err: any) {
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.name || !formData.body || !formData.category) {
      setError("Name, category, and body are required");
      return;
    }

    try {
      setError(null);
      const url = editingId
        ? `/api/decisions/templates/${editingId}?organizationId=${organizationId}`
        : "/api/decisions/templates";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to save template");
      
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: "", subject: "", body: "", category: "", isDefault: false });
      await loadTemplates();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const response = await fetch(
        `/api/decisions/templates/${template.id}/duplicate?organizationId=${organizationId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newName: `${template.name} (Copy)` }),
        }
      );

      if (!response.ok) throw new Error("Failed to duplicate template");
      await loadTemplates();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleArchive = async (template: Template) => {
    try {
      const response = await fetch(
        `/api/decisions/templates/${template.id}?organizationId=${organizationId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to archive template");
      await loadTemplates();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || t.category === (selectedCategory as DecisionType);
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-950">Decision Templates</h1>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: "", subject: "", body: "", category: "", isDefault: false }); }} className="gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="gap-2"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {decisionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, " ").toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template Form */}
      {showForm && (
        <Card className="p-6 bg-slate-50">
          <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit Template" : "Create Template"}</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name (Required)</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard Approval"
              />
            </div>

            <div>
              <Label htmlFor="category">Decision Type (Required)</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val as DecisionType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {decisionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject">Email Subject (Optional)</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Your Application Has Been Approved"
              />
            </div>

            <div>
              <Label htmlFor="body">Template Body (Required)</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Use placeholders like {{applicantName}}, {{programName}}"
                rows={6}
              />
              <p className="text-xs text-slate-500 mt-1">Tip: Use text like {'{{variable}}'} for dynamic content</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 rounded"
              />
              <Label htmlFor="isDefault" className="font-normal">Set as default template for this type</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveTemplate} className="flex-1">Save Template</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-slate-500">No templates found. Create one to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-950">{template.name}</h3>
                    <Badge className="bg-slate-200 text-slate-700 text-xs">
                      {template.category.replace(/_/g, " ")}
                    </Badge>
                    {template.isDefault && <Badge className="bg-brand/10 text-brand text-xs">Default</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{template.body}</p>
                  {template.variables.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {template.variables.slice(0, 3).map((v) => (
                        <Badge key={v} className="bg-slate-100 text-slate-700 text-xs">{v}</Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge className="bg-slate-100 text-slate-700 text-xs">+{template.variables.length - 3} more</Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFormData({
                        name: template.name,
                        subject: template.subject || "",
                        body: template.body,
                        category: template.category,
                        isDefault: template.isDefault,
                      });
                      setEditingId(template.id);
                      setShowForm(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(template)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleArchive(template)}>
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
