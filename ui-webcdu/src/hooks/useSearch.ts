import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { searchEngine } from '@/lib/search-engine';
import type { 
  SearchState, 
  SearchMode, 
  SearchableNode, 
  SearchableEdge,
  SearchResult
} from '@/lib/search-types';

/**
 * Configuration for the search hook
 */
interface UseSearchConfig {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Whether to automatically search on input change */
  autoSearch?: boolean;
  /** Minimum query length to trigger search */
  minQueryLength?: number;
}

/**
 * Hook for managing search state and operations
 * Integrates with SearchEngine and provides debounced search functionality
 */
export function useSearch(
  nodes: SearchableNode[] = [],
  edges: SearchableEdge[] = [],
  config: UseSearchConfig = {}
) {
  const {
    debounceMs = 300,
    autoSearch = true,
    minQueryLength = 1
  } = config;

  // Core search state
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    mode: 'id',
    results: null,
    isActive: false,
    highlightedElements: {
      nodes: [],
      edges: []
    },
    isLoading: false
  });

  // Debounced query for automatic search
  const debouncedQuery = useDebounce(searchState.query, debounceMs);

  // Memoized search engine instance
  const engine = useMemo(() => searchEngine, []);

  // Perform search operation
  const performSearch = useCallback(async (
    query: string, 
    mode: SearchMode,
    currentNodes: SearchableNode[] = nodes,
    currentEdges: SearchableEdge[] = edges
  ): Promise<SearchResult> => {
    if (!query.trim() || query.length < minQueryLength) {
      return {
        nodes: [],
        edges: [],
        found: false,
        searchType: mode,
        query,
        error: query.length > 0 ? 'Query too short' : 'Empty query'
      };
    }

    try {
      let result: SearchResult;
      
      if (mode === 'id') {
        result = engine.searchById(query, currentNodes);
      } else {
        result = engine.searchByVariable(query, currentNodes, currentEdges);
      }

      return result;
    } catch (error) {
      console.error('Search error:', error);
      return {
        nodes: [],
        edges: [],
        found: false,
        searchType: mode,
        query,
        error: 'Search failed'
      };
    }
  }, [engine, nodes, edges, minQueryLength]);

  // Handle search input changes
  const handleSearchInput = useCallback((query: string) => {
    setSearchState(prev => ({
      ...prev,
      query,
      isLoading: autoSearch && query.trim().length >= minQueryLength
    }));
  }, [autoSearch, minQueryLength]);

  // Handle search mode changes
  const handleSearchModeChange = useCallback((mode: SearchMode) => {
    setSearchState(prev => ({
      ...prev,
      mode,
      // Trigger new search if we have a query
      isLoading: autoSearch && prev.query.trim().length >= minQueryLength
    }));
  }, [autoSearch, minQueryLength]);

  // Clear search state
  const clearSearch = useCallback(() => {
    setSearchState({
      query: '',
      mode: 'id',
      results: null,
      isActive: false,
      highlightedElements: {
        nodes: [],
        edges: []
      },
      isLoading: false
    });
  }, []);

  // Manual search trigger
  const triggerSearch = useCallback(async (
    customQuery?: string,
    customMode?: SearchMode
  ) => {
    const query = customQuery ?? searchState.query;
    const mode = customMode ?? searchState.mode;

    if (!query.trim()) {
      clearSearch();
      return;
    }

    setSearchState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await performSearch(query, mode, nodes, edges);
      
      setSearchState(prev => ({
        ...prev,
        results: result,
        isActive: result.found,
        highlightedElements: {
          nodes: result.nodes.map(n => n.id),
          edges: result.edges.map(e => e.id)
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Manual search error:', error);
      setSearchState(prev => ({
        ...prev,
        results: {
          nodes: [],
          edges: [],
          found: false,
          searchType: mode,
          query,
          error: 'Search failed'
        },
        isActive: false,
        isLoading: false
      }));
    }
  }, [searchState.query, searchState.mode, performSearch, nodes, edges, clearSearch]);

  // Auto-search effect when debounced query changes
  useEffect(() => {
    if (!autoSearch) return;

    const executeAutoSearch = async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < minQueryLength) {
        if (searchState.isActive) {
          clearSearch();
        }
        return;
      }

      // Only search if the debounced query matches current query (avoid stale searches)
      if (debouncedQuery !== searchState.query) {
        return;
      }

      await triggerSearch(debouncedQuery, searchState.mode);
    };

    executeAutoSearch();
  }, [debouncedQuery, searchState.mode, searchState.query, autoSearch, minQueryLength, triggerSearch, searchState.isActive, clearSearch]);

  // Update search when nodes or edges change (re-run current search)
  useEffect(() => {
    // Invalidate cache and rebuild index when nodes or edges change
    engine.invalidateCache();
    
    if (nodes.length > 0) {
      // Rebuild the variable index when nodes change
      engine.buildVariableIndex(nodes);
    }
    
    if (searchState.isActive && searchState.query.trim()) {
      // Re-run search with new data
      triggerSearch();
    }
  }, [nodes, edges]); // Only depend on nodes/edges, not triggerSearch to avoid infinite loops

  // Validation helpers
  const isValidQuery = useMemo(() => {
    return engine.validateSearchQuery(searchState.query);
  }, [engine, searchState.query]);

  const hasResults = useMemo(() => {
    return searchState.results?.found ?? false;
  }, [searchState.results]);

  const resultCount = useMemo(() => {
    return searchState.results?.nodes.length ?? 0;
  }, [searchState.results]);

  return {
    // State
    searchState,
    isValidQuery,
    hasResults,
    resultCount,
    
    // Actions
    handleSearchInput,
    handleSearchModeChange,
    clearSearch,
    triggerSearch,
    
    // Utilities
    performSearch
  };
}

/**
 * Default export for easier importing
 */
export default useSearch;