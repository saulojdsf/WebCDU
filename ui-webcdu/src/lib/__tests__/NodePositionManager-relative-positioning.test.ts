import { describe, it, expect, beforeEach } from 'vitest';
import { NodePositionManager } from '../NodePositionManager';
import { GridConfiguration } from '../grid-types';

describe('NodePositionManager - Relative Positioning', () => {
    let positionManager: NodePositionManager;
    const gridConfig: GridConfiguration = {
        size: 20,
        enabled: true,
        showOverlay: true,
        snapThreshold: 10,
    };

    beforeEach(() => {
        positionManager = new NodePositionManager(gridConfig);
    });

    describe('calculateCentroid', () => {
        it('should calculate centroid of single node', () => {
            const nodes = [{ position: { x: 10, y: 20 } }];
            // Access private method through any cast for testing
            const centroid = (positionManager as any).calculateCentroid(nodes);

            expect(centroid).toEqual({ x: 10, y: 20 });
        });

        it('should calculate centroid of multiple nodes', () => {
            const nodes = [
                { position: { x: 0, y: 0 } },
                { position: { x: 20, y: 20 } },
                { position: { x: 40, y: 40 } },
            ];
            const centroid = (positionManager as any).calculateCentroid(nodes);

            expect(centroid).toEqual({ x: 20, y: 20 });
        });

        it('should handle empty array', () => {
            const nodes: Array<{ position: { x: number; y: number } }> = [];
            const centroid = (positionManager as any).calculateCentroid(nodes);

            expect(centroid).toEqual({ x: 0, y: 0 });
        });

        it('should calculate centroid with negative coordinates', () => {
            const nodes = [
                { position: { x: -10, y: -20 } },
                { position: { x: 10, y: 20 } },
            ];
            const centroid = (positionManager as any).calculateCentroid(nodes);

            expect(centroid).toEqual({ x: 0, y: 0 });
        });

        it('should handle decimal coordinates', () => {
            const nodes = [
                { position: { x: 1.5, y: 2.5 } },
                { position: { x: 3.5, y: 4.5 } },
            ];
            const centroid = (positionManager as any).calculateCentroid(nodes);

            expect(centroid).toEqual({ x: 2.5, y: 3.5 });
        });
    });

    describe('snapNodesWithRelativePositioning', () => {
        it('should snap single node to grid', () => {
            const nodes = [
                { id: '1', position: { x: 15, y: 25 } },
            ];

            const result = positionManager.snapNodesWithRelativePositioning(nodes);

            expect(result).toEqual([
                { id: '1', position: { x: 20, y: 20 } },
            ]);
        });

        it('should preserve relative positioning for multiple nodes', () => {
            const nodes = [
                { id: '1', position: { x: 10, y: 10 } },
                { id: '2', position: { x: 30, y: 30 } },
                { id: '3', position: { x: 50, y: 50 } },
            ];

            const result = positionManager.snapNodesWithRelativePositioning(nodes);

            // Centroid is (30, 30), which snaps to (40, 40)
            // Offset is (10, 10), so all nodes move by that amount
            expect(result).toEqual([
                { id: '1', position: { x: 20, y: 20 } },
                { id: '2', position: { x: 40, y: 40 } },
                { id: '3', position: { x: 60, y: 60 } },
            ]);
        });

        it('should maintain exact relative distances', () => {
            const nodes = [
                { id: '1', position: { x: 5, y: 5 } },
                { id: '2', position: { x: 15, y: 25 } },
            ];

            const result = positionManager.snapNodesWithRelativePositioning(nodes);

            // Calculate original distance
            const originalDistance = Math.sqrt(
                Math.pow(15 - 5, 2) + Math.pow(25 - 5, 2)
            );

            // Calculate new distance
            const newDistance = Math.sqrt(
                Math.pow(result[1].position.x - result[0].position.x, 2) +
                Math.pow(result[1].position.y - result[0].position.y, 2)
            );

            expect(newDistance).toBeCloseTo(originalDistance, 5);
        });

        it('should handle nodes with same position', () => {
            const nodes = [
                { id: '1', position: { x: 15, y: 25 } },
                { id: '2', position: { x: 15, y: 25 } },
            ];

            const result = positionManager.snapNodesWithRelativePositioning(nodes);

            expect(result).toEqual([
                { id: '1', position: { x: 20, y: 20 } },
                { id: '2', position: { x: 20, y: 20 } },
            ]);
        });

        it('should return original nodes when grid snapping is disabled', () => {
            positionManager.updateConfig({ ...gridConfig, enabled: false });

            const nodes = [
                { id: '1', position: { x: 15, y: 25 } },
                { id: '2', position: { x: 35, y: 45 } },
            ];

            const result = positionManager.snapNodesWithRelativePositioning(nodes);

            expect(result).toEqual(nodes);
        });

        it('should handle empty array', () => {
            const nodes: Array<{ id: string; position: { x: number; y: number } }> = [];

            const result = positionManager.snapNodesWithRelativePositioning(nodes);

            expect(result).toEqual([]);
        });

        it('should work with different grid sizes', () => {
            positionManager.updateConfig({ ...gridConfig, size: 50 });

            const nodes = [
                { id: '1', position: { x: 20, y: 20 } },
                { id: '2', position: { x: 40, y: 60 } },
            ];

            const result = positionManager.snapNodesWithRelativePositioning(nodes);

            // Centroid is (30, 40), which snaps to (50, 50) with grid size 50
            // Offset is (20, 10)
            expect(result).toEqual([
                { id: '1', position: { x: 40, y: 30 } },
                { id: '2', position: { x: 60, y: 70 } },
            ]);
        });

        it('should preserve node properties other than position', () => {
            const nodes = [
                {
                    id: '1',
                    position: { x: 15, y: 25 },
                    customProp: 'value1',
                },
                {
                    id: '2',
                    position: { x: 35, y: 45 },
                    customProp: 'value2',
                },
            ];

            const result = positionManager.snapNodesWithRelativePositioning(nodes);

            expect(result[0]).toHaveProperty('customProp', 'value1');
            expect(result[1]).toHaveProperty('customProp', 'value2');
            expect(result[0].id).toBe('1');
            expect(result[1].id).toBe('2');
        });
    });

    describe('groupNodesByRelationships', () => {
        it('should return each node as its own group by default', () => {
            const nodes = [
                { id: '1', position: { x: 10, y: 10 } },
                { id: '2', position: { x: 20, y: 20 } },
                { id: '3', position: { x: 30, y: 30 } },
            ];

            const result = positionManager.groupNodesByRelationships(nodes);

            expect(result).toEqual([
                [{ id: '1', position: { x: 10, y: 10 } }],
                [{ id: '2', position: { x: 20, y: 20 } }],
                [{ id: '3', position: { x: 30, y: 30 } }],
            ]);
        });

        it('should handle empty array', () => {
            const nodes: Array<{ id: string; position: { x: number; y: number } }> = [];

            const result = positionManager.groupNodesByRelationships(nodes);

            expect(result).toEqual([]);
        });

        it('should accept connections parameter', () => {
            const nodes = [
                { id: '1', position: { x: 10, y: 10 } },
                { id: '2', position: { x: 20, y: 20 } },
            ];
            const connections = [{ source: '1', target: '2' }];

            const result = positionManager.groupNodesByRelationships(nodes, connections);

            // For now, still returns individual groups (simplified implementation)
            expect(result).toEqual([
                [{ id: '1', position: { x: 10, y: 10 } }],
                [{ id: '2', position: { x: 20, y: 20 } }],
            ]);
        });
    });

    describe('snapNodesPreservingGroupings', () => {
        it('should snap nodes while preserving groupings', () => {
            const nodes = [
                { id: '1', position: { x: 15, y: 25 } },
                { id: '2', position: { x: 35, y: 45 } },
            ];
            const connections = [{ source: '1', target: '2' }];

            const result = positionManager.snapNodesPreservingGroupings(nodes, connections);

            // Since grouping is simplified, this behaves like individual snapping for now
            expect(result).toEqual([
                { id: '1', position: { x: 20, y: 20 } },
                { id: '2', position: { x: 40, y: 40 } },
            ]);
        });

        it('should return original nodes when grid snapping is disabled', () => {
            positionManager.updateConfig({ ...gridConfig, enabled: false });

            const nodes = [
                { id: '1', position: { x: 15, y: 25 } },
                { id: '2', position: { x: 35, y: 45 } },
            ];

            const result = positionManager.snapNodesPreservingGroupings(nodes);

            expect(result).toEqual(nodes);
        });

        it('should handle empty array', () => {
            const nodes: Array<{ id: string; position: { x: number; y: number } }> = [];

            const result = positionManager.snapNodesPreservingGroupings(nodes);

            expect(result).toEqual([]);
        });
    });
});