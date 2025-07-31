import type { NodePosition, GridConfiguration } from './grid-types';

/**
 * Manages node positioning logic including snap-to-grid calculations
 * and collision detection for grid snapping functionality
 */
export class NodePositionManager {
    private gridConfig: GridConfiguration;

    constructor(gridConfig: GridConfiguration) {
        this.gridConfig = gridConfig;
    }

    /**
     * Update the grid configuration
     */
    updateConfig(config: GridConfiguration): void {
        this.gridConfig = config;
    }

    /**
     * Snap a position to the nearest grid intersection
     * Uses simple rounding to nearest grid intersection: Math.round(position / gridSize) * gridSize
     */
    snapToGrid(position: { x: number; y: number }): NodePosition {
        if (!this.gridConfig.enabled) {
            return {
                x: position.x,
                y: position.y,
                isSnapped: false,
            };
        }

        const gridSize = this.gridConfig.size;
        const snappedX = Math.round(position.x / gridSize) * gridSize;
        const snappedY = Math.round(position.y / gridSize) * gridSize;

        return {
            x: snappedX,
            y: snappedY,
            isSnapped: true,
            gridX: snappedX / gridSize,
            gridY: snappedY / gridSize,
        };
    }

    /**
     * Check if a position should snap to grid based on distance threshold
     */
    shouldSnapToGrid(position: { x: number; y: number }): boolean {
        if (!this.gridConfig.enabled) {
            return false;
        }

        const gridSize = this.gridConfig.size;
        const snapThreshold = this.gridConfig.snapThreshold;

        const nearestGridX = Math.round(position.x / gridSize) * gridSize;
        const nearestGridY = Math.round(position.y / gridSize) * gridSize;

        const distanceX = Math.abs(position.x - nearestGridX);
        const distanceY = Math.abs(position.y - nearestGridY);

        return distanceX <= snapThreshold && distanceY <= snapThreshold;
    }

    /**
     * Calculate the distance from a position to the nearest grid intersection
     */
    getDistanceToGrid(position: { x: number; y: number }): number {
        const gridSize = this.gridConfig.size;
        const nearestGridX = Math.round(position.x / gridSize) * gridSize;
        const nearestGridY = Math.round(position.y / gridSize) * gridSize;

        const distanceX = Math.abs(position.x - nearestGridX);
        const distanceY = Math.abs(position.y - nearestGridY);

        return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    }

    /**
     * Get the grid coordinates for a given position
     */
    getGridCoordinates(position: { x: number; y: number }): { gridX: number; gridY: number } {
        const gridSize = this.gridConfig.size;
        return {
            gridX: Math.round(position.x / gridSize),
            gridY: Math.round(position.y / gridSize),
        };
    }

    /**
     * Convert grid coordinates to pixel position
     */
    gridToPixelPosition(gridX: number, gridY: number): { x: number; y: number } {
        const gridSize = this.gridConfig.size;
        return {
            x: gridX * gridSize,
            y: gridY * gridSize,
        };
    }

    /**
     * Check if a position is already aligned to the grid
     */
    isPositionSnapped(position: { x: number; y: number }): boolean {
        const gridSize = this.gridConfig.size;
        const tolerance = 0.1; // Small tolerance for floating point precision

        const remainderX = Math.abs(position.x % gridSize);
        const remainderY = Math.abs(position.y % gridSize);

        return (remainderX < tolerance || remainderX > gridSize - tolerance) &&
            (remainderY < tolerance || remainderY > gridSize - tolerance);
    }

    /**
     * Find available grid position to avoid overlaps (placeholder for collision detection)
     * This will be implemented in subtask 3.2
     */
    findAvailableGridPosition(
        position: { x: number; y: number },
        excludeNodes?: string[]
    ): NodePosition {
        // For now, just return the basic snap-to-grid result
        // Full collision detection will be implemented in task 3.2
        return this.snapToGrid(position);
    }

    /**
     * Move a specific node to grid position (placeholder)
     * This will be implemented when integrating with the node system
     */
    moveNodeToGrid(nodeId: string): NodePosition | null {
        // TODO: Implement when integrating with React Flow nodes
        console.log(`moveNodeToGrid called for node ${nodeId} - implementation pending`);
        return null;
    }

    /**
     * Snap multiple nodes while preserving their relative positioning
     * Uses the centroid of the nodes as reference point for snapping
     */
    snapNodesWithRelativePositioning(
        nodes: Array<{ id: string; position: { x: number; y: number } }>
    ): Array<{ id: string; position: { x: number; y: number } }> {
        if (!this.gridConfig.enabled || nodes.length === 0) {
            return nodes;
        }

        // Calculate the centroid (center point) of all nodes
        const centroid = this.calculateCentroid(nodes);

        // Snap the centroid to the grid
        const snappedCentroid = this.snapToGrid(centroid);

        // Calculate the offset from original centroid to snapped centroid
        const offsetX = snappedCentroid.x - centroid.x;
        const offsetY = snappedCentroid.y - centroid.y;

        // Apply the same offset to all nodes to maintain relative positioning
        return nodes.map(node => ({
            ...node,
            position: {
                x: node.position.x + offsetX,
                y: node.position.y + offsetY,
            },
        }));
    }

    /**
     * Calculate the centroid (geometric center) of a group of nodes
     */
    private calculateCentroid(
        nodes: Array<{ position: { x: number; y: number } }>
    ): { x: number; y: number } {
        if (nodes.length === 0) {
            return { x: 0, y: 0 };
        }

        const sum = nodes.reduce(
            (acc, node) => ({
                x: acc.x + node.position.x,
                y: acc.y + node.position.y,
            }),
            { x: 0, y: 0 }
        );

        return {
            x: sum.x / nodes.length,
            y: sum.y / nodes.length,
        };
    }

    /**
     * Group nodes by their connections and relationships
     * This is a simplified version - in a full implementation, this would
     * analyze actual node connections from React Flow
     */
    groupNodesByRelationships(
        nodes: Array<{ id: string; position: { x: number; y: number } }>,
        connections?: Array<{ source: string; target: string }>
    ): Array<Array<{ id: string; position: { x: number; y: number } }>> {
        // For now, return each node as its own group
        // In a full implementation, this would analyze connections to group related nodes
        return nodes.map(node => [node]);
    }

    /**
     * Snap nodes while preserving groupings and connections
     * Groups related nodes and snaps each group while maintaining internal relationships
     */
    snapNodesPreservingGroupings(
        nodes: Array<{ id: string; position: { x: number; y: number } }>,
        connections?: Array<{ source: string; target: string }>
    ): Array<{ id: string; position: { x: number; y: number } }> {
        if (!this.gridConfig.enabled || nodes.length === 0) {
            return nodes;
        }

        // Group nodes by their relationships
        const nodeGroups = this.groupNodesByRelationships(nodes, connections);

        // Snap each group while preserving internal relative positioning
        const snappedGroups = nodeGroups.map(group =>
            this.snapNodesWithRelativePositioning(group)
        );

        // Flatten the groups back into a single array
        return snappedGroups.flat();
    }

    /**
     * Validate that a grid position is valid and available
     */
    validateGridPosition(position: { x: number; y: number }): boolean {
        // Basic validation - position should be finite numbers
        return Number.isFinite(position.x) && Number.isFinite(position.y);
    }
}