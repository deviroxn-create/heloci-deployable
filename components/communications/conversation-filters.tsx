"use client";

import { useState, useCallback } from "react";
import {
  Filter,
  X,
  Mail,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ConversationFilter =
  | "all"
  | "unread"
  | "assigned_to_me"
  | "waiting_for_applicant"
  | "waiting_for_staff"
  | "archived"
  | "has_attachments"
  | "has_document_request"
  | "has_decision";

interface ConversationFiltersProps {
  selectedFilters: ConversationFilter[];
  onFilterChange: (filters: ConversationFilter[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Conversation filter controls
 * Supports multi-select filters + live search
 */
export function ConversationFilters({
  selectedFilters,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: ConversationFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const filterOptions = [
    { id: "all", label: "All", icon: Mail },
    { id: "unread", label: "Unread", icon: AlertCircle },
    { id: "assigned_to_me", label: "Assigned To Me", icon: User },
    { id: "waiting_for_applicant", label: "Waiting For Applicant", icon: Clock },
    { id: "waiting_for_staff", label: "Waiting For Staff", icon: User },
    { id: "archived", label: "Archived", icon: Mail },
    { id: "has_attachments", label: "Has Attachments", icon: FileText },
    { id: "has_document_request", label: "Has Document Request", icon: FileText },
    { id: "has_decision", label: "Has Decision", icon: CheckCircle },
  ] as const;

  const toggleFilter = useCallback(
    (filterId: ConversationFilter) => {
      if (filterId === "all") {
        onFilterChange(["all"]);
      } else {
        const newFilters = selectedFilters.includes(filterId)
          ? selectedFilters.filter(f => f !== filterId && f !== "all")
          : [...selectedFilters.filter(f => f !== "all"), filterId];
        onFilterChange(newFilters.length === 0 ? ["all"] : newFilters);
      }
    },
    [selectedFilters, onFilterChange]
  );

  const activeFilterCount = selectedFilters.filter(f => f !== "all").length;

  return (
    <div className="space-y-3">
      {/* Search & Filter Toggle */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative"
        >
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-brand text-white text-xs font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Options */}
      {isExpanded && (
        <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {filterOptions.map(option => {
              const isSelected = selectedFilters.includes(option.id as ConversationFilter);
              const Icon = option.icon;

              return (
                <button
                  key={option.id}
                  onClick={() => toggleFilter(option.id as ConversationFilter)}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-brand text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Clear filters button */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => onFilterChange(["all"])}
              className="w-full mt-2 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-white rounded border border-slate-200 transition"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Apply filters to conversation list
 */
export function applyConversationFilters(
  conversations: any[],
  filters: ConversationFilter[],
  searchQuery: string
): any[] {
  let filtered = [...conversations];

  // Apply text search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      conv =>
        conv.applicantName?.toLowerCase().includes(query) ||
        conv.applicantEmail?.toLowerCase().includes(query) ||
        conv.programName?.toLowerCase().includes(query) ||
        conv.lastMessagePreview?.toLowerCase().includes(query)
    );
  }

  // Apply filters
  if (!filters.includes("all")) {
    filtered = filtered.filter(conv => {
      for (const filter of filters) {
        switch (filter) {
          case "unread":
            if (conv.unreadCount === 0) return false;
            break;
          case "assigned_to_me":
            if (conv.assignedTo !== "CurrentUser") return false;
            break;
          case "waiting_for_applicant":
            if (conv.status !== "more_info_requested") return false;
            break;
          case "waiting_for_staff":
            if (conv.status !== "pending") return false;
            break;
          case "archived":
            if (!conv.archived) return false;
            break;
          case "has_attachments":
            if (!conv.hasAttachments) return false;
            break;
          case "has_document_request":
            if (!conv.hasPendingDocuments) return false;
            break;
          case "has_decision":
            if (!conv.hasDecision) return false;
            break;
        }
      }
      return true;
    });
  }

  return filtered;
}
