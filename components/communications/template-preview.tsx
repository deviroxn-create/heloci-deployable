"use client";

import React, { useState, useEffect } from "react";
import { renderTemplate } from "@/lib/notifications/template.service";
import { Eye, Copy, Download, X } from "lucide-react";

export interface TemplatePreviewProps {
  subject?: string;
  body: string;
  variables?: string[];
  variableValues?: Record<string, string>;
  mode?: "raw" | "rendered" | "split";
  showCode?: boolean;
  onClose?: () => void;
}

/**
 * Template Preview Component
 * Shows template with live variable rendering
 * Supports multiple view modes: raw, rendered, split-view
 */
export function TemplatePreview({
  subject,
  body,
  variables = [],
  variableValues = {},
  mode: initialMode = "rendered",
  showCode = false,
  onClose
}: TemplatePreviewProps) {
  const [mode, setMode] = useState<"raw" | "rendered" | "split">(initialMode);
  const [copied, setCopied] = useState(false);

  // Render template with variables
  const renderedSubject = subject ? renderTemplate(subject, variableValues as any) : "";
  const renderedBody = renderTemplate(body, variableValues as any);

  // Copy to clipboard
  const copyToClipboard = () => {
    const text = renderedSubject ? `${renderedSubject}\n\n${renderedBody}` : renderedBody;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as text file
  const downloadAsFile = () => {
    const content = renderedSubject ? `${renderedSubject}\n\n${renderedBody}` : renderedBody;
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", "template-preview.txt");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
          <p className="text-xs text-slate-500 mt-1">
            Showing {mode === "split" ? "split view" : mode} preview
            {variables.length > 0 && ` with ${variables.length} variable(s) filled`}
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

      {/* Mode Tabs */}
      <div className="flex gap-1 px-6 pt-4 border-b border-slate-200">
        <button
          onClick={() => setMode("raw")}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            mode === "raw"
              ? "bg-white border border-b-0 border-slate-200 text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Raw Template
        </button>
        <button
          onClick={() => setMode("rendered")}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            mode === "rendered"
              ? "bg-white border border-b-0 border-slate-200 text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Rendered
        </button>
        <button
          onClick={() => setMode("split")}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            mode === "split"
              ? "bg-white border border-b-0 border-slate-200 text-slate-900"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Split View
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {mode === "split" ? (
          <div className="grid grid-cols-2 gap-6">
            {/* Raw */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                Raw Template
              </h4>
              <PreviewContent
                subject={subject}
                body={body}
                isRaw={true}
              />
            </div>
            {/* Rendered */}
            <div>
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                Rendered Preview
              </h4>
              <PreviewContent
                subject={renderedSubject}
                body={renderedBody}
                isRaw={false}
              />
            </div>
          </div>
        ) : (
          <PreviewContent
            subject={mode === "raw" ? subject : renderedSubject}
            body={mode === "raw" ? body : renderedBody}
            isRaw={mode === "raw"}
          />
        )}

        {/* Variables Used */}
        {variables.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
              Variables Used
            </h4>
            <div className="flex flex-wrap gap-2">
              {variables.map(v => (
                <div key={v} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-1">
                  <code className="text-xs font-mono text-blue-900">{v}</code>
                  <span className="text-xs text-blue-600">
                    {variableValues[v] ? `= "${variableValues[v]}"` : "(not set)"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-end gap-2">
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Copy to clipboard"
        >
          <Copy className="w-4 h-4" />
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={downloadAsFile}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded transition-colors"
          title="Download as text file"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>
    </div>
  );
}

/**
 * Preview content renderer
 */
function PreviewContent({
  subject,
  body,
  isRaw
}: {
  subject?: string;
  body: string;
  isRaw: boolean;
}) {
  return (
    <div className={`${isRaw ? "font-mono text-sm" : "space-y-4"}`}>
      {subject && (
        <div>
          <div className={`${isRaw ? "text-slate-500" : "text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"}`}>
            {isRaw ? "Subject:" : "Subject"}
          </div>
          <div className={`${
            isRaw
              ? "bg-slate-100 p-2 rounded text-slate-900"
              : "text-sm text-slate-900 font-semibold p-3 bg-blue-50 border border-blue-200 rounded"
          }`}>
            {subject}
          </div>
        </div>
      )}

      <div>
        <div className={`${isRaw ? "text-slate-500" : "text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1"}`}>
          {isRaw ? "Body:" : "Body"}
        </div>
        <div
          className={`${
            isRaw
              ? "bg-slate-100 p-3 rounded text-slate-900 whitespace-pre-wrap"
              : "text-sm text-slate-700 p-3 bg-white border border-slate-200 rounded whitespace-pre-wrap leading-relaxed"
          }`}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal inline preview (for composer)
 */
export function InlineTemplatePreview({
  subject,
  body,
  variables = [],
  variableValues = {}
}: {
  subject?: string;
  body: string;
  variables?: string[];
  variableValues?: Record<string, string>;
}) {
  const renderedSubject = subject ? renderTemplate(subject, variableValues as any) : "";
  const renderedBody = renderTemplate(body, variableValues as any);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      {renderedSubject && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Subject
          </p>
          <p className="text-sm text-slate-900 font-medium">{renderedSubject}</p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
          Message
        </p>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{renderedBody}</p>
      </div>

      {variables.length > 0 && (
        <div className="pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            {variables.filter(v => !variableValues[v]).length > 0 && (
              <>
                {variables.filter(v => !variableValues[v]).length} variable(s) not filled
              </>
            )}
            {variables.every(v => variableValues[v]) && (
              <>✓ All variables filled</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
