/**
 * SearchEngine implementation for node search functionality
 * 
 * This module provides the core search logic for finding nodes by ID or variable name.
 * It implements comprehensive validation, error handling, and result processing
 * to ensure reliable search operations across the application.
 * 
 * @example
 * ```typescript
 * const engine = new SearchEngine();
 * const result = engine.searchById('0001', nodes);
 * if (result.found) {
 *   console.log('Found node:', result.nodes[0]);
 * }
 * ```
 */

import type { 
  ISearchEngine, 
  SearchResult, 
  SearchableNode, 
  SearchableEdge, 
  SearchMode 
} from './search-types';
import { 
  sanitizeSearchInput, 
  isValidNodeId, 
  normalizeNodeId, 
  isValidVariableName,
  nodeHasVariable,
  findConnectingEdges,
  parseVinString
} from './search-utils';

/**
 * Core search engine implementation
 */
export class SearchEngine implements ISearchEngine {
  // Cache for search results to improve performance
  private searchCache: Map<string, SearchResult> = new Map();
  private maxCacheSize: number = 100;
  
  // Variable index for faster lookups
  private variableIndex: Map<string, Set<string>> = new Map();
  private isIndexBuilt: boolean = false;
  
  /**
   * Search for a node by its unique ID
   * @param nodeId - The node ID to search for
   * @param nodes - Array of nodes to search through
   * @returns Search result containing matching node
   */
  searchById(nodeId: string, nodes: SearchableNode[]): SearchResult {
    // Sanitize and validate input
    const sanitizedId = sanitizeSearchInput(nodeId);
    
    // Handle empty input
    if (!sanitizedId) {
      return {
        nodes: [],
        edges: [],
        found: false,
        searchType: 'id',
        query: nodeId,
        error: 'Search query cannot be empty'
      };
    }

    // Validate node ID format
    if (!isValidNodeId(sanitizedId)) {
      return {
        nodes: [],
        edges: [],
        found: false,
        searchType: 'id',
        query: nodeId,
        error: 'Invalid node ID format'
      };
    }

    // Generate cache key for this search
    const cacheKey = `id:${sanitizedId}:${nodes.length}`;
    
    // Check cache first
    const cachedResult = this.searchCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Normalize the node ID to match the format used in the app
    const normalizedId = normalizeNodeId(sanitizedId);
    
    // Direct lookup for the node
    const matchingNode = nodes.find(node => {
      // Check both the node.id and node.data.id
      return node.id === normalizedId || 
             node.data.id === normalizedId ||
             node.id === sanitizedId ||
             node.data.id === sanitizedId;
    });

    let result: SearchResult;
    if (matchingNode) {
      result = {
        nodes: [matchingNode],
        edges: [],
        found: true,
        searchType: 'id',
        query: nodeId
      };
    } else {
      // Node not found
      result = {
        nodes: [],
        edges: [],
        found: false,
        searchType: 'id',
        query: nodeId,
        error: 'Node not found'
      };
    }

    // Cache the result
    this.addToCache(cacheKey, result);
    
    return result;
  }

  /**
   * Build variable index for faster lookups
   * @param nodes - Array of nodes to index
   */
  buildVariableIndex(nodes: SearchableNode[]): void {
    // Clear existing index
    this.variableIndex.clear();
    
    // Process each node
    nodes.forEach(node => {
      // Process Vout
      if (node.data.Vout) {
        const variable = node.data.Vout;
        if (!this.variableIndex.has(variable)) {
          this.variableIndex.set(variable, new Set());
        }
        this.variableIndex.get(variable)?.add(node.id);
      }
      
      // Process Vin
      const vinArray = parseVinString(node.data.Vin);
      vinArray.forEach(variable => {
        if (!this.variableIndex.has(variable)) {
          this.variableIndex.set(variable, new Set());
        }
        this.variableIndex.get(variable)?.add(node.id);
      });
    });
    
    this.isIndexBuilt = true;
  }
  
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
  ): SearchResult {
    // Sanitize and validate input
    const sanitizedVariable = sanitizeSearchInput(variableName);
    
    // Handle empty input
    if (!sanitizedVariable) {
      return {
        nodes: [],
        edges: [],
        found: false,
        searchType: 'variable',
        query: variableName,
        error: 'Search query cannot be empty'
      };
    }

    // Validate variable name format
    if (!isValidVariableName(sanitizedVariable)) {
      return {
        nodes: [],
        edges: [],
        found: false,
        searchType: 'variable',
        query: variableName,
        error: 'Invalid variable name format'
      };
    }

    // Generate cache key for this search
    const cacheKey = `var:${sanitizedVariable}:${nodes.length}:${edges.length}`;
    
    // Check cache first
    const cachedResult = this.searchCache.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Build or update variable index if needed
    if (!this.isIndexBuilt || this.variableIndex.size === 0) {
      this.buildVariableIndex(nodes);
    }
    
    let matchingNodes: SearchableNode[] = [];
    
    // Use index for faster lookup
    if (this.variableIndex.has(sanitizedVariable)) {
      const nodeIds = this.variableIndex.get(sanitizedVariable);
      if (nodeIds) {
        matchingNodes = nodes.filter(node => nodeIds.has(node.id));
      }
    }

    let result: SearchResult;
    if (matchingNodes.length === 0) {
      result = {
        nodes: [],
        edges: [],
        found: false,
        searchType: 'variable',
        query: variableName,
        error: 'Variable not found'
      };
    } else {
      // Find connecting edges between nodes with matching variables
      const connectingEdges = findConnectingEdges(matchingNodes, edges, sanitizedVariable);

      result = {
        nodes: matchingNodes,
        edges: connectingEdges,
        found: true,
        searchType: 'variable',
        query: variableName
      };
    }

    // Cache the result
    this.addToCache(cacheKey, result);
    
    return result;
  }
  
  /**
   * Add a search result to the cache
   * @param key - Cache key
   * @param result - Search result to cache
   */
  private addToCache(key: string, result: SearchResult): void {
    // If cache is at max size, remove oldest entry
    if (this.searchCache.size >= this.maxCacheSize) {
      const oldestKey = this.searchCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.searchCache.delete(oldestKey);
      }
    }
    
    // Add new result to cache
    this.searchCache.set(key, result);
  }
  
  /**
   * Clear the search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }
  
  /**
   * Invalidate cache entries related to specific nodes or edges
   * @param nodeIds - IDs of nodes that have changed
   * @param edgeIds - IDs of edges that have changed
   */
  invalidateCache(nodeIds?: string[], edgeIds?: string[]): void {
    // If no specific IDs provided, clear entire cache
    if (!nodeIds && !edgeIds) {
      this.clearCache();
      return;
    }
    
    // For now, we'll just clear the entire cache when nodes/edges change
    // A more sophisticated approach would be to only invalidate affected entries
    this.clearCache();
  }

  /**
   * Validate a search query
   * @param query - The search query to validate
   * @returns Whether the query is valid
   */
  validateSearchQuery(query: string): boolean {
    const sanitized = sanitizeSearchInput(query);
    
    if (!sanitized) {
      return false;
    }

    // Check if it could be a valid node ID or variable name
    return isValidNodeId(sanitized) || isValidVariableName(sanitized);
  }

  /**
   * Process and validate search results
   * @param result - Raw search result to process
   * @returns Processed and validated search result
   */
  processSearchResult(result: SearchResult): SearchResult {
    // Ensure nodes array is not null/undefined
    if (!result.nodes) {
      result.nodes = [];
    }

    // Ensure edges array is not null/undefined
    if (!result.edges) {
      result.edges = [];
    }

    // Update found status based on actual results
    result.found = result.nodes.length > 0;

    // Add appropriate error message if no results found and no existing error
    if (!result.found && !result.error) {
      result.error = result.searchType === 'id' ? 'Node not found' : 'Variable not found';
    }

    // Clear error if results were found
    if (result.found && result.error) {
      delete result.error;
    }

    return result;
  }

  /**
   * Create an empty search result with error
   * @param searchType - Type of search performed
   * @param query - Original search query
   * @param error - Error message
   * @returns Empty search result with error
   */
  createErrorResult(searchType: SearchMode, query: string, error: string): SearchResult {
    return {
      nodes: [],
      edges: [],
      found: false,
      searchType,
      query,
      error
    };
  }

  /**
   * Validate search result integrity
   * @param result - Search result to validate
   * @returns Whether the search result is valid
   */
  validateSearchResult(result: SearchResult): boolean {
    // Check required properties exist
    if (!result || typeof result !== 'object') {
      return false;
    }

    // Check required fields
    if (!Array.isArray(result.nodes) || 
        !Array.isArray(result.edges) ||
        typeof result.found !== 'boolean' ||
        !result.searchType ||
        typeof result.query !== 'string') {
      return false;
    }

    // Check searchType is valid
    if (result.searchType !== 'id' && result.searchType !== 'variable') {
      return false;
    }

    // If found is true, should have at least one node
    if (result.found && result.nodes.length === 0) {
      return false;
    }

    // If found is false, should have an error message
    if (!result.found && !result.error) {
      return false;
    }

    return true;
  }
  
  /**
   * Update the variable index when nodes are modified
   * @param nodeId - ID of the node that was modified
   * @param oldVin - Previous Vin values
   * @param oldVout - Previous Vout value
   * @param newVin - New Vin values
   * @param newVout - New Vout value
   */
  updateVariableIndexForNode(
    nodeId: string,
    oldVin: string[] = [],
    oldVout?: string,
    newVin: string[] = [],
    newVout?: string
  ): void {
    // Remove old variable references
    if (oldVout) {
      const nodeSet = this.variableIndex.get(oldVout);
      if (nodeSet) {
        nodeSet.delete(nodeId);
        if (nodeSet.size === 0) {
          this.variableIndex.delete(oldVout);
        }
      }
    }
    
    oldVin.forEach(variable => {
      const nodeSet = this.variableIndex.get(variable);
      if (nodeSet) {
        nodeSet.delete(nodeId);
        if (nodeSet.size === 0) {
          this.variableIndex.delete(variable);
        }
      }
    });
    
    // Add new variable references
    if (newVout) {
      if (!this.variableIndex.has(newVout)) {
        this.variableIndex.set(newVout, new Set());
      }
      this.variableIndex.get(newVout)?.add(nodeId);
    }
    
    newVin.forEach(variable => {
      if (!this.variableIndex.has(variable)) {
        this.variableIndex.set(variable, new Set());
      }
      this.variableIndex.get(variable)?.add(nodeId);
    });
  }
  
  /**
   * Remove a node from the variable index
   * @param nodeId - ID of the node to remove
   * @param node - Optional node data to optimize removal
   */
  removeNodeFromIndex(nodeId: string, node?: SearchableNode): void {
    if (node) {
      // If we have the node data, we can directly remove its variables
      if (node.data.Vout) {
        const nodeSet = this.variableIndex.get(node.data.Vout);
        if (nodeSet) {
          nodeSet.delete(nodeId);
          if (nodeSet.size === 0) {
            this.variableIndex.delete(node.data.Vout);
          }
        }
      }
      
      const vinArray = parseVinString(node.data.Vin);
      vinArray.forEach(variable => {
        const nodeSet = this.variableIndex.get(variable);
        if (nodeSet) {
          nodeSet.delete(nodeId);
          if (nodeSet.size === 0) {
            this.variableIndex.delete(variable);
          }
        }
      });
    } else {
      // If we don't have the node data, we need to scan the entire index
      this.variableIndex.forEach((nodeSet, variable) => {
        if (nodeSet.has(nodeId)) {
          nodeSet.delete(nodeId);
          if (nodeSet.size === 0) {
            this.variableIndex.delete(variable);
          }
        }
      });
    }
  }
  
  /**
   * Get the current size of the variable index
   * @returns Number of indexed variables
   */
  getIndexSize(): number {
    return this.variableIndex.size;
  }
  
  /**
   * Check if the variable index is built
   * @returns Whether the index is built
   */
  isIndexed(): boolean {
    return this.isIndexBuilt;
  }
}



/**
 * Default search engine instance
 */
export const searchEngine = new SearchEngine();