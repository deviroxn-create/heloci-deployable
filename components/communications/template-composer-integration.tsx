"use client";

import React, { useState } from "react";
import { BookOpen, Plus, Check } from "lucide-react";
import { CompactTemplateBrowser } from "./template-browser";
import { TemplateEditor } from "./template-editor";
import { renderTemplate } from "@/lib/notifications/template.service";
import type { SmartTemplate, TemplateCategory } from "@/actions/template.actions";

export interface TemplateComposerIntegrationProps {
  mode: "message" | "email" | "announcement" | "document_request" | "decision_notification" | "reply" | "system_notification";
  onInsertTemplate?: (template: SmartTemplate, variables?: Record<string, string>) => void;
  onReplaceContent?: (subject?: string, body?: string) => void;
  onAppendContent?: (body: string) => void;
  currentSubject?: string;
  currentBody?: string;
}

/**
 * Template Integration for CommunicationComposer
 * Provides:
 * - Browse and insert templates
 * - Create new templates
 * - Replace or append content
 * - Variable filling with preview
 */
export function TemplateComposerIntegration({
  mode,
  onInsertTemplate,
  onReplaceContent,
  onAppendContent,
  currentSubject,
  currentBody
}: TemplateComposerIntegrationProps) {
  const [showBrowser, setShowBrowser] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SmartTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showVariablePanel, setShowVariablePanel] = useState(false);

  // Map mode to category
  const getCategoryForMode = (): TemplateCategory | undefined => {
    const mapping: Record<string, TemplateCategory> = {
      "message": "general_message",
      "email": "email_reply",
      "announcement": "announcement",
      "document_request": "document_request",
      "decision_notification": "decision_approval"
    };
    return mapping[mode];
  };

  const handleTemplateSelect = (template: SmartTemplate) => {
    setSelectedTemplate(template);
    setVariableValues({});
    setShowVariablePanel(true);
  };

  const handleInsertTemplate = () => {
    if (selectedTemplate) {
      const renderedBody = renderTemplate(selectedTemplate.body, variableValues as any);
      const renderedSubject = selectedTemplate.subject
        ? renderTemplate(selectedTemplate.subject, variableValues as any)
        : "";

      onReplaceContent?.(renderedSubject, renderedBody);
      setSelectedTemplate(null);
      setShowBrowser(false);
      setShowVariablePanel(false);
    }
  };

  const handleAppendTemplate = () => {
    if (selectedTemplate) {
      const renderedBody = renderTemplate(selectedTemplate.body, variableValues as any);
      onAppendContent?.(renderedBody);
      setSelectedTemplate(null);
      setShowBrowser(false);
      setShowVariablePanel(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Template Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowBrowser(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          title="Browse and insert templates"
        >
          <BookOpen className="w-4 h-4" />
          Browse Templates
        </button>

        <button
          onClick={() => setShowEditor(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
          title="Create a new template"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Template Browser Modal */}
      {showBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Browse Templates</h3>
              <button
                onClick={() => setShowBrowser(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedTemplate ? (
                /* Template Details */
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{selectedTemplate.name}</h4>
                    <p className="text-sm text-slate-600 mt-2">{selectedTemplate.body}</p>
                  </div>

                  {/* Variables Input */}
                  {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                    <div className="space-y-3 border-t border-slate-200 pt-4">
                      <h5 className="text-sm font-semibold text-slate-700">Fill in Variables</h5>
                      {selectedTemplate.variables.map(v => (
                        <div key={v}>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            {v}
                          </label>
                          <input
                            type="text"
                            value={variableValues[v] || ""}
                            onChange={(e) => setVariableValues(prev => ({
                              ...prev,
                              [v]: e.target.value
                            }))}
                            placeholder={`Enter ${v}`}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview */}
                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                      Preview
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-700 whitespace-pre-wrap">
                      {renderTemplate(selectedTemplate.body, variableValues as any)}
                    </div>
                  </div>
                </div>
              ) : (
                /* Template List */
                <CompactTemplateBrowser
                  initialCategory={getCategoryForMode()}
                  onSelect={handleTemplateSelect}
                  onClose={() => setShowBrowser(false)}
                />
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              {selectedTemplate && (
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  ← Back
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => setShowBrowser(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                {selectedTemplate && (
                  <>
                    <button
                      onClick={handleAppendTemplate}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition-colors"
                    >
                      Append
                    </button>
                    <button
                      onClick={handleInsertTemplate}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Replace
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <TemplateEditor
              mode="create"
              onSave={() => {
                setShowEditor(false);
              }}
              onClose={() => setShowEditor(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Quick Template Insert Button
 * Minimal UI for inserting templates in smaller spaces
 */
export function QuickTemplateInsert({
  mode,
  onInsert
}: {
  mode?: TemplateCategory;
  onInsert?: (template: SmartTemplate) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        <BookOpen className="w-3 h-3" />
        Use Template
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-w-sm w-screen max-w-[calc(100vw-2rem)]">
          <div className="p-4">
            <CompactTemplateBrowser
              initialCategory={mode}
              onSelect={(template) => {
                onInsert?.(template);
                setOpen(false);
              }}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
