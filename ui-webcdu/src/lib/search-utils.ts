/**
 * Utility functions for search functionality
 */

import type { SearchableNode, SearchableEdge, SearchMode } from './search-types';

/**
 * Parse a Vin string that may be in array format like "[X0001,X0002]"
 * @param vin - The Vin string to parse
 * @returns Array of variable names
 */
export function parseVinString(vin: string | undefined): string[] {
  if (!vin) return [];
  
  // Remove brackets and split by comma
  const cleaned = vin.replace(/[\[\]]/g, '').trim();
  if (!cleaned) return [];
  
  return cleaned.split(',').map(v => v.trim()).filter(v => v.length > 0);
}

/**
 * Check if a node has a specific variable in its Vin or Vout
 * @param node - Node to check
 * @param variableName - Variable name to search for
 * @param caseSensitive - Whether to perform case-sensitive search
 * @returns Whether the node contains the variable
 */
export function nodeHasVariable(
  node: SearchableNode, 
  variableName: string, 
  caseSensitive: boolean = false
): boolean {
  const searchTerm = caseSensitive ? variableName : variableName.toLowerCase();
  
  // Check Vout
  const vout = node.data.Vout;
  if (vout) {
    const voutToCheck = caseSensitive ? vout : vout.toLowerCase();
    if (voutToCheck === searchTerm) return true;
  }
  
  // Check Vin array
  const vinArray = parseVinString(node.data.Vin);
  return vinArray.some(vin => {
    const vinToCheck = caseSensitive ? vin : vin.toLowerCase();
    return vinToCheck === searchTerm;
  });
}

/**
 * Find edges that connect nodes with a specific variable
 * @param matchingNodes - Array of nodes that have the variable
 * @param allEdges - Array of all edges
 * @param variableName - The variable name being searched
 * @returns Array of connecting edges
 */
export function findConnectingEdges(
  matchingNodes: SearchableNode[], 
  allEdges: SearchableEdge[], 
  variableName: string
): SearchableEdge[] {
  const matchingNodeIds = new Set(matchingNodes.map(n => n.id));
  
  return allEdges.filter(edge => {
    // Include edge if it connects two nodes that both have the variable
    if (matchingNodeIds.has(edge.source) && matchingNodeIds.has(edge.target)) {
      return true;
    }
    
    // Also include edges that represent the data flow of the searched variable
    // by checking if the source node outputs the variable and target node inputs it
    const sourceNode = matchingNodes.find(n => n.id === edge.source);
    const targetNode = matchingNodes.find(n => n.id === edge.target);
    
    if (sourceNode && targetNode) {
      const sourceVout = sourceNode.data.Vout;
      const targetVin = parseVinString(targetNode.data.Vin);
      
      return sourceVout === variableName && targetVin.includes(variableName);
    }
    
    return false;
  });
}

/**
 * Sanitize search input to prevent potential issues
 * @param input - Raw search input
 * @returns Sanitized search input
 */
export function sanitizeSearchInput(input: string): string {
  // Trim whitespace and limit length
  return input.trim().slice(0, 50);
}

/**
 * Validate node ID format (should be 1-4 digits, can be padded)
 * @param nodeId - Node ID to validate
 * @returns Whether the node ID format is valid
 */
export function isValidNodeId(nodeId: string): boolean {
  // Allow 1-4 digits, with or without leading zeros
  const numericPart = nodeId.replace(/^0+/, '') || '0';
  const num = parseInt(numericPart, 10);
  return !isNaN(num) && num >= 1 && num <= 9999;
}

/**
 * Normalize node ID to match the padded format used in the app
 * @param nodeId - Node ID to normalize
 * @returns Normalized node ID (4 digits with leading zeros)
 */
export function normalizeNodeId(nodeId: string): string {
  const numericPart = nodeId.replace(/\D/g, '');
  const num = parseInt(numericPart, 10);
  
  if (isNaN(num) || num < 1 || num > 9999) {
    return nodeId; // Return original if invalid
  }
  
  return num.toString().padStart(4, '0');
}

/**
 * Check if a variable name is valid
 * @param variableName - Variable name to validate
 * @returns Whether the variable name is valid
 */
export function isValidVariableName(variableName: string): boolean {
  // Variable names should not be empty and not start with a number
  return variableName.length > 0 && 
         variableName.length <= 5 && 
         !/^[0-9]/.test(variableName);
}

/**
 * Get search mode based on input pattern
 * @param input - Search input string
 * @returns Suggested search mode based on input pattern
 */
export function detectSearchMode(input: string): SearchMode {
  // If input looks like a node ID (numeric), suggest ID search
  if (/^\d+$/.test(input.trim())) {
    return 'id';
  }
  
  // Otherwise suggest variable search
  return 'variable';
}

/**
 * Create a debounced function
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T, 
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Calculate the center point of multiple nodes for view centering
 * @param nodes - Array of nodes to calculate center for
 * @returns Center point coordinates
 */
export function calculateNodesCenter(nodes: SearchableNode[]): { x: number; y: number } {
  if (nodes.length === 0) {
    return { x: 0, y: 0 };
  }
  
  const totalX = nodes.reduce((sum, node) => sum + node.position.x, 0);
  const totalY = nodes.reduce((sum, node) => sum + node.position.y, 0);
  
  return {
    x: totalX / nodes.length,
    y: totalY / nodes.length,
  };
}

/**
 * Get bounding box of multiple nodes for view fitting
 * @param nodes - Array of nodes to calculate bounding box for
 * @returns Bounding box coordinates
 */
export function getNodesBoundingBox(nodes: SearchableNode[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  const positions = nodes.map(node => node.position);
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));
  
  // Add some padding around nodes (assuming standard node size)
  const padding = 100;
  const nodeWidth = 150; // Standard node width
  const nodeHeight = 75;  // Standard node height
  
  return {
    x: minX - padding,
    y: minY - padding,
    width: (maxX - minX) + nodeWidth + (padding * 2),
    height: (maxY - minY) + nodeHeight + (padding * 2),
  };
}