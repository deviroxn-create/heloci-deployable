"use client";

import { useState, useRef, useEffect, memo } from "react";
import { X } from "lucide-react";
import { useRecipientSearch } from "@/hooks/useRecipientSearch";
import type { RecipientCard as RecipientCardType } from "@/lib/communications/recipient.types";

interface RecipientPickerInlineProps {
  organizationId: string;
  value: RecipientCardType[];
  onChange: (recipients: RecipientCardType[]) => void;
  maxRecipients?: number;
  mode?: "single" | "multi";
  placeholder?: string;
}

/**
 * Milestone 7 Phase 2: Enhanced Recipient Picker with External Email Support
 * 
 * Dropdown-based recipient search integrated into inline composer
 * NOT a modal - stays on same screen as composer
 * 
 * Features:
 * - Type to search internal recipients
 * - Type email addresses to add external recipients
 * - Dropdown results with manual email entry
 * - Keyboard navigation (arrows, enter, escape)
 * - Multi-select with pills (internal + external)
 * - Recent contacts
 * - Duplicate prevention
 * - Mixed recipient support (internal users + external emails)
 */

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const RecipientPickerInline = memo(function RecipientPickerInline({
  organizationId,
  value,
  onChange,
  maxRecipients = 10,
  mode = "multi",
  placeholder = "Search recipients...",
}: RecipientPickerInlineProps) {
  const search = useRecipientSearch({ organizationId });
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Create external recipient from email
   */
  const createExternalRecipient = (email: string): RecipientCardType | null => {
    if (!isValidEmail(email)) return null;

    // Check if already added
    if (value.some((r) => r.email.toLowerCase() === email.toLowerCase())) {
      return null;
    }

    return {
      id: `external_${email}`,
      email,
      name: email,
      role: "external",
      organizationId,
      isExternal: true,
      userId: null,
    };
  };

  // Get unique results for display (avoid duplicates in search results)
  const allResults = search.results.users.filter(
    (u) => !value.some((v) => v.email === u.email)
  );

  // Check if we should show the manual email entry option
  const showManualEmailEntry =
    search.query.length > 0 &&
    isValidEmail(search.query.trim()) &&
    !allResults.some((u) => u.email.toLowerCase() === search.query.toLowerCase()) &&
    !value.some((v) => v.email.toLowerCase() === search.query.toLowerCase());

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, allResults.length));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < allResults.length) {
          // Select internal recipient
          addRecipient(allResults[focusedIndex]);
        } else if (focusedIndex === allResults.length && search.query) {
          // Add as external email if it's a valid email and focused on the manual entry option
          const externalRecipient = createExternalRecipient(search.query.trim());
          if (externalRecipient) {
            addRecipient(externalRecipient);
          }
        } else if (search.query && isValidEmail(search.query.trim())) {
          // Add external email directly if Enter is pressed with valid email
          const externalRecipient = createExternalRecipient(search.query.trim());
          if (externalRecipient) {
            addRecipient(externalRecipient);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case "Backspace":
        // Allow backspace but focus on last pill if at start of input
        if (search.query === "" && value.length > 0) {
          removeRecipient(value[value.length - 1].email);
        }
        break;
    }
  };

  /**
   * Add recipient to selection
   */
  const addRecipient = (recipient: RecipientCardType) => {
    if (mode === "single") {
      onChange([recipient]);
      setIsOpen(false);
      search.handleSearch("");
    } else {
      if (value.length < maxRecipients) {
        onChange([...value, recipient]);
        search.handleSearch("");
        // Clear input and keep focused
        inputRef.current?.focus();
      }
    }
  };

  /**
   * Remove recipient from selection
   */
  const removeRecipient = (email: string) => {
    onChange(value.filter((r) => r.email !== email));
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Show loading or no results
  const isLoading = search.loading;
  const hasResults = allResults.length > 0;
  const showEmpty = !isLoading && !hasResults && search.query.length > 0;

  return (
    <div className="relative">
      {/* Input Container */}
      <div className="flex flex-wrap gap-2 p-2 border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent">
        {/* Selected pills */}
        {value.map((recipient) => (
          <div
            key={recipient.email}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/10 border border-brand/30 text-sm"
          >
            <span className="text-slate-900 font-medium">
              {recipient.name || recipient.email}
              {recipient.isExternal && (
                <span className="ml-1 text-xs font-normal text-slate-500">(external)</span>
              )}
            </span>
            <button
              onClick={() => removeRecipient(recipient.email)}
              className="text-slate-500 hover:text-slate-700 transition"
              aria-label={`Remove ${recipient.name || recipient.email}`}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={search.query}
          onChange={(e) => {
            search.handleSearch(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={mode === "single" && value.length > 0}
          className="flex-1 min-w-[150px] bg-transparent outline-none text-sm placeholder:text-slate-500"
          aria-label="Search recipients"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          autoComplete="off"
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Loading state */}
          {isLoading && (
            <div className="p-4 text-center text-slate-500">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin">
                  <div className="h-3 w-3 border-2 border-slate-200 border-t-brand rounded-full" />
                </div>
                <span className="text-sm">Searching...</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div className="p-4 text-center text-slate-500">
              <p className="text-sm">No recipients found for "{search.query}"</p>
            </div>
          )}

          {/* Results list */}
          {!isLoading && hasResults && (
            <div className="max-h-64 overflow-y-auto py-2">
              {allResults.map((recipient, index) => (
                <button
                  key={recipient.email}
                  onClick={() => addRecipient(recipient)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition ${
                    focusedIndex === index ? "bg-brand/10" : ""
                  }`}
                  onMouseEnter={() => setFocusedIndex(index)}
                  type="button"
                >
                  <div className="font-medium text-slate-900">
                    {recipient.name || recipient.email}
                  </div>
                  <div className="text-xs text-slate-500">{recipient.email}</div>
                </button>
              ))}

              {/* Manual email entry option */}
              {showManualEmailEntry && (
                <button
                  onClick={() => {
                    const external = createExternalRecipient(search.query.trim());
                    if (external) addRecipient(external);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition border-t border-slate-100 ${
                    focusedIndex === allResults.length ? "bg-brand/10" : ""
                  }`}
                  onMouseEnter={() => setFocusedIndex(allResults.length)}
                  type="button"
                >
                  <div className="font-medium text-slate-900">
                    Use external email
                  </div>
                  <div className="text-xs text-slate-500">{search.query.trim()}</div>
                </button>
              )}
            </div>
          )}

          {/* No internal results but valid email - show manual entry */}
          {!isLoading && !hasResults && showManualEmailEntry && (
            <div className="py-2">
              <button
                onClick={() => {
                  const external = createExternalRecipient(search.query.trim());
                  if (external) addRecipient(external);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition ${
                  focusedIndex === 0 ? "bg-brand/10" : ""
                }`}
                onMouseEnter={() => setFocusedIndex(0)}
                type="button"
              >
                <div className="font-medium text-slate-900">
                  Use external email
                </div>
                <div className="text-xs text-slate-500">{search.query.trim()}</div>
              </button>
            </div>
          )}

          {/* Help text */}
          {!search.query && !isLoading && (
            <div className="p-3 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
              Start typing to search by name or email
            </div>
          )}
        </div>
      )}

      {/* Max recipients warning */}
      {mode === "multi" && value.length >= maxRecipients && (
        <p className="mt-1 text-xs text-warning">
          Maximum {maxRecipients} recipients reached
        </p>
      )}
    </div>
  );
});

RecipientPickerInline.displayName = "RecipientPickerInline";
