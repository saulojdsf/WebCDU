/**
 * Search functionality types and interfaces for node search feature
 * 
 * This module defines all TypeScript interfaces and types used throughout
 * the search functionality, providing a centralized type system for
 * better maintainability and type safety.
 */

import type { Node } from 'reactflow';

/**
 * Search modes available for node search
 */
export type SearchMode = 'id' | 'variable';

/**
 * Extended Node interface that includes the expected data structure
 * based on the existing node implementation
 */
export interface SearchableNode extends Node {
  data: {
    id: string;
    Vin?: string;  // Input variables (can be array string like "[X0001,X0002]")
    Vout?: string; // Output variable (single variable like "X0001")
    [key: string]: any; // Allow other node-specific properties
  };
}

/**
 * Extended Edge interface for search functionality
 */
export interface SearchableEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: any;
  label?: React.ReactNode;
}

/**
 * Result of a search operation
 */
export interface SearchResult {
  /** Nodes that match the search criteria */
  nodes: SearchableNode[];
  /** Edges that connect the matching nodes (for variable searches) */
  edges: SearchableEdge[];
  /** Whether any results were found */
  found: boolean;
  /** Type of search that was performed */
  searchType: SearchMode;
  /** Original search query */
  query: string;
  /** Optional error message if search failed */
  error?: string;
}

/**
 * Current state of the search functionality
 */
export interface SearchState {
  /** Current search query string */
  query: string;
  /** Active search mode */
  mode: SearchMode;
  /** Results of the last search operation */
  results: SearchResult | null;
  /** Whether search is currently active/has results */
  isActive: boolean;
  /** Elements currently highlighted from search */
  highlightedElements: {
    /** Node IDs that are highlighted */
    nodes: string[];
    /** Edge IDs that are highlighted */
    edges: string[];
  };
  /** Whether search is currently in progress */
  isLoading: boolean;
}

/**
 * Search engine configuration options
 */
export interface SearchConfig {
  /** Debounce delay in milliseconds for search input */
  debounceMs: number;
  /** Whether to perform case-sensitive searches */
  caseSensitive: boolean;
  /** Maximum number of results to return */
  maxResults: number;
}

/**
 * Search engine interface defining the core search functionality
 */
export interface ISearchEngine {
  /**
   * Search for a node by its unique ID
   * @param nodeId - The node ID to search for
   * @param nodes - Array of nodes to search through
   * @returns Search result containing matching node
   */
  searchById(nodeId: string, nodes: SearchableNode[]): SearchResult;

  /**
   * Search for nodes by variable name (Vin or Vout)
   * @param variableName - The variable name to search for
   * @param nodes - Array of nodes to search through
   * @param edges - Array of edges to find connections
   * @returns Search result containing matching nodes and connecting edges
   */
  searchByVariable(
    variableName: string, 
    nodes: SearchableNode[], 
    edges: SearchableEdge[]
  ): SearchResult;

  /**
   * Validate a search query
   * @param query - The search query to validate
   * @returns Whether the query is valid
   */
  validateSearchQuery(query: string): boolean;
}

/**
 * Visualization controller interface for managing search highlighting
 */
export interface IVisualizationController {
  /**
   * Apply visual highlighting to search results
   * @param result - Search result to highlight
   */
  highlightSearchResults(result: SearchResult): void;

  /**
   * Center the view on the specified nodes
   * @param nodes - Nodes to center the view on
   */
  centerViewOnNodes(nodes: SearchableNode[]): void;

  /**
   * Clear all search-related highlighting
   */
  clearHighlighting(): void;

  /**
   * Dim non-matching nodes to emphasize search results
   * @param matchingNodes - Nodes that should remain prominent
   */
  dimNonMatchingNodes(matchingNodes: SearchableNode[]): void;
}

/**
 * Search component props interface
 */
export interface SearchComponentProps {
  /** Current search state */
  searchState: SearchState;
  /** Callback when search input changes */
  onSearchInput: (query: string) => void;
  /** Callback when search mode changes */
  onSearchModeChange: (mode: SearchMode) => void;
  /** Callback to clear search */
  onClearSearch: () => void;
  /** Optional placeholder text for search input */
  placeholder?: string;
  /** Whether the search component is disabled */
  disabled?: boolean;
}

/**
 * Default search configuration
 */
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  debounceMs: 300,
  caseSensitive: false,
  maxResults: 100,
};

/**
 * Helper type for search event handlers
 */
export type SearchEventHandler = (searchState: SearchState) => void;

/**
 * Search context type for React context
 */
export interface SearchContextType {
  searchState: SearchState;
  searchEngine: ISearchEngine;
  visualizationController: IVisualizationController;
  performSearch: (query: string, mode: SearchMode) => void;
  clearSearch: () => void;
  setSearchMode: (mode: SearchMode) => void;
}