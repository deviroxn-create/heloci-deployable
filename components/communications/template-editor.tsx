"use client";

import React, { useState, useEffect } from "react";
import { Save, X, Eye, Edit2, AlertCircle } from "lucide-react";
import { saveTemplateAction, publishTemplateAction, archiveTemplateAction, getTemplateCategoriesAction } from "@/actions/template.actions";
import { TemplatePreview } from "./template-preview";
import { TemplateVariablePanel, InlineVariableHelper } from "./template-variable-panel";
import { extractTemplateVariables } from "@/lib/notifications/template.service";
import type { SmartTemplate, TemplateCategory } from "@/actions/template.actions";

export interface TemplateEditorProps {
  template?: SmartTemplate;
  onSave?: (template: SmartTemplate) => void;
  onClose?: () => void;
  mode?: "create" | "edit";
}

/**
 * Template Editor Component
 * Create and edit templates with live preview and variable helper
 */
export function TemplateEditor({
  template,
  onSave,
  onClose,
  mode = template ? "edit" : "create"
}: TemplateEditorProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: template?.name || "",
    subject: template?.subject || "",
    body: template?.body || "",
    category: (template?.category || "") as TemplateCategory,
    status: template?.status || ("DRAFT" as const)
  });

  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Extract variables when body/subject changes
  useEffect(() => {
    const vars = extractTemplateVariables(formData.body + (formData.subject || ""));
    setVariables(vars);
  }, [formData.body, formData.subject]);

  const loadCategories = async () => {
    try {
      const cats = await getTemplateCategoriesAction();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const insertVariable = (varName: string) => {
    const textarea = document.getElementById("body-textarea") as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newBody = formData.body.substring(0, start) + `{{${varName}}}` + formData.body.substring(end);
      handleFieldChange("body", newBody);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + varName.length + 4;
        textarea.focus();
      }, 0);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Template name is required");
      return;
    }
    if (!formData.body.trim()) {
      setError("Template body is required");
      return;
    }
    if (!formData.category) {
      setError("Template category is required");
      return;
    }

    setLoading(true);
    try {
      const saved = await saveTemplateAction({
        id: template?.id,
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        body: formData.body.trim(),
        category: formData.category,
        status: formData.status
      });

      setSuccess(mode === "create" ? "Template created successfully" : "Template updated successfully");
      onSave?.(saved as any);
      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!template?.id) return;
    setLoading(true);
    try {
      await publishTemplateAction(template.id);
      setFormData(prev => ({ ...prev, status: "PUBLISHED" }));
      setSuccess("Template published successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish template");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!template?.id) return;
    setLoading(true);
    try {
      await archiveTemplateAction(template.id);
      setFormData(prev => ({ ...prev, status: "DRAFT" }));
      setSuccess("Template archived successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === "create" ? "Create Template" : "Edit Template"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {formData.status === "PUBLISHED" ? "Published" : "Draft"}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">✓ {success}</p>
            </div>
          )}

          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="e.g., Application Approved"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Unique name for easy identification
            </p>
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleFieldChange("category", e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange("status", e.target.value)}
                disabled={mode === "create"}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subject <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleFieldChange("subject", e.target.value)}
              placeholder="e.g., Your Application Has Been Approved"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">
                Used for email communications
              </p>
              <InlineVariableHelper variables={variables} onInsert={insertVariable} />
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Message Body <span className="text-red-500">*</span>
            </label>
            <textarea
              id="body-textarea"
              value={formData.body}
              onChange={(e) => handleFieldChange("body", e.target.value)}
              placeholder="Enter template content. Use {{VariableName}} for dynamic content."
              rows={8}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">
                {formData.body.length} characters
              </p>
              <InlineVariableHelper variables={variables} onInsert={insertVariable} />
            </div>
          </div>

          {/* Variables */}
          {variables.length > 0 && (
            <TemplateVariablePanel
              variables={variables}
              values={variableValues}
              onValuesChange={setVariableValues}
              preview={showPreview ? formData.body : undefined}
              title="Template Variables"
              compact={false}
            />
          )}

          {/* Preview Button */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>

          {/* Preview */}
          {showPreview && (
            <TemplatePreview
              subject={formData.subject}
              body={formData.body}
              variables={variables}
              variableValues={variableValues}
              mode="split"
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="space-x-2">
          {template?.id && formData.status === "DRAFT" && (
            <button
              onClick={handlePublish}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              Publish
            </button>
          )}
          {template?.id && formData.status === "PUBLISHED" && (
            <button
              onClick={handleArchive}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
            >
              Archive
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
