"use client";

import React, { useState, useEffect } from "react";
import { Search, ChevronRight, Star, Clock, Loader2, AlertCircle } from "lucide-react";
import { useTemplateSearch } from "@/hooks/useTemplateSearch";
import { TemplatePreview } from "./template-preview";
import { TemplateVariablePanel } from "./template-variable-panel";
import type { SmartTemplate, TemplateCategory } from "@/actions/template.actions";

export interface TemplateBrowserProps {
  mode?: "browse" | "select" | "preview";
  onSelect?: (template: SmartTemplate, variables?: Record<string, string>) => void;
  onClose?: () => void;
  initialCategory?: TemplateCategory;
  hideEditor?: boolean;
}

/**
 * Smart Template Browser
 * Browse, search, preview, and insert templates
 * Integrated with CommunicationComposer
 */
export function TemplateBrowser({
  mode = "browse",
  onSelect,
  onClose,
  initialCategory,
  hideEditor = true
}: TemplateBrowserProps) {
  const search = useTemplateSearch({ initialCategory });
  const [selectedTemplate, setSelectedTemplate] = useState<SmartTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Load favorites and recent on mount
  useEffect(() => {
    search.favorites; // Trigger load
    search.recent;
  }, []);

  const handleSelectTemplate = (template: SmartTemplate) => {
    setSelectedTemplate(template);
    setVariableValues({});
    setShowPreview(true);
  };

  const handleInsertTemplate = () => {
    if (selectedTemplate && onSelect) {
      onSelect(selectedTemplate, variableValues);
      setSelectedTemplate(null);
      setShowPreview(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Template Browser</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search.query}
            onChange={(e) => search.search(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Templates List */}
        <div className="w-96 border-r border-slate-200 overflow-y-auto">
          {/* Filters */}
          <div className="sticky top-0 bg-white border-b border-slate-200 p-4 space-y-3">
            {/* Status Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">
                Status
              </label>
              <div className="flex gap-2">
                {["PUBLISHED", "DRAFT", "ALL"].map(s => (
                  <button
                    key={s}
                    onClick={() => search.setStatus(s as any)}
                    className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                      search.status === s
                        ? "bg-blue-500 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide block mb-2">
                Category
              </label>
              <select
                value={search.category || ""}
                onChange={(e) => search.setCategory((e.target.value as TemplateCategory) || undefined)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {search.categories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 pt-4 border-b border-slate-200 sticky top-20 bg-white">
            <button className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              All Templates
            </button>
            <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
              Favorites
            </button>
            <button className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
              Recent
            </button>
          </div>

          {/* Templates List */}
          <div className="p-4 space-y-2">
            {search.loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            )}

            {search.error && (
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{search.error}</p>
              </div>
            )}

            {!search.loading && search.templates.length === 0 && (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <p className="text-sm">No templates found</p>
              </div>
            )}

            {search.templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTemplate?.id === template.id
                    ? "bg-blue-50 border-blue-300"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{template.name}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{template.body.substring(0, 60)}...</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {search.totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={search.prevPage}
                disabled={!search.hasPrevPage}
                className="px-3 py-1 text-sm rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                ← Prev
              </button>
              <span className="text-xs text-slate-600">
                Page {search.page} of {search.totalPages}
              </span>
              <button
                onClick={search.nextPage}
                disabled={!search.hasNextPage}
                className="px-3 py-1 text-sm rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Preview & Details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!selectedTemplate ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-slate-500 text-sm">Select a template to preview</p>
              </div>
            </div>
          ) : (
            <>
              {/* Template Details */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{selectedTemplate.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedTemplate.category} • {selectedTemplate.status}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                  {mode === "select" && (
                    <button
                      onClick={handleInsertTemplate}
                      className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Insert Template
                    </button>
                  )}
                </div>
              </div>

              {/* Variable Panel */}
              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <TemplateVariablePanel
                  variables={selectedTemplate.variables}
                  values={variableValues}
                  onValuesChange={setVariableValues}
                  preview={showPreview ? selectedTemplate.body : undefined}
                  title="Template Variables"
                />
              )}

              {/* Preview */}
              {showPreview && (
                <TemplatePreview
                  subject={selectedTemplate.subject}
                  body={selectedTemplate.body}
                  variables={selectedTemplate.variables}
                  variableValues={variableValues}
                  mode="rendered"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact template browser for use in modals/drawers
 */
export function CompactTemplateBrowser({
  onSelect,
  onClose,
  initialCategory
}: {
  onSelect?: (template: SmartTemplate) => void;
  onClose?: () => void;
  initialCategory?: TemplateCategory;
}) {
  const search = useTemplateSearch({ initialCategory, pageSize: 10 });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={search.query}
          onChange={(e) => search.search(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-2 gap-3">
        {search.templates.map(template => (
          <button
            key={template.id}
            onClick={() => {
              onSelect?.(template);
              onClose?.();
            }}
            className="p-3 text-left border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 truncate">
              {template.name}
            </p>
            <p className="text-xs text-slate-500 mt-1 truncate line-clamp-2">
              {template.body.substring(0, 60)}
            </p>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {search.templates.length === 0 && !search.loading && (
        <div className="text-center py-6 text-slate-500">
          <p className="text-sm">No templates found</p>
        </div>
      )}
    </div>
  );
}
