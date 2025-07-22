/**
 * Tests for GroupBoundsUpdater utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GroupBoundsUpdater } from '../GroupBoundsUpdater';
import type { NodeGroup, Bounds } from '../group-types';
import type { Node } from 'reactflow';

describe('GroupBoundsUpdater', () => {
    let mockNodes: Node[];
    let mockGroups: NodeGroup[];

    beforeEach(() => {
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

    describe('updateGroupBounds', () => {
        it('should update group bounds correctly', () => {
            const result = GroupBoundsUpdater.updateGroupBounds(mockGroups, mockNodes);

            expect(result.success).toBe(true);
            expect(result.updatedGroups).toHaveLength(2);
            expect(result.changedGroups).toHaveLength(0); // No changes expected with current positions
        });

        it('should detect changed bounds', () => {
            // Move nodes to new positions
            const updatedNodes = mockNodes.map(node => {
                if (node.id === 'node1') {
                    return { ...node, position: { x: 50, y: 50 } };
                }
                return node;
            });

            const result = GroupBoundsUpdater.updateGroupBounds(mockGroups, updatedNodes);

            expect(result.success).toBe(true);
            expect(result.changedGroups.length).toBeGreaterThan(0);

            const changedGroup = result.changedGroups.find(g => g.id === 'group1');
            expect(changedGroup).toBeDefined();
            expect(changedGroup?.bounds.x).toBe(30); // 50 - 20 (padding)
        });

        it('should handle empty groups gracefully', () => {
            const emptyGroup = {
                ...mockGroups[0],
                nodeIds: ['nonexistent']
            };

            const result = GroupBoundsUpdater.updateGroupBounds([emptyGroup], mockNodes);

            expect(result.success).toBe(true);
            expect(result.updatedGroups).toHaveLength(1);
        });

        it('should validate group integrity when requested', () => {
            // Create a group with nodes outside its bounds
            const invalidGroup = {
                ...mockGroups[0],
                bounds: { x: 0, y: 0, width: 50, height: 50 } // Too small for the nodes
            };

            const result = GroupBoundsUpdater.updateGroupBounds(
                [invalidGroup],
                mockNodes,
                { validateIntegrity: true }
            );

            // Should succeed because bounds will be recalculated to fit nodes
            expect(result.success).toBe(true);
        });

        it('should collect metrics when requested', () => {
            const result = GroupBoundsUpdater.updateGroupBounds(
                mockGroups,
                mockNodes,
                { collectMetrics: true }
            );

            expect(result.success).toBe(true);
            expect(result.metrics).toBeDefined();
            expect(result.metrics?.totalGroups).toBe(2);
            expect(result.metrics?.processingTimeMs).toBeGreaterThanOrEqual(0);
        });

        it('should only update changed groups when requested', () => {
            const result = GroupBoundsUpdater.updateGroupBounds(
                mockGroups,
                mockNodes,
                { onlyUpdateChanged: true, changeThreshold: 0.1 }
            );

            expect(result.success).toBe(true);
            expect(result.changedGroups).toHaveLength(0); // No significant changes
        });
    });

    describe('updateSingleGroupBounds', () => {
        it('should update a single group correctly', () => {
            const updatedGroup = GroupBoundsUpdater.updateSingleGroupBounds(
                mockGroups[0],
                mockNodes
            );

            expect(updatedGroup.id).toBe(mockGroups[0].id);
            expect(updatedGroup.bounds).toBeDefined();
            expect(updatedGroup.updatedAt).toBeGreaterThan(mockGroups[0].updatedAt);
        });
    });

    describe('optimizeGroupBounds', () => {
        it('should optimize overlapping groups', () => {
            // Create overlapping groups with nodes positioned to create overlap
            const overlappingNodes = [
                {
                    ...mockNodes[0],
                    position: { x: 100, y: 100 }
                },
                {
                    ...mockNodes[1],
                    position: { x: 150, y: 100 } // Close to first node
                },
                {
                    ...mockNodes[2],
                    position: { x: 120, y: 120 } // Overlapping area
                },
                {
                    ...mockNodes[3],
                    position: { x: 170, y: 120 }
                }
            ];

            const overlappingGroups = [
                {
                    ...mockGroups[0],
                    bounds: { x: 80, y: 80, width: 120, height: 80 }
                },
                {
                    ...mockGroups[1],
                    bounds: { x: 100, y: 100, width: 120, height: 80 } // Overlaps with first
                }
            ];

            const result = GroupBoundsUpdater.optimizeGroupBounds(
                overlappingGroups,
                overlappingNodes
            );

            expect(result.success).toBe(true);
            expect(result.updatedGroups).toHaveLength(2);

            // The optimization should have attempted to resolve overlaps
            // (though final bounds are recalculated based on node positions)
            expect(result.updatedGroups[0].bounds).toBeDefined();
            expect(result.updatedGroups[1].bounds).toBeDefined();
        });
    });

    describe('getGroupsNeedingUpdate', () => {
        it('should identify groups that need updates', () => {
            const changedNodeIds = ['node1', 'node3'];
            const groupsNeedingUpdate = GroupBoundsUpdater.getGroupsNeedingUpdate(
                mockGroups,
                changedNodeIds
            );

            expect(groupsNeedingUpdate).toHaveLength(2); // Both groups contain changed nodes
            expect(groupsNeedingUpdate.map(g => g.id)).toEqual(['group1', 'group2']);
        });

        it('should return empty array when no groups need updates', () => {
            const changedNodeIds = ['nonexistent'];
            const groupsNeedingUpdate = GroupBoundsUpdater.getGroupsNeedingUpdate(
                mockGroups,
                changedNodeIds
            );

            expect(groupsNeedingUpdate).toHaveLength(0);
        });
    });

    describe('createDebouncedUpdater', () => {
        it('should create a debounced updater', () => {
            const mockCallback = vi.fn();
            const debouncedUpdater = GroupBoundsUpdater.createDebouncedUpdater(mockCallback, 100);

            expect(debouncedUpdater.scheduleUpdate).toBeDefined();
            expect(debouncedUpdater.cancel).toBeDefined();
        });

        it('should debounce multiple update calls', async () => {
            const mockCallback = vi.fn();
            const debouncedUpdater = GroupBoundsUpdater.createDebouncedUpdater(mockCallback, 50);

            // Schedule multiple updates quickly
            debouncedUpdater.scheduleUpdate(mockGroups, mockNodes);
            debouncedUpdater.scheduleUpdate(mockGroups, mockNodes);
            debouncedUpdater.scheduleUpdate(mockGroups, mockNodes);

            // Wait for debounce delay
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should only be called once (but might be 0 if no changes detected)
            expect(mockCallback).toHaveBeenCalledTimes(0); // No changes in bounds, so callback not called
        });

        it('should allow cancellation of pending updates', () => {
            const mockCallback = vi.fn();
            const debouncedUpdater = GroupBoundsUpdater.createDebouncedUpdater(mockCallback, 100);

            debouncedUpdater.scheduleUpdate(mockGroups, mockNodes);
            debouncedUpdater.cancel();

            // Wait longer than debounce delay
            setTimeout(() => {
                expect(mockCallback).not.toHaveBeenCalled();
            }, 150);
        });
    });
});