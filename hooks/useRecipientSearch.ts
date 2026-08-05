"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  searchRecipients,
  getDepartmentMembers,
  validateRecipients,
} from "@/actions/recipient.actions";
import type {
  RecipientCard,
  RecipientGroup,
  RecipientSearchResult,
  RecipientSelection,
} from "@/lib/communications/recipient.types";

interface UseRecipientSearchOptions {
  organizationId: string;
  debounceMs?: number;
  limit?: number;
  type?: "applicants" | "staff" | "admins";
  departmentId?: string;
  excludeUserId?: string;
}

/**
 * Hook for recipient search with debouncing and caching
 * Provides search, suggestions, recent contacts, and selection management
 */
export function useRecipientSearch(options: UseRecipientSearchOptions) {
  const {
    organizationId,
    debounceMs = 300,
    limit = 20,
    type = "staff",
    departmentId,
    excludeUserId,
  } = options;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecipientSearchResult>({
    users: [],
    groups: [],
    recent: [],
    favorites: [],
    suggestions: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RecipientSelection[]>([]);

  // Cache search results to avoid duplicate requests
  const cacheRef = useRef<Map<string, RecipientSearchResult>>(new Map());
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * Perform search with debouncing and caching
   */
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() && searchQuery !== "") {
        setResults({
          users: [],
          groups: [],
          recent: results.recent,
          favorites: results.favorites,
          suggestions: results.suggestions,
        });
        return;
      }

      // Check cache first
      const cacheKey = `${organizationId}:${searchQuery}:${type}`;
      if (cacheRef.current.has(cacheKey)) {
        setResults(cacheRef.current.get(cacheKey)!);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const searchResults = await searchRecipients(organizationId, searchQuery, {
          limit,
          departmentId,
          type,
          excludeUserId,
        });

        // Cache the results
        cacheRef.current.set(cacheKey, searchResults);

        // Keep recent, favorites, suggestions from initial load
        if (searchQuery === "") {
          setResults(searchResults);
        } else {
          setResults({
            users: searchResults.users,
            groups: searchResults.groups,
            recent: results.recent,
            favorites: results.favorites,
            suggestions: results.suggestions,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        console.error("Recipient search error:", err);
      } finally {
        setLoading(false);
      }
    },
    [organizationId, type, departmentId, excludeUserId, limit, results.recent, results.favorites, results.suggestions]
  );

  /**
   * Handle search input with debouncing
   */
  const handleSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, debounceMs);
    },
    [performSearch, debounceMs]
  );

  /**
   * Load initial suggestions and recent contacts
   */
  useEffect(() => {
    performSearch("");
  }, [organizationId]);

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  /**
   * Expand a group and load members
   */
  const expandGroup = useCallback(
    async (group: RecipientGroup) => {
      if (group.type === "department" && !group.members) {
        try {
          setLoading(true);
          const members = await getDepartmentMembers(group.id, organizationId);
          setResults((prev) => ({
            ...prev,
            groups: prev.groups.map((g) =>
              g.id === group.id
                ? { ...g, members, isExpanded: true }
                : g
            ),
          }));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load group members");
        } finally {
          setLoading(false);
        }
      } else {
        // Toggle expansion
        setResults((prev) => ({
          ...prev,
          groups: prev.groups.map((g) =>
            g.id === group.id
              ? { ...g, isExpanded: !g.isExpanded }
              : g
          ),
        }));
      }
    },
    [organizationId]
  );

  /**
   * Select a recipient
   */
  const selectRecipient = useCallback((recipient: RecipientCard) => {
    setSelected((prev) => {
      const exists = prev.find((r) => r.email === recipient.email);
      if (exists) {
        return prev;
      }
      return [
        ...prev,
        {
          id: recipient.id,
          email: recipient.email,
          name: recipient.name,
          role: recipient.role,
          organizationId,
          type: "user",
        },
      ];
    });
  }, [organizationId]);

  /**
   * Deselect a recipient
   */
  const deselectRecipient = useCallback((email: string) => {
    setSelected((prev) => prev.filter((r) => r.email !== email));
  }, []);

  /**
   * Select entire group
   */
  const selectGroup = useCallback(
    (group: RecipientGroup) => {
      const members = group.members || [];
      const groupMembers = members.map((member) => ({
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        organizationId,
        type: "user" as const,
      }));

      setSelected((prev) => {
        const newSelected = [...prev];
        for (const member of groupMembers) {
          if (!newSelected.find((r) => r.email === member.email)) {
            newSelected.push(member);
          }
        }
        return newSelected;
      });
    },
    [organizationId]
  );

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelected([]);
  }, []);

  /**
   * Validate selected recipients
   */
  const validateSelection = useCallback(async () => {
    if (selected.length === 0) {
      setError("Please select at least one recipient");
      return false;
    }

    try {
      const validation = await validateRecipients(selected, organizationId);
      if (!validation.valid) {
        setError(validation.errors.join("; "));
        return false;
      }
      if (validation.warnings.length > 0) {
        console.warn("Recipient warnings:", validation.warnings);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
      return false;
    }
  }, [selected, organizationId]);

  /**
   * Get summary of selected recipients
   */
  const selectedSummary = useMemo(() => {
    const uniqueEmails = new Set(selected.map((r) => r.email));
    const uniqueOrganizations = new Set(selected.map((r) => r.organizationId));

    return {
      total: selected.length,
      unique: uniqueEmails.size,
      organizations: Array.from(uniqueOrganizations),
      emails: Array.from(uniqueEmails),
      hasDuplicates: uniqueEmails.size < selected.length,
    };
  }, [selected]);

  /**
   * Suggested next recipients based on search results
   */
  const suggestedNext = useMemo(() => {
    // Combine all suggestions and recent, prioritize by frequency
    const allSuggested = [
      ...results.suggestions,
      ...results.recent,
      ...results.users.slice(0, 3),
    ];

    // Filter out already selected
    const selectedEmails = new Set(selected.map((r) => r.email));
    return allSuggested.filter(
      (r) =>
        !selectedEmails.has(r.email) &&
        !allSuggested.slice(0, allSuggested.indexOf(r)).some((s) => s.email === r.email)
    );
  }, [results.suggestions, results.recent, results.users, selected]);

  return {
    // State
    query,
    results,
    selected,
    loading,
    error,

    // Actions
    handleSearch,
    selectRecipient,
    deselectRecipient,
    selectGroup,
    expandGroup,
    clearSelection,
    validateSelection,

    // Summary info
    selectedSummary,
    suggestedNext,
  };
}

/**
 * Hook for managing single recipient selection (reply/message mode)
 */
export function useSingleRecipient(organizationId: string) {
  const search = useRecipientSearch({ organizationId, limit: 10 });
  const [selected, setSelected] = useState<RecipientCard | null>(null);

  const selectSingle = useCallback(
    (recipient: RecipientCard) => {
      setSelected(recipient);
      search.clearSelection();
      search.selectRecipient(recipient);
    },
    [search]
  );

  const clearSingle = useCallback(() => {
    setSelected(null);
    search.clearSelection();
  }, [search]);

  return {
    ...search,
    selected,
    selectSingle,
    clearSingle,
  };
}

/**
 * Hook for managing multiple recipient selection (announcement/broadcast mode)
 */
export function useMultipleRecipients(organizationId: string) {
  const search = useRecipientSearch({ organizationId });

  const toggleRecipient = useCallback(
    (recipient: RecipientCard) => {
      const isSelected = search.selected.some((r) => r.email === recipient.email);
      if (isSelected) {
        search.deselectRecipient(recipient.email);
      } else {
        search.selectRecipient(recipient);
      }
    },
    [search]
  );

  const isSelected = useCallback(
    (email: string) => {
      return search.selected.some((r) => r.email === email);
    },
    [search.selected]
  );

  return {
    ...search,
    toggleRecipient,
    isSelected,
  };
}
