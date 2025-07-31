import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GridSnapController } from '../GridSnapController';
import type { Node } from 'reactflow';

describe('GridSnapController - Bulk Node Snapping', () => {
    let controller: GridSnapController;
    let mockSetNodes: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        controller = new GridSnapController({ size: 20, enabled: true });
        mockSetNodes = vi.fn();
    });

    describe('snapExistingNodes', () => {
        it('should return a function that snaps all nodes to grid', () => {
            const snapFunction = controller.snapExistingNodes();
            expect(typeof snapFunction).toBe('function');
        });

        it('should snap nodes to nearest grid positions', () => {
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

            const snapFunction = controller.snapExistingNodes();
            snapFunction(nodes, mockSetNodes);

            expect(mockSetNodes).toHaveBeenCalledWith([
                {
                    id: '1',
                    type: 'default',
                    position: { x: 20, y: 20 }, // Snapped to nearest grid (20x20)
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 40, y: 40 }, // Snapped to nearest grid (40x40)
                    data: {},
                },
            ]);
        });

        it('should handle empty node array', () => {
            const nodes: Node[] = [];
            const snapFunction = controller.snapExistingNodes();

            snapFunction(nodes, mockSetNodes);

            expect(mockSetNodes).toHaveBeenCalledWith([]);
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
                        nested: { prop: 'value' }
                    },
                    selected: true,
                    dragging: false,
                    style: { backgroundColor: 'red' },
                    className: 'custom-class',
                },
            ];

            const snapFunction = controller.snapExistingNodes();
            snapFunction(nodes, mockSetNodes);

            const expectedNode = {
                ...nodes[0],
                position: { x: 20, y: 20 }, // Only position should change
            };

            expect(mockSetNodes).toHaveBeenCalledWith([expectedNode]);
        });

        it('should work with different grid sizes', () => {
            controller.updateConfig({ size: 50 });

            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 30, y: 70 },
                    data: {},
                },
            ];

            const snapFunction = controller.snapExistingNodes();
            snapFunction(nodes, mockSetNodes);

            expect(mockSetNodes).toHaveBeenCalledWith([
                {
                    id: '1',
                    type: 'default',
                    position: { x: 50, y: 50 }, // Snapped to 50x50 grid
                    data: {},
                },
            ]);
        });

        it('should handle nodes already on grid positions', () => {
            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 40, y: 60 }, // Already on grid
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 35, y: 45 }, // Needs snapping
                    data: {},
                },
            ];

            const snapFunction = controller.snapExistingNodes();
            snapFunction(nodes, mockSetNodes);

            expect(mockSetNodes).toHaveBeenCalledWith([
                {
                    id: '1',
                    type: 'default',
                    position: { x: 40, y: 60 }, // Should remain the same
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 40, y: 40 }, // Should be snapped
                    data: {},
                },
            ]);
        });

        it('should handle negative positions correctly', () => {
            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: -15, y: -25 },
                    data: {},
                },
            ];

            const snapFunction = controller.snapExistingNodes();
            snapFunction(nodes, mockSetNodes);

            expect(mockSetNodes).toHaveBeenCalledWith([
                {
                    id: '1',
                    type: 'default',
                    position: { x: -20, y: -20 }, // Snapped to negative grid positions
                    data: {},
                },
            ]);
        });

        it('should not snap nodes when grid snapping is disabled', () => {
            controller.disableGridSnap();

            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 25 },
                    data: {},
                },
            ];

            // Mock console.warn to verify warning is shown
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            const snapFunction = controller.snapExistingNodes();
            snapFunction(nodes, mockSetNodes);

            expect(consoleSpy).toHaveBeenCalledWith('Grid snapping is not enabled');
            expect(mockSetNodes).not.toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        it('should handle large numbers of nodes efficiently', () => {
            const nodes: Node[] = Array.from({ length: 1000 }, (_, i) => ({
                id: `node-${i}`,
                type: 'default',
                position: { x: i * 1.5, y: i * 2.3 },
                data: {},
            }));

            const snapFunction = controller.snapExistingNodes();

            // Should not throw and should complete in reasonable time
            expect(() => snapFunction(nodes, mockSetNodes)).not.toThrow();
            expect(mockSetNodes).toHaveBeenCalledTimes(1);

            const snappedNodes = mockSetNodes.mock.calls[0][0];
            expect(snappedNodes).toHaveLength(1000);

            // Verify first and last nodes are properly snapped
            expect(snappedNodes[0].position.x % 20).toBe(0);
            expect(snappedNodes[0].position.y % 20).toBe(0);
            expect(snappedNodes[999].position.x % 20).toBe(0);
            expect(snappedNodes[999].position.y % 20).toBe(0);
        });
    });

    describe('integration with position manager', () => {
        it('should use position manager for snapping calculations', () => {
            const positionManager = controller.getPositionManager();
            const snapToGridSpy = vi.spyOn(positionManager, 'snapToGrid');

            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 25 },
                    data: {},
                },
            ];

            const snapFunction = controller.snapExistingNodes();
            snapFunction(nodes, mockSetNodes);

            expect(snapToGridSpy).toHaveBeenCalledWith({ x: 15, y: 25 });

            snapToGridSpy.mockRestore();
        });

        it('should update position manager when config changes', () => {
            const positionManager = controller.getPositionManager();
            const updateConfigSpy = vi.spyOn(positionManager, 'updateConfig');

            controller.updateConfig({ size: 30 });

            expect(updateConfigSpy).toHaveBeenCalledWith(
                expect.objectContaining({ size: 30 })
            );

            updateConfigSpy.mockRestore();
        });
    });
});