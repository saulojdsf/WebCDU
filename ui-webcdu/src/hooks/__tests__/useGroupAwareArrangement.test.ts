/**
 * Tests for useGroupAwareArrangement hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGroupAwareArrangement } from '../useGroupAwareArrangement';
import type { Node, Edge } from 'reactflow';
import type { NodeGroup } from '../../lib/group-types';

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        info: vi.fn(),
        success: vi.fn(),
        error: vi.fn()
    }
}));

describe('useGroupAwareArrangement', () => {
    let mockNodes: Node[];
    let mockEdges: Edge[];
    let mockGroups: NodeGroup[];
    let mockSetNodes: ReturnType<typeof vi.fn>;
    let mockSetGroups: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockSetNodes = vi.fn();
        mockSetGroups = vi.fn();

        // Create mock nodes
        mockNodes = [
            {
                id: 'node1',
                type: 'default',
                position: { x: 100, y: 100 },
                data: { label: 'Node 1' },
                width: 150,
                height: 40
            },
            {
                id: 'node2',
                type: 'default',
                position: { x: 300, y: 100 },
                data: { label: 'Node 2' },
                width: 150,
                height: 40
            },
            {
                id: 'node3',
                type: 'default',
                position: { x: 100, y: 300 },
                data: { label: 'Node 3' },
                width: 150,
                height: 40
            },
            {
                id: 'node4',
                type: 'default',
                position: { x: 300, y: 300 },
                data: { label: 'Node 4' },
                width: 150,
                height: 40
            }
        ];

        // Create mock edges
        mockEdges = [
            {
                id: 'edge1',
                source: 'node1',
                target: 'node2',
                type: 'default'
            },
            {
                id: 'edge2',
                source: 'node3',
                target: 'node4',
                type: 'default'
            }
        ];

        // Create mock groups
        mockGroups = [
            {
                id: 'group1',
                title: 'Group 1',
                nodeIds: ['node1', 'node2'],
                bounds: { x: 80, y: 80, width: 390, height: 80 },
                style: {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderRadius: 8
                },
                zIndex: -1,
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            {
                id: 'group2',
                title: 'Group 2',
                nodeIds: ['node3', 'node4'],
                bounds: { x: 80, y: 280, width: 390, height: 80 },
                style: {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderRadius: 8
                },
                zIndex: -1,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        ];
    });

    it('should initialize with correct props', () => {
        const { result } = renderHook(() => useGroupAwareArrangement({
            nodes: mockNodes,
            edges: mockEdges,
            groups: mockGroups,
            setNodes: mockSetNodes,
            setGroups: mockSetGroups
        }));

        expect(result.current.applyGroupAwareArrangement).toBeDefined();
        expect(result.current.handleGroupAwareArrangement).toBeDefined();
        expect(result.current.applyGroupAwareHierarchicalLayout).toBeDefined();
        expect(result.current.applyGroupAwareGridLayout).toBeDefined();
        expect(result.current.applyGroupAwareCircularLayout).toBeDefined();
    });

    it('should apply hierarchical layout correctly', async () => {
        const { result } = renderHook(() => useGroupAwareArrangement({
            nodes: mockNodes,
            edges: mockEdges,
            groups: mockGroups,
            setNodes: mockSetNodes,
            setGroups: mockSetGroups,
            options: { respectGroups: true, arrangeWithinGroups: true }
        }));

        await act(async () => {
            const arrangementResult = await result.current.applyGroupAwareArrangement('hierarchical');
            expect(arrangementResult.success).toBe(true);
            expect(arrangementResult.nodePositions).toHaveLength(4);
            expect(arrangementResult.updatedGroups).toHaveLength(2);
        });
    });

    it('should apply grid layout correctly', async () => {
        const { result } = renderHook(() => useGroupAwareArrangement({
            nodes: mockNodes,
            edges: mockEdges,
            groups: mockGroups,
            setNodes: mockSetNodes,
            setGroups: mockSetGroups,
            options: { respectGroups: true, arrangeWithinGroups: true }
        }));

        await act(async () => {
            const arrangementResult = await result.current.applyGroupAwareArrangement('grid');
            expect(arrangementResult.success).toBe(true);
            expect(arrangementResult.nodePositions).toHaveLength(4);
            expect(arrangementResult.updatedGroups).toHaveLength(2);
        });
    });

    it('should apply circular layout correctly', async () => {
        const { result } = renderHook(() => useGroupAwareArrangement({
            nodes: mockNodes,
            edges: mockEdges,
            groups: mockGroups,
            setNodes: mockSetNodes,
            setGroups: mockSetGroups,
            options: { respectGroups: true, arrangeWithinGroups: true }
        }));

        await act(async () => {
            const arrangementResult = await result.current.applyGroupAwareArrangement('circular');
            expect(arrangementResult.success).toBe(true);
            expect(arrangementResult.nodePositions).toHaveLength(4);
            expect(arrangementResult.updatedGroups).toHaveLength(2);
        });
    });

    it('should handle ungrouped nodes correctly', async () => {
        // Add an ungrouped node
        const nodesWithUngrouped = [
            ...mockNodes,
            {
                id: 'node5',
                type: 'default',
                position: { x: 500, y: 500 },
                data: { label: 'Node 5' },
                width: 150,
                height: 40
            }
        ];

        const { result } = renderHook(() => useGroupAwareArrangement({
            nodes: nodesWithUngrouped,
            edges: mockEdges,
            groups: mockGroups,
            setNodes: mockSetNodes,
            setGroups: mockSetGroups,
            options: {
                respectGroups: true,
                arrangeWithinGroups: true,
                ungroupedNodeStrategy: 'treat-as-individual-groups'
            }
        }));

        await act(async () => {
            const arrangementResult = await result.current.applyGroupAwareArrangement('hierarchical');
            expect(arrangementResult.success).toBe(true);
            expect(arrangementResult.nodePositions).toHaveLength(5);

            // Check that ungrouped node has a position
            const ungroupedNodePosition = arrangementResult.nodePositions.find(pos => pos.id === 'node5');
            expect(ungroupedNodePosition).toBeDefined();
        });
    });

    it('should handle arrangement with state updates', async () => {
        const { result } = renderHook(() => useGroupAwareArrangement({
            nodes: mockNodes,
            edges: mockEdges,
            groups: mockGroups,
            setNodes: mockSetNodes,
            setGroups: mockSetGroups
        }));

        await act(async () => {
            await result.current.handleGroupAwareArrangement('hierarchical');
        });

        // Verify that setNodes and setGroups were called
        expect(mockSetNodes).toHaveBeenCalled();
        expect(mockSetGroups).toHaveBeenCalled();
    });

    it('should maintain relative positions when arrangeWithinGroups is false', async () => {
        const { result } = renderHook(() => useGroupAwareArrangement({
            nodes: mockNodes,
            edges: mockEdges,
            groups: mockGroups,
            setNodes: mockSetNodes,
            setGroups: mockSetGroups,
            options: {
                respectGroups: true,
                arrangeWithinGroups: false // Don't rearrange within groups
            }
        }));

        await act(async () => {
            const arrangementResult = await result.current.applyGroupAwareArrangement('hierarchical');
            expect(arrangementResult.success).toBe(true);

            // Check that relative positions within groups are maintained
            const node1Pos = arrangementResult.nodePositions.find(pos => pos.id === 'node1');
            const node2Pos = arrangementResult.nodePositions.find(pos => pos.id === 'node2');

            expect(node1Pos).toBeDefined();
            expect(node2Pos).toBeDefined();

            // The relative distance should be maintained (200 pixels apart originally)
            const relativeDistance = Math.abs(node2Pos!.x - node1Pos!.x);
            expect(relativeDistance).toBe(200); // Original distance maintained
        });
    });

    it('should handle errors gracefully', async () => {
        // Create invalid groups to trigger an error
        const invalidGroups = [
            {
                ...mockGroups[0],
                nodeIds: ['nonexistent-node'] // Invalid node ID
            }
        ];

        const { result } = renderHook(() => useGroupAwareArrangement({
            nodes: mockNodes,
            edges: mockEdges,
            groups: invalidGroups,
            setNodes: mockSetNodes,
            setGroups: mockSetGroups
        }));

        await act(async () => {
            const arrangementResult = await result.current.applyGroupAwareArrangement('hierarchical');
            expect(arrangementResult.success).toBe(false);
            expect(arrangementResult.error).toContain('Invalid arrangement groups');
        });
    });
});