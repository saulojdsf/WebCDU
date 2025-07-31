import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GridSnapController } from '../GridSnapController';
import type { Node } from 'reactflow';

describe('GridSnapController - Relative Positioning', () => {
    let controller: GridSnapController;
    let mockSetNodes: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        controller = new GridSnapController({ size: 20, enabled: true });
        mockSetNodes = vi.fn();
    });

    describe('snapExistingNodesPreservingRelativePositioning', () => {
        it('should return a function that preserves relative positioning', () => {
            const snapFunction = controller.snapExistingNodesPreservingRelativePositioning();
            expect(typeof snapFunction).toBe('function');
        });

        it('should preserve relative positioning when snapping nodes', () => {
            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 10, y: 10 },
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 30, y: 30 },
                    data: {},
                },
                {
                    id: '3',
                    type: 'default',
                    position: { x: 50, y: 50 },
                    data: {},
                },
            ];

            const snapFunction = controller.snapExistingNodesPreservingRelativePositioning();
            snapFunction(nodes, mockSetNodes);

            const snappedNodes = mockSetNodes.mock.calls[0][0];

            // Verify relative distances are preserved
            const originalDistance12 = Math.sqrt(
                Math.pow(30 - 10, 2) + Math.pow(30 - 10, 2)
            );
            const newDistance12 = Math.sqrt(
                Math.pow(snappedNodes[1].position.x - snappedNodes[0].position.x, 2) +
                Math.pow(snappedNodes[1].position.y - snappedNodes[0].position.y, 2)
            );

            expect(newDistance12).toBeCloseTo(originalDistance12, 5);
        });

        it('should snap centroid to grid while maintaining relative positions', () => {
            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 5, y: 5 },
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 15, y: 15 },
                    data: {},
                },
            ];

            const snapFunction = controller.snapExistingNodesPreservingRelativePositioning();
            snapFunction(nodes, mockSetNodes);

            const snappedNodes = mockSetNodes.mock.calls[0][0];

            // Centroid was (10, 10), snapped to (20, 20), offset is (10, 10)
            expect(snappedNodes).toEqual([
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 15 },
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 25, y: 25 },
                    data: {},
                },
            ]);
        });

        it('should preserve all node properties except position', () => {
            const nodes: Node[] = [
                {
                    id: 'complex-node',
                    type: 'custom',
                    position: { x: 15, y: 25 },
                    data: {
                        label: 'Test Node',
                        value: 42,
                    },
                    selected: true,
                    style: { backgroundColor: 'red' },
                },
            ];

            const snapFunction = controller.snapExistingNodesPreservingRelativePositioning();
            snapFunction(nodes, mockSetNodes);

            const snappedNodes = mockSetNodes.mock.calls[0][0];
            const snappedNode = snappedNodes[0];

            expect(snappedNode.id).toBe('complex-node');
            expect(snappedNode.type).toBe('custom');
            expect(snappedNode.data).toEqual({ label: 'Test Node', value: 42 });
            expect(snappedNode.selected).toBe(true);
            expect(snappedNode.style).toEqual({ backgroundColor: 'red' });
            expect(snappedNode.position).toEqual({ x: 20, y: 20 });
        });

        it('should not snap when grid snapping is disabled', () => {
            controller.disableGridSnap();

            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 25 },
                    data: {},
                },
            ];

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const snapFunction = controller.snapExistingNodesPreservingRelativePositioning();
            snapFunction(nodes, mockSetNodes);

            expect(consoleSpy).toHaveBeenCalledWith('Grid snapping is not enabled');
            expect(mockSetNodes).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should handle empty nodes array', () => {
            const nodes: Node[] = [];

            const snapFunction = controller.snapExistingNodesPreservingRelativePositioning();
            snapFunction(nodes, mockSetNodes);

            expect(mockSetNodes).toHaveBeenCalledWith([]);
        });

        it('should handle single node', () => {
            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 25 },
                    data: {},
                },
            ];

            const snapFunction = controller.snapExistingNodesPreservingRelativePositioning();
            snapFunction(nodes, mockSetNodes);

            expect(mockSetNodes).toHaveBeenCalledWith([
                {
                    id: '1',
                    type: 'default',
                    position: { x: 20, y: 20 },
                    data: {},
                },
            ]);
        });
    });

    describe('snapExistingNodesPreservingGroupings', () => {
        it('should return a function that preserves groupings', () => {
            const snapFunction = controller.snapExistingNodesPreservingGroupings();
            expect(typeof snapFunction).toBe('function');
        });

        it('should snap nodes while considering connections', () => {
            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 25 },
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 35, y: 45 },
                    data: {},
                },
            ];
            const edges = [{ source: '1', target: '2' }];

            const snapFunction = controller.snapExistingNodesPreservingGroupings();
            snapFunction(nodes, edges, mockSetNodes);

            expect(mockSetNodes).toHaveBeenCalledWith([
                {
                    id: '1',
                    type: 'default',
                    position: { x: 20, y: 20 },
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 40, y: 40 },
                    data: {},
                },
            ]);
        });

        it('should handle nodes without connections', () => {
            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 25 },
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 35, y: 45 },
                    data: {},
                },
            ];
            const edges: Array<{ source: string; target: string }> = [];

            const snapFunction = controller.snapExistingNodesPreservingGroupings();
            snapFunction(nodes, edges, mockSetNodes);

            expect(mockSetNodes).toHaveBeenCalledWith([
                {
                    id: '1',
                    type: 'default',
                    position: { x: 20, y: 20 },
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 40, y: 40 },
                    data: {},
                },
            ]);
        });

        it('should not snap when grid snapping is disabled', () => {
            controller.disableGridSnap();

            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 25 },
                    data: {},
                },
            ];
            const edges: Array<{ source: string; target: string }> = [];

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const snapFunction = controller.snapExistingNodesPreservingGroupings();
            snapFunction(nodes, edges, mockSetNodes);

            expect(consoleSpy).toHaveBeenCalledWith('Grid snapping is not enabled');
            expect(mockSetNodes).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should handle empty arrays', () => {
            const nodes: Node[] = [];
            const edges: Array<{ source: string; target: string }> = [];

            const snapFunction = controller.snapExistingNodesPreservingGroupings();
            snapFunction(nodes, edges, mockSetNodes);

            expect(mockSetNodes).toHaveBeenCalledWith([]);
        });

        it('should preserve all node properties', () => {
            const nodes: Node[] = [
                {
                    id: 'test-node',
                    type: 'custom',
                    position: { x: 15, y: 25 },
                    data: { label: 'Test' },
                    selected: false,
                },
            ];
            const edges = [{ source: 'test-node', target: 'other-node' }];

            const snapFunction = controller.snapExistingNodesPreservingGroupings();
            snapFunction(nodes, edges, mockSetNodes);

            const snappedNodes = mockSetNodes.mock.calls[0][0];
            expect(snappedNodes[0]).toEqual({
                id: 'test-node',
                type: 'custom',
                position: { x: 20, y: 20 },
                data: { label: 'Test' },
                selected: false,
            });
        });
    });

    describe('integration with position manager', () => {
        it('should use position manager for relative positioning calculations', () => {
            const positionManager = controller.getPositionManager();
            const snapSpy = vi.spyOn(positionManager, 'snapNodesWithRelativePositioning');

            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 25 },
                    data: {},
                },
            ];

            const snapFunction = controller.snapExistingNodesPreservingRelativePositioning();
            snapFunction(nodes, mockSetNodes);

            expect(snapSpy).toHaveBeenCalledWith([
                { id: '1', position: { x: 15, y: 25 } }
            ]);

            snapSpy.mockRestore();
        });

        it('should use position manager for grouping calculations', () => {
            const positionManager = controller.getPositionManager();
            const snapSpy = vi.spyOn(positionManager, 'snapNodesPreservingGroupings');

            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 25 },
                    data: {},
                },
            ];
            const edges = [{ source: '1', target: '2' }];

            const snapFunction = controller.snapExistingNodesPreservingGroupings();
            snapFunction(nodes, edges, mockSetNodes);

            expect(snapSpy).toHaveBeenCalledWith(
                [{ id: '1', position: { x: 15, y: 25 } }],
                edges
            );

            snapSpy.mockRestore();
        });
    });
});