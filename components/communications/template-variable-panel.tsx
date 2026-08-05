"use client";

import React, { useState, useMemo } from "react";
import { Info, X, Eye, Copy } from "lucide-react";

export interface TemplateVariable {
  name: string;
  description?: string;
  example?: string;
  category?: string;
}

export interface TemplateVariablePanelProps {
  variables?: string[];
  values?: Record<string, string>;
  onValuesChange?: (values: Record<string, string>) => void;
  preview?: string;
  showPreview?: boolean;
  title?: string;
  compact?: boolean;
}

// Common variables across all templates
const COMMON_VARIABLES: Record<string, TemplateVariable> = {
  "ApplicantName": {
    name: "ApplicantName",
    description: "Full name of the applicant",
    example: "John Smith",
    category: "Applicant"
  },
  "ApplicantEmail": {
    name: "ApplicantEmail",
    description: "Email address of the applicant",
    example: "john@example.com",
    category: "Applicant"
  },
  "ProgramName": {
    name: "ProgramName",
    description: "Name of the housing program",
    example: "First-Time Homebuyer Program",
    category: "Program"
  },
  "ApplicationNumber": {
    name: "ApplicationNumber",
    description: "Unique application identifier",
    example: "APP-2024-001234",
    category: "Application"
  },
  "ApplicationStatus": {
    name: "ApplicationStatus",
    description: "Current application status",
    example: "Under Review",
    category: "Application"
  },
  "CaseWorker": {
    name: "CaseWorker",
    description: "Name of assigned case worker",
    example: "Jane Doe",
    category: "Staff"
  },
  "Decision": {
    name: "Decision",
    description: "Approval/Rejection/Waitlist decision",
    example: "Approved",
    category: "Decision"
  },
  "Deadline": {
    name: "Deadline",
    description: "Application or document deadline",
    example: "December 31, 2024",
    category: "Timeline"
  },
  "OrganizationName": {
    name: "OrganizationName",
    description: "Name of the organization",
    example: "City Housing Authority",
    category: "Organization"
  },
  "PortalLink": {
    name: "PortalLink",
    description: "Link to applicant portal",
    example: "https://portal.example.com",
    category: "System"
  },
  "Reviewer": {
    name: "Reviewer",
    description: "Name of the reviewer",
    example: "John Administrator",
    category: "Staff"
  },
  "Today": {
    name: "Today",
    description: "Current date",
    example: new Date().toLocaleDateString(),
    category: "Timeline"
  },
  "DocumentType": {
    name: "DocumentType",
    description: "Type of document requested",
    example: "Pay Stubs",
    category: "Documents"
  },
  "RejectionReason": {
    name: "RejectionReason",
    description: "Reason for rejection",
    example: "Income exceeds program limits",
    category: "Decision"
  }
};

/**
 * Template Variable Panel
 * Displays available variables, their descriptions, and allows editing values
 * Shows live preview as variables are filled
 */
export function TemplateVariablePanel({
  variables = [],
  values = {},
  onValuesChange,
  preview,
  showPreview = true,
  title = "Template Variables",
  compact = false
}: TemplateVariablePanelProps) {
  const [expandedVariable, setExpandedVariable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  // Get variable metadata
  const variableMetadata = useMemo(() => {
    return variables.map(v => COMMON_VARIABLES[v] || {
      name: v,
      description: "Custom variable",
      example: `[${v}]`,
      category: "Custom"
    });
  }, [variables]);

  // Filter by search
  const filteredVariables = useMemo(() => {
    if (!searchQuery.trim()) return variableMetadata;
    const q = searchQuery.toLowerCase();
    return variableMetadata.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.description?.toLowerCase().includes(q) ||
      (v.category?.toLowerCase() || "").includes(q)
    );
  }, [variableMetadata, searchQuery]);

  // Group by category
  const groupedVariables = useMemo(() => {
    const groups: Record<string, TemplateVariable[]> = {};
    filteredVariables.forEach(v => {
      const cat = v.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return groups;
  }, [filteredVariables]);

  // Handle value change
  const handleValueChange = (varName: string, value: string) => {
    const newValues = { ...values, [varName]: value };
    onValuesChange?.(newValues);
  };

  // Copy variable to clipboard
  const copyVariable = (varName: string) => {
    const template = `{{${varName}}}`;
    navigator.clipboard.writeText(template);
    setCopiedVariable(varName);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  if (compact && variables.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {variables.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {variables.length} variables
          </span>
        )}
      </div>

      {variables.length === 0 ? (
        <div className="flex items-center justify-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <Info className="w-4 h-4 text-slate-400 mr-2" />
          <p className="text-sm text-slate-500">No variables in this template</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <input
            type="text"
            placeholder="Search variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Variables by Category */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(groupedVariables).map(([category, vars]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {category}
                </h4>
                <div className="space-y-1">
                  {vars.map(variable => (
                    <div
                      key={variable.name}
                      className="border border-slate-200 rounded-lg p-2 hover:bg-slate-50 transition-colors"
                    >
                      {/* Variable Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded">
                              {variable.name}
                            </code>
                            <button
                              onClick={() => copyVariable(variable.name)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                              title="Copy template syntax"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedVariable === variable.name && (
                                <span className="ml-1 text-xs text-green-600">Copied</span>
                              )}
                            </button>
                          </div>
                          {variable.description && (
                            <p className="text-xs text-slate-500 mt-1">{variable.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setExpandedVariable(expandedVariable === variable.name ? null : variable.name)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Expanded Content */}
                      {expandedVariable === variable.name && (
                        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                          {variable.example && (
                            <div className="text-xs">
                              <p className="text-slate-600 font-medium">Example:</p>
                              <p className="text-slate-700 font-mono bg-slate-100 p-2 rounded mt-1">
                                {variable.example}
                              </p>
                            </div>
                          )}
                          <div>
                            <label className="text-xs text-slate-600 font-medium block mb-1">
                              Value:
                            </label>
                            <input
                              type="text"
                              value={values[variable.name] || ""}
                              onChange={(e) => handleValueChange(variable.name, e.target.value)}
                              placeholder={variable.example}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Live Preview */}
      {showPreview && preview && (
        <div className="border-t border-slate-200 pt-4">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
            Live Preview
          </h4>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto">
            <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
              {preview}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Inline variable helper (compact version for use in composer)
 */
export function InlineVariableHelper({
  variables = [],
  onInsert
}: {
  variables?: string[];
  onInsert?: (variable: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (variables.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
      >
        + Insert Variable
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-48">
          <div className="p-2 max-h-64 overflow-y-auto">
            {variables.map(v => (
              <button
                key={v}
                onClick={() => {
                  onInsert?.(v);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 rounded font-mono text-slate-700"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
