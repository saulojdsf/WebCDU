/**
 * Search functionality exports
 * Central export point for all search-related types, interfaces, and utilities
 */

// Export all types and interfaces
export type {
  SearchMode,
  SearchableNode,
  SearchableEdge,
  SearchResult,
  SearchState,
  SearchConfig,
  ISearchEngine,
  IVisualizationController,
  SearchComponentProps,
  SearchEventHandler,
  SearchContextType,
} from './search-types';

// Export constants
export { DEFAULT_SEARCH_CONFIG } from './search-types';

// Export all utility functions
export {
  parseVinString,
  nodeHasVariable,
  findConnectingEdges,
  sanitizeSearchInput,
  isValidNodeId,
  normalizeNodeId,
  isValidVariableName,
  detectSearchMode,
  debounce,
  calculateNodesCenter,
  getNodesBoundingBox,
} from './search-utils';