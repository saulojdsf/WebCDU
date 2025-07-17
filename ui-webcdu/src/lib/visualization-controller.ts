/**
 * VisualizationController implementation for search highlighting
 * 
 * This module manages visual updates and view adjustments based on search results.
 * It provides highlighting, dimming, and view centering functionality to enhance
 * the user experience when searching through graph nodes.
 * 
 * @example
 * ```typescript
 * const controller = new VisualizationController(reactFlowInstance);
 * controller.highlightSearchResults(searchResult);
 * controller.centerViewOnNodes(foundNodes);
 * ```
 */

import type { ReactFlowInstance } from 'reactflow';
import type { 
  IVisualizationController, 
  SearchResult, 
  SearchableNode,
  SearchableEdge
} from './search-types';

/**
 * Configuration for visualization effects
 */
interface VisualizationConfig {
  /** Duration of highlight transitions in milliseconds */
  transitionDuration: number;
  /** Color for highlighted nodes */
  highlightColor: string;
  /** Color for highlighted edges */
  edgeHighlightColor: string;
  /** Opacity for dimmed nodes */
  dimmedOpacity: number;
  /** Stroke width for highlighted edges */
  highlightedEdgeWidth: number;
  /** Z-index for highlighted elements */
  highlightZIndex: number;
}

/**
 * Default visualization configuration
 */
const DEFAULT_CONFIG: VisualizationConfig = {
  transitionDuration: 200,
  highlightColor: '#ff6b35', // Bright orange for high contrast
  edgeHighlightColor: '#ff6b35',
  dimmedOpacity: 0.5,
  highlightedEdgeWidth: 3,
  highlightZIndex: 1000
};

/**
 * VisualizationController manages search-related visual effects
 */
export class VisualizationController implements IVisualizationController {
  private reactFlowInstance: ReactFlowInstance | null = null;
  private config: VisualizationConfig;
  private highlightedNodeIds: Set<string> = new Set();
  private highlightedEdgeIds: Set<string> = new Set();
  private originalStyles: Map<string, any> = new Map();
  private isHighlightingActive: boolean = false;

  constructor(
    reactFlowInstance: ReactFlowInstance | null = null,
    config: Partial<VisualizationConfig> = {}
  ) {
    this.reactFlowInstance = reactFlowInstance;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set or update the ReactFlow instance
   * @param instance - ReactFlow instance
   */
  setReactFlowInstance(instance: ReactFlowInstance | null): void {
    this.reactFlowInstance = instance;
  }

  /**
   * Apply visual highlighting to search results
   * @param result - Search result to highlight
   */
  highlightSearchResults(result: SearchResult): void {
    if (!this.reactFlowInstance || !result.found) {
      this.clearHighlighting();
      return;
    }

    // Clear any existing highlighting first
    this.clearHighlighting();

    // Store highlighted element IDs
    this.highlightedNodeIds = new Set(result.nodes.map(node => node.id));
    this.highlightedEdgeIds = new Set(result.edges.map(edge => edge.id));
    this.isHighlightingActive = true;

    // Apply node highlighting
    this.applyNodeHighlighting(result.nodes);

    // Apply edge highlighting for variable searches
    if (result.searchType === 'variable' && result.edges.length > 0) {
      this.applyEdgeHighlighting(result.edges);
    }

    // Dim non-matching nodes
    this.dimNonMatchingNodes(result.nodes);
  }

  /**
   * Center the view on the specified nodes
   * @param nodes - Nodes to center the view on
   */
  centerViewOnNodes(nodes: SearchableNode[]): void {
    if (!this.reactFlowInstance || nodes.length === 0) {
      return;
    }

    try {
      if (nodes.length === 1) {
        // Single node - center directly on it
        const node = nodes[0];
        this.reactFlowInstance.setCenter(node.position.x, node.position.y, {
          zoom: 1.2,
          duration: this.config.transitionDuration
        });
      } else {
        // Multiple nodes - fit view to show all
        const nodeIds = nodes.map(node => node.id);
        this.reactFlowInstance.fitView({
          nodes: nodeIds,
          padding: 0.2,
          duration: this.config.transitionDuration,
          maxZoom: 1.5,
          minZoom: 0.5
        });
      }
    } catch (error) {
      console.warn('Failed to center view on nodes:', error);
    }
  }

  /**
   * Clear all search-related highlighting
   */
  clearHighlighting(): void {
    if (!this.isHighlightingActive) {
      return;
    }

    // Remove node highlighting
    this.clearNodeHighlighting();

    // Remove edge highlighting
    this.clearEdgeHighlighting();

    // Clear stored state
    this.highlightedNodeIds.clear();
    this.highlightedEdgeIds.clear();
    this.originalStyles.clear();
    this.isHighlightingActive = false;
  }

  /**
   * Dim non-matching nodes to emphasize search results
   * @param matchingNodes - Nodes that should remain prominent
   */
  dimNonMatchingNodes(matchingNodes: SearchableNode[]): void {
    if (!this.reactFlowInstance) {
      return;
    }

    const matchingNodeIds = new Set(matchingNodes.map(node => node.id));
    
    // Get all nodes from ReactFlow
    const allNodes = this.reactFlowInstance.getNodes();
    
    // Apply dimming to non-matching nodes
    allNodes.forEach(node => {
      if (!matchingNodeIds.has(node.id)) {
        this.applyNodeDimming(node.id);
      }
    });

    // Also dim non-highlighted edges
    const allEdges = this.reactFlowInstance.getEdges();
    allEdges.forEach(edge => {
      if (!this.highlightedEdgeIds.has(edge.id)) {
        this.applyEdgeDimming(edge.id);
      }
    });
  }

  /**
   * Apply highlighting styles to nodes
   * @param nodes - Nodes to highlight
   */
  private applyNodeHighlighting(nodes: SearchableNode[]): void {
    nodes.forEach(node => {
      const nodeElement = this.getNodeElement(node.id);
      if (nodeElement) {
        // Store original styles
        this.storeOriginalNodeStyles(node.id, nodeElement);
        
        // Apply highlight styles
        this.applyNodeHighlightStyles(nodeElement);
      }
    });
  }

  /**
   * Apply highlighting styles to edges
   * @param edges - Edges to highlight
   */
  private applyEdgeHighlighting(edges: SearchableEdge[]): void {
    edges.forEach(edge => {
      const edgeElement = this.getEdgeElement(edge.id);
      if (edgeElement) {
        // Store original styles
        this.storeOriginalEdgeStyles(edge.id, edgeElement);
        
        // Apply highlight styles
        this.applyEdgeHighlightStyles(edgeElement);
      }
    });
  }

  /**
   * Apply dimming effect to a node
   * @param nodeId - ID of the node to dim
   */
  private applyNodeDimming(nodeId: string): void {
    const nodeElement = this.getNodeElement(nodeId);
    if (nodeElement) {
      // Store original styles if not already stored
      if (!this.originalStyles.has(`node-${nodeId}`)) {
        this.storeOriginalNodeStyles(nodeId, nodeElement);
      }
      
      // Apply dimming
      nodeElement.style.opacity = this.config.dimmedOpacity.toString();
      nodeElement.style.transition = `opacity ${this.config.transitionDuration}ms ease`;
    }
  }

  /**
   * Apply dimming effect to an edge
   * @param edgeId - ID of the edge to dim
   */
  private applyEdgeDimming(edgeId: string): void {
    const edgeElement = this.getEdgeElement(edgeId);
    if (edgeElement) {
      // Store original styles if not already stored
      if (!this.originalStyles.has(`edge-${edgeId}`)) {
        this.storeOriginalEdgeStyles(edgeId, edgeElement);
      }
      
      // Apply dimming
      edgeElement.style.opacity = this.config.dimmedOpacity.toString();
      edgeElement.style.transition = `opacity ${this.config.transitionDuration}ms ease`;
    }
  }

  /**
   * Apply highlight styles to a node element
   * @param nodeElement - DOM element of the node
   */
  private applyNodeHighlightStyles(nodeElement: HTMLElement): void {
    nodeElement.style.outline = `3px solid ${this.config.highlightColor}`;
    nodeElement.style.outlineOffset = '2px';
    nodeElement.style.zIndex = this.config.highlightZIndex.toString();
    nodeElement.style.transition = `outline ${this.config.transitionDuration}ms ease, z-index ${this.config.transitionDuration}ms ease`;
    nodeElement.style.opacity = '1'; // Ensure highlighted nodes are fully visible
  }

  /**
   * Apply highlight styles to an edge element
   * @param edgeElement - DOM element of the edge
   */
  private applyEdgeHighlightStyles(edgeElement: HTMLElement): void {
    const pathElement = edgeElement.querySelector('path');
    if (pathElement) {
      pathElement.style.stroke = this.config.edgeHighlightColor;
      pathElement.style.strokeWidth = this.config.highlightedEdgeWidth.toString();
      pathElement.style.transition = `stroke ${this.config.transitionDuration}ms ease, stroke-width ${this.config.transitionDuration}ms ease`;
    }
    edgeElement.style.zIndex = this.config.highlightZIndex.toString();
    edgeElement.style.opacity = '1'; // Ensure highlighted edges are fully visible
  }

  /**
   * Clear node highlighting styles
   */
  private clearNodeHighlighting(): void {
    this.highlightedNodeIds.forEach(nodeId => {
      const nodeElement = this.getNodeElement(nodeId);
      if (nodeElement) {
        this.restoreOriginalNodeStyles(nodeId, nodeElement);
      }
    });

    // Also restore dimmed nodes
    if (this.reactFlowInstance) {
      const allNodes = this.reactFlowInstance.getNodes();
      allNodes.forEach(node => {
        if (!this.highlightedNodeIds.has(node.id)) {
          const nodeElement = this.getNodeElement(node.id);
          if (nodeElement) {
            this.restoreOriginalNodeStyles(node.id, nodeElement);
          }
        }
      });
    }
  }

  /**
   * Clear edge highlighting styles
   */
  private clearEdgeHighlighting(): void {
    this.highlightedEdgeIds.forEach(edgeId => {
      const edgeElement = this.getEdgeElement(edgeId);
      if (edgeElement) {
        this.restoreOriginalEdgeStyles(edgeId, edgeElement);
      }
    });

    // Also restore dimmed edges
    if (this.reactFlowInstance) {
      const allEdges = this.reactFlowInstance.getEdges();
      allEdges.forEach(edge => {
        if (!this.highlightedEdgeIds.has(edge.id)) {
          const edgeElement = this.getEdgeElement(edge.id);
          if (edgeElement) {
            this.restoreOriginalEdgeStyles(edge.id, edgeElement);
          }
        }
      });
    }
  }

  /**
   * Get DOM element for a node
   * @param nodeId - ID of the node
   * @returns DOM element or null
   */
  private getNodeElement(nodeId: string): HTMLElement | null {
    return document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement;
  }

  /**
   * Get DOM element for an edge
   * @param edgeId - ID of the edge
   * @returns DOM element or null
   */
  private getEdgeElement(edgeId: string): HTMLElement | null {
    return document.querySelector(`[data-testid="rf__edge-${edgeId}"]`) as HTMLElement;
  }

  /**
   * Store original styles for a node
   * @param nodeId - ID of the node
   * @param nodeElement - DOM element of the node
   */
  private storeOriginalNodeStyles(nodeId: string, nodeElement: HTMLElement): void {
    const key = `node-${nodeId}`;
    if (!this.originalStyles.has(key)) {
      this.originalStyles.set(key, {
        outline: nodeElement.style.outline,
        outlineOffset: nodeElement.style.outlineOffset,
        zIndex: nodeElement.style.zIndex,
        opacity: nodeElement.style.opacity,
        transition: nodeElement.style.transition
      });
    }
  }

  /**
   * Store original styles for an edge
   * @param edgeId - ID of the edge
   * @param edgeElement - DOM element of the edge
   */
  private storeOriginalEdgeStyles(edgeId: string, edgeElement: HTMLElement): void {
    const key = `edge-${edgeId}`;
    if (!this.originalStyles.has(key)) {
      const pathElement = edgeElement.querySelector('path');
      this.originalStyles.set(key, {
        stroke: pathElement?.style.stroke || '',
        strokeWidth: pathElement?.style.strokeWidth || '',
        zIndex: edgeElement.style.zIndex,
        opacity: edgeElement.style.opacity,
        transition: edgeElement.style.transition,
        pathTransition: pathElement?.style.transition || ''
      });
    }
  }

  /**
   * Restore original styles for a node
   * @param nodeId - ID of the node
   * @param nodeElement - DOM element of the node
   */
  private restoreOriginalNodeStyles(nodeId: string, nodeElement: HTMLElement): void {
    const key = `node-${nodeId}`;
    const originalStyles = this.originalStyles.get(key);
    
    if (originalStyles) {
      nodeElement.style.outline = originalStyles.outline || '';
      nodeElement.style.outlineOffset = originalStyles.outlineOffset || '';
      nodeElement.style.zIndex = originalStyles.zIndex || '';
      nodeElement.style.opacity = originalStyles.opacity || '';
      nodeElement.style.transition = originalStyles.transition || '';
    } else {
      // Fallback to clearing styles
      nodeElement.style.outline = '';
      nodeElement.style.outlineOffset = '';
      nodeElement.style.zIndex = '';
      nodeElement.style.opacity = '';
      nodeElement.style.transition = '';
    }
  }

  /**
   * Restore original styles for an edge
   * @param edgeId - ID of the edge
   * @param edgeElement - DOM element of the edge
   */
  private restoreOriginalEdgeStyles(edgeId: string, edgeElement: HTMLElement): void {
    const key = `edge-${edgeId}`;
    const originalStyles = this.originalStyles.get(key);
    const pathElement = edgeElement.querySelector('path');
    
    if (originalStyles) {
      if (pathElement) {
        pathElement.style.stroke = originalStyles.stroke || '';
        pathElement.style.strokeWidth = originalStyles.strokeWidth || '';
        pathElement.style.transition = originalStyles.pathTransition || '';
      }
      edgeElement.style.zIndex = originalStyles.zIndex || '';
      edgeElement.style.opacity = originalStyles.opacity || '';
      edgeElement.style.transition = originalStyles.transition || '';
    } else {
      // Fallback to clearing styles
      if (pathElement) {
        pathElement.style.stroke = '';
        pathElement.style.strokeWidth = '';
        pathElement.style.transition = '';
      }
      edgeElement.style.zIndex = '';
      edgeElement.style.opacity = '';
      edgeElement.style.transition = '';
    }
  }

  /**
   * Check if highlighting is currently active
   * @returns Whether highlighting is active
   */
  isHighlighting(): boolean {
    return this.isHighlightingActive;
  }

  /**
   * Get currently highlighted node IDs
   * @returns Set of highlighted node IDs
   */
  getHighlightedNodeIds(): Set<string> {
    return new Set(this.highlightedNodeIds);
  }

  /**
   * Get currently highlighted edge IDs
   * @returns Set of highlighted edge IDs
   */
  getHighlightedEdgeIds(): Set<string> {
    return new Set(this.highlightedEdgeIds);
  }

  /**
   * Update configuration
   * @param newConfig - Partial configuration to update
   */
  updateConfig(newConfig: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): VisualizationConfig {
    return { ...this.config };
  }
}

/**
 * Default visualization controller instance
 */
export const visualizationController = new VisualizationController();