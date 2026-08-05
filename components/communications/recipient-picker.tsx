"use client";

import { memo, useState, useRef, useEffect } from "react";
import {
  Search, X, ChevronDown, Users, Clock, Star, Filter,
  AlertCircle, CheckCircle, AlertTriangle, ArrowRight, Mail
} from "lucide-react";
import { RecipientCard } from "./recipient-card";
import { useRecipientSearch, useMultipleRecipients } from "@/hooks/useRecipientSearch";
import type { RecipientCard as RecipientCardType, RecipientGroup } from "@/lib/communications/recipient.types";

interface RecipientPickerProps {
  organizationId: string;
  mode?: "single" | "multi";
  onSelectionChange?: (recipients: any[]) => void;
  onClose?: () => void;
  open?: boolean;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  excludeUserId?: string;
  type?: "applicants" | "staff" | "admins";
  maxHeight?: string;
}

/**
 * Email validation utility
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * RecipientPicker Component - Extended with External Email Support
 * 
 * Reusable recipient selection component integrated with CommunicationComposer
 * 
 * Features:
 * - Debounced search across ALL user types (staff, applicants, admins, case workers, coordinators)
 * - Recent contacts and suggestions
 * - Department/group selection
 * - Multi-select or single-select mode
 * - **Manual email entry for external recipients**
 * - **Validation of email addresses**
 * - **Mixed internal and external recipient support**
 * - Duplicate detection
 * - Organization isolation
 * - Keyboard navigation (arrow keys, enter, escape)
 * - ARIA labels and accessibility
 * 
 * Reuses:
 * ✓ useRecipientSearch hook (extended to search all user types)
 * ✓ searchRecipients server action
 * ✓ RBAC and org isolation from backend
 * ✓ Existing user/staff/applicant models
 * 
 * External Recipients:
 * - Users can type email addresses manually
 * - Valid emails create "external" recipient chips (no userId)
 * - External recipients can be mixed with internal recipients
 * - NotificationService handles both types in unified send flow
 */
export const RecipientPicker = memo(function RecipientPicker({
  organizationId,
  mode = "multi",
  onSelectionChange,
  onClose,
  open = true,
  trigger,
  title = "Select Recipients",
  description = "Search and select who you want to send this to",
  excludeUserId,
  type = "staff",
  maxHeight = "max-h-96",
}: RecipientPickerProps) {
  const search = useMultipleRecipients(organizationId);
  const [showSelector, setShowSelector] = useState(open);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  // External email entry state
  const [externalEmails, setExternalEmails] = useState<Set<string>>(new Set());
  const [emailInputError, setEmailInputError] = useState<string | null>(null);

  // Combine all available recipients for keyboard navigation
  const allRecipients = [
    ...search.results.users,
    ...(search.results.groups[0]?.members || []),
    ...search.results.recent,
    ...search.results.suggestions,
  ];

  /**
   * Get combined selection including both internal and external recipients
   * This is what gets passed to onSelectionChange
   */
  const getCombinedSelection = () => {
    const internalRecipients = search.selected.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role,
      organizationId,
      userId: r.id,
      isExternal: false,
    }));

    const externalRecipients = Array.from(externalEmails).map((email) => ({
      id: `external-${email}`,
      email,
      name: email,
      role: "external",
      organizationId,
      userId: null,
      isExternal: true,
    }));

    return [...internalRecipients, ...externalRecipients];
  };

  /**
   * Add external email (manual entry)
   * Validates format, prevents duplicates, adds to external recipients set
   */
  const addExternalEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    setEmailInputError(null);

    // Validate email format
    if (!isValidEmail(trimmedEmail)) {
      setEmailInputError("Please enter a valid email address");
      return;
    }

    // Check if already selected (internal)
    const isAlreadyInternal = search.selected.some((r) => r.email.toLowerCase() === trimmedEmail);
    if (isAlreadyInternal) {
      setEmailInputError("This recipient is already selected");
      return;
    }

    // Check if already in external set
    if (externalEmails.has(trimmedEmail)) {
      setEmailInputError("This email is already added");
      return;
    }

    // Add external email
    setExternalEmails((prev) => new Set([...prev, trimmedEmail]));
  };

  /**
   * Remove external email
   */
  const removeExternalEmail = (email: string) => {
    setExternalEmails((prev) => {
      const updated = new Set(prev);
      updated.delete(email);
      return updated;
    });
  };

  /**
   * Handle keyboard navigation in external email input
   */
  const handleEmailInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const email = (e.target as HTMLInputElement).value;
      if (email.trim()) {
        addExternalEmail(email);
        (e.target as HTMLInputElement).value = "";
      }
    }
  };

  /**
   * Handle keyboard navigation in search
   */
  const handleSearchInputKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          Math.min(prev + 1, allRecipients.length - 1)
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && allRecipients[focusedIndex]) {
          search.toggleRecipient(allRecipients[focusedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowSelector(false);
        onClose?.();
        break;
      case "Tab":
        // Allow tab but don't prevent default
        break;
    }
  };

  /**
   * Handle search with debouncing
   */
  const handleSearchChange = (query: string) => {
    search.handleSearch(query);
    setFocusedIndex(-1);
  };

  /**
   * Handle filter button clicks
   */
  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    // Could implement additional filtering here
  };

  /**
   * Get filtered recipients based on active filter
   */
  const getFilteredRecipients = () => {
    switch (activeFilter) {
      case "recent":
        return search.results.recent;
      case "favorites":
        return search.results.favorites;
      case "suggestions":
        return search.results.suggestions;
      default:
        return search.results.users;
    }
  };

  /**
   * Notify parent of selection change (internal + external)
   */
  useEffect(() => {
    onSelectionChange?.(getCombinedSelection());
  }, [search.selected, externalEmails, onSelectionChange, organizationId]);

  // Close picker handler
  const handleClosePicker = () => {
    setShowSelector(false);
    onClose?.();
  };

  if (!showSelector && trigger) {
    return (
      <button
        onClick={() => setShowSelector(true)}
        className="inline-flex items-center gap-2"
      >
        {trigger}
      </button>
    );
  }

  const filteredRecipients = getFilteredRecipients();
  const totalSelected = search.selected.length + externalEmails.size;
  const hasValidation = totalSelected > 0;

  return (
    <div className="flex flex-col w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-semibold text-slate-900">{title}</h2>
            {description && (
              <p className="text-xs text-slate-600 mt-1">{description}</p>
            )}
          </div>
          {trigger && (
            <button
              onClick={handleClosePicker}
              className="p-1 hover:bg-slate-200 rounded transition text-slate-500"
              aria-label="Close picker"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name, email, or department..."
            value={search.query}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchInputKeyDown}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            aria-label="Search recipients"
            aria-describedby="search-help"
          />
        </div>

        {/* External email input section */}
        <div className="space-y-2 mb-3">
          <label className="block text-xs font-medium text-slate-700">
            Or add external email:
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              ref={emailInputRef}
              type="email"
              placeholder="example@company.com"
              onKeyDown={handleEmailInputKeyDown}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              aria-label="Add external email address"
            />
          </div>
          {emailInputError && (
            <div className="flex items-start gap-2 p-2 bg-red-50 rounded">
              <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">{emailInputError}</p>
            </div>
          )}
        </div>

        {/* Quick filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: "All", icon: Users },
            { id: "recent", label: "Recent", icon: Clock },
            { id: "favorites", label: "Favorites", icon: Star },
            { id: "suggestions", label: "Suggested", icon: ArrowRight },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleFilterClick(id)}
              className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition whitespace-nowrap ${
                activeFilter === id
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              aria-pressed={activeFilter === id}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 ${maxHeight} overflow-y-auto`}>
        {/* Error state */}
        {search.error && (
          <div className="p-4 bg-red-50 border-b border-red-200 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-900">{search.error}</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {search.loading && (
          <div className="p-6 text-center">
            <div className="inline-flex items-center gap-2 text-slate-600">
              <div className="animate-spin">
                <div className="h-4 w-4 border-2 border-slate-200 border-t-brand rounded-full" />
              </div>
              <span className="text-sm">Searching...</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!search.loading && filteredRecipients.length === 0 && search.results.groups.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {search.query ? "No recipients found" : "Start typing to search"}
            </p>
          </div>
        )}

        {/* Recipients list */}
        {filteredRecipients.length > 0 && (
          <div className="space-y-2 p-4">
            {filteredRecipients.map((recipient, index) => (
              <RecipientCard
                key={recipient.id}
                recipient={recipient}
                isSelected={search.isSelected(recipient.email)}
                isRecent={recipient.isRecent}
                isFavorite={recipient.isFavorite}
                onSelect={() => search.toggleRecipient(recipient)}
                compact
                showCheckbox
                className={
                  focusedIndex === index ? "ring-2 ring-brand" : ""
                }
              />
            ))}
          </div>
        )}

        {/* Groups list */}
        {search.results.groups.length > 0 && (
          <div className="space-y-2 p-4">
            {search.results.groups.map((group) => (
              <RecipientGroup
                key={group.id}
                group={group}
                isExpanded={expandedGroupId === group.id}
                onExpand={() =>
                  setExpandedGroupId(
                    expandedGroupId === group.id ? null : group.id
                  )
                }
                onSelectGroup={() => search.selectGroup(group)}
                onSelectMember={(member) => search.toggleRecipient(member)}
                selectedEmails={new Set(search.selected.map((r) => r.email))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer - Selection summary and actions */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 space-y-3">
        {/* Selection summary */}
        {hasValidation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-900">
                {totalSelected} recipient{totalSelected !== 1 ? "s" : ""} selected
              </span>
              {search.selectedSummary.hasDuplicates && (
                <div className="flex items-center gap-1 text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-xs">Duplicates detected</span>
                </div>
              )}
            </div>

            {/* Selected recipients pills - Internal */}
            {search.selected.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-600">Internal:</p>
                <div className="flex flex-wrap gap-2">
                  {search.selected.slice(0, 3).map((recipient) => (
                    <div
                      key={recipient.email}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand/10 border border-brand/20 text-xs text-slate-700"
                    >
                      <span>{recipient.name}</span>
                      <button
                        onClick={() => search.deselectRecipient(recipient.email)}
                        className="text-slate-500 hover:text-slate-700"
                        aria-label={`Remove ${recipient.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {search.selected.length > 3 && (
                    <div className="px-2.5 py-1 text-xs text-slate-600">
                      +{search.selected.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected recipients pills - External */}
            {externalEmails.size > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-600">External:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(externalEmails).slice(0, 3).map((email) => (
                    <div
                      key={email}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700"
                    >
                      <Mail className="h-3 w-3" />
                      <span>{email}</span>
                      <button
                        onClick={() => removeExternalEmail(email)}
                        className="text-blue-500 hover:text-blue-700"
                        aria-label={`Remove ${email}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {externalEmails.size > 3 && (
                    <div className="px-2.5 py-1 text-xs text-blue-700">
                      +{externalEmails.size - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warnings and validations */}
        {search.selectedSummary.organizations.length > 1 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-900">
              Recipients from different organizations selected
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => {
              search.clearSelection();
              setExternalEmails(new Set());
            }}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            disabled={!hasValidation}
          >
            Clear
          </button>
          <button
            onClick={() => {
              onSelectionChange?.(getCombinedSelection());
              handleClosePicker();
            }}
            disabled={!hasValidation || search.loading}
            className="flex-1 px-3 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Confirm ({totalSelected})
          </button>
        </div>
      </div>
    </div>
  );
});

RecipientPicker.displayName = "RecipientPicker";

/**
 * RecipientGroup Component
 * Displays a group of recipients (department, team, etc.)
 */
const RecipientGroup = memo(function RecipientGroup({
  group,
  isExpanded,
  onExpand,
  onSelectGroup,
  onSelectMember,
  selectedEmails,
}: {
  group: RecipientGroup;
  isExpanded: boolean;
  onExpand: () => void;
  onSelectGroup: () => void;
  onSelectMember: (member: RecipientCardType) => void;
  selectedEmails: Set<string>;
}) {
  const allMembersSelected = group.members?.every((m) =>
    selectedEmails.has(m.email)
  );

  return (
    <div className="space-y-2">
      {/* Group header */}
      <button
        onClick={onExpand}
        className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={allMembersSelected || false}
            onChange={onSelectGroup}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 cursor-pointer"
            aria-label={`Select all in ${group.name}`}
          />
          <Users className="h-4 w-4 text-slate-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{group.name}</p>
            <p className="text-xs text-slate-500">
              {group.recipientCount} member{group.recipientCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded group members */}
      {isExpanded && group.members && (
        <div className="pl-6 space-y-2">
          {group.members.map((member) => (
            <RecipientCard
              key={member.id}
              recipient={member}
              isSelected={selectedEmails.has(member.email)}
              onSelect={() => onSelectMember(member)}
              compact
              showCheckbox
            />
          ))}
        </div>
      )}
    </div>
  );
});

RecipientGroup.displayName = "RecipientGroup";
