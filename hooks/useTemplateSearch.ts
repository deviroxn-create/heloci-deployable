import { useState, useCallback, useRef, useEffect } from "react";
import {
  searchTemplatesAction,
  getTemplateCategoriesAction,
  getFavoriteTemplatesAction,
  getRecentTemplatesAction,
  getSuggestedTemplatesAction,
  type SmartTemplate,
  type TemplateCategory,
  type TemplateSearchResult
} from "@/actions/template.actions";

export interface UseTemplateSearchOptions {
  initialQuery?: string;
  initialCategory?: TemplateCategory;
  initialPage?: number;
  pageSize?: number;
  debounceMs?: number;
}

export interface UseTemplateSearchResult {
  // Search state
  query: string;
  category: TemplateCategory | undefined;
  status: "DRAFT" | "PUBLISHED" | "ALL";
  page: number;
  pageSize: number;

  // Results
  templates: SmartTemplate[];
  favorites: SmartTemplate[];
  recent: SmartTemplate[];
  suggested: SmartTemplate[];
  categories: any[];
  
  // Loading and error states
  loading: boolean;
  error: string | null;
  total: number;

  // Actions
  search: (query: string) => void;
  setCategory: (category: TemplateCategory | undefined) => void;
  setStatus: (status: "DRAFT" | "PUBLISHED" | "ALL") => void;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  reset: () => void;

  // Computed
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages: number;
}

/**
 * Hook for smart template search and management
 * Handles debounced search, pagination, filtering, and category navigation
 */
export function useTemplateSearch(options: UseTemplateSearchOptions = {}): UseTemplateSearchResult {
  const {
    initialQuery = "",
    initialCategory,
    initialPage = 1,
    pageSize = 20,
    debounceMs = 300
  } = options;

  // State
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<TemplateCategory | undefined>(initialCategory);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ALL">("PUBLISHED");
  const [page, setPage] = useState(initialPage);
  const [templates, setTemplates] = useState<SmartTemplate[]>([]);
  const [favorites, setFavorites] = useState<SmartTemplate[]>([]);
  const [recent, setRecent] = useState<SmartTemplate[]>([]);
  const [suggested, setSuggested] = useState<SmartTemplate[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Debounce timer
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load templates when query/category/status/page changes
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      loadTemplates();
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, category, status, page, pageSize]);

  // Load categories
  async function loadCategories() {
    try {
      const cats = await getTemplateCategoriesAction();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  // Load templates
  async function loadTemplates() {
    setLoading(true);
    setError(null);

    try {
      const result = await searchTemplatesAction(query, category, status, page, pageSize);
      setTemplates(result.templates);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to search templates");
      setTemplates([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  // Load favorites
  async function loadFavorites() {
    try {
      const favs = await getFavoriteTemplatesAction();
      setFavorites(favs);
    } catch (err) {
      console.error("Failed to load favorites:", err);
    }
  }

  // Load recent
  async function loadRecent() {
    try {
      const recentTemplates = await getRecentTemplatesAction();
      setRecent(recentTemplates);
    } catch (err) {
      console.error("Failed to load recent:", err);
    }
  }

  // Load suggested
  async function loadSuggested(context: any) {
    try {
      const suggested = await getSuggestedTemplatesAction(context);
      setSuggested(suggested);
    } catch (err) {
      console.error("Failed to load suggested:", err);
    }
  }

  // Search action
  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setPage(1);
  }, []);

  // Reset
  const reset = useCallback(() => {
    setQuery("");
    setCategory(undefined);
    setStatus("PUBLISHED");
    setPage(1);
    setError(null);
  }, []);

  // Pagination
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(p => p + 1);
    }
  }, [total, pageSize, page]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  }, [page]);

  // Computed
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    query,
    category,
    status,
    page,
    pageSize,
    templates,
    favorites,
    recent,
    suggested,
    categories,
    loading,
    error,
    total,
    search,
    setCategory,
    setStatus,
    setPage,
    nextPage,
    prevPage,
    reset,
    hasNextPage,
    hasPrevPage,
    totalPages
  };
}
