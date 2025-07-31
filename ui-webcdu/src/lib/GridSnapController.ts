import type { GridConfiguration } from './grid-types';
import { DEFAULT_GRID_CONFIG } from './grid-types';
import { NodePositionManager } from './NodePositionManager';
import type { Node } from 'reactflow';

/**
 * Central controller for grid snapping functionality
 * Manages grid snapping state and coordinates between UI components
 */
export class GridSnapController {
    private config: GridConfiguration;
    private listeners: Set<(config: GridConfiguration) => void> = new Set();
    private positionManager: NodePositionManager;

    constructor(initialConfig?: Partial<GridConfiguration>) {
        this.config = { ...DEFAULT_GRID_CONFIG, ...initialConfig };
        this.positionManager = new NodePositionManager(this.config);
    }

    /**
     * Toggle grid snapping on/off
     */
    toggleGridSnap(): void {
        this.config = {
            ...this.config,
            enabled: !this.config.enabled,
            showOverlay: !this.config.enabled, // Show overlay when enabled
        };
        this.positionManager.updateConfig(this.config);
        this.notifyListeners();
    }

    /**
     * Enable grid snapping
     */
    enableGridSnap(): void {
        if (!this.config.enabled) {
            this.config = {
                ...this.config,
                enabled: true,
                showOverlay: true,
            };
            this.positionManager.updateConfig(this.config);
            this.notifyListeners();
        }
    }

    /**
     * Disable grid snapping
     */
    disableGridSnap(): void {
        if (this.config.enabled) {
            this.config = {
                ...this.config,
                enabled: false,
                showOverlay: false,
            };
            this.positionManager.updateConfig(this.config);
            this.notifyListeners();
        }
    }

    /**
     * Check if grid snapping is currently enabled
     */
    isGridSnapEnabled(): boolean {
        return this.config.enabled;
    }

    /**
     * Get current grid size
     */
    getGridSize(): number {
        return this.config.size;
    }

    /**
     * Get current grid configuration
     */
    getConfig(): GridConfiguration {
        return { ...this.config };
    }

    /**
     * Update grid configuration
     */
    updateConfig(updates: Partial<GridConfiguration>): void {
        this.config = { ...this.config, ...updates };
        this.positionManager.updateConfig(this.config);
        this.notifyListeners();
    }

    /**
     * Subscribe to configuration changes
     */
    subscribe(listener: (config: GridConfiguration) => void): () => void {
        this.listeners.add(listener);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notify all listeners of configuration changes
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.config));
    }

    /**
     * Snap existing nodes to grid positions
     * Returns a function that can be called with nodes and setNodes to perform the snapping
     */
    snapExistingNodes(): (nodes: Node[], setNodes: (nodes: Node[]) => void) => void {
        return (nodes: Node[], setNodes: (nodes: Node[]) => void) => {
            if (!this.config.enabled) {
                console.warn('Grid snapping is not enabled');
                return;
            }

            const updatedNodes = nodes.map(node => {
                const currentPosition = { x: node.position.x, y: node.position.y };
                const snappedPosition = this.positionManager.snapToGrid(currentPosition);

                return {
                    ...node,
                    position: {
                        x: snappedPosition.x,
                        y: snappedPosition.y,
                    },
                };
            });

            setNodes(updatedNodes);
        };
    }

    /**
     * Snap existing nodes to grid while preserving relative positioning
     * Returns a function that can be called with nodes and setNodes to perform the snapping
     */
    snapExistingNodesPreservingRelativePositioning(): (nodes: Node[], setNodes: (nodes: Node[]) => void) => void {
        return (nodes: Node[], setNodes: (nodes: Node[]) => void) => {
            if (!this.config.enabled) {
                console.warn('Grid snapping is not enabled');
                return;
            }

            // Convert React Flow nodes to simple position objects
            const nodePositions = nodes.map(node => ({
                id: node.id,
                position: { x: node.position.x, y: node.position.y },
            }));

            // Snap nodes while preserving relative positioning
            const snappedPositions = this.positionManager.snapNodesWithRelativePositioning(nodePositions);

            // Create a map for quick lookup of new positions
            const positionMap = new Map(
                snappedPositions.map(node => [node.id, node.position])
            );

            // Update nodes with new positions
            const updatedNodes = nodes.map(node => {
                const newPosition = positionMap.get(node.id);
                return newPosition ? {
                    ...node,
                    position: newPosition,
                } : node;
            });

            setNodes(updatedNodes);
        };
    }

    /**
     * Snap existing nodes while preserving groupings and connections
     * Returns a function that can be called with nodes, edges, and setNodes to perform the snapping
     */
    snapExistingNodesPreservingGroupings(): (
        nodes: Node[],
        edges: Array<{ source: string; target: string }>,
        setNodes: (nodes: Node[]) => void
    ) => void {
        return (nodes: Node[], edges: Array<{ source: string; target: string }>, setNodes: (nodes: Node[]) => void) => {
            if (!this.config.enabled) {
                console.warn('Grid snapping is not enabled');
                return;
            }

            // Convert React Flow nodes to simple position objects
            const nodePositions = nodes.map(node => ({
                id: node.id,
                position: { x: node.position.x, y: node.position.y },
            }));

            // Snap nodes while preserving groupings and connections
            const snappedPositions = this.positionManager.snapNodesPreservingGroupings(nodePositions, edges);

            // Create a map for quick lookup of new positions
            const positionMap = new Map(
                snappedPositions.map(node => [node.id, node.position])
            );

            // Update nodes with new positions
            const updatedNodes = nodes.map(node => {
                const newPosition = positionMap.get(node.id);
                return newPosition ? {
                    ...node,
                    position: newPosition,
                } : node;
            });

            setNodes(updatedNodes);
        };
    }

    /**
     * Get the position manager instance for direct access to positioning logic
     */
    getPositionManager(): NodePositionManager {
        return this.positionManager;
    }
}