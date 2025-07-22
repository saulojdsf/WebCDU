/**
 * Tests for GroupManager arrangement utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GroupManager } from '../GroupManager';
import type { NodeGroup, ArrangementGroup, GroupArrangementOptions } from '../group-types';
import type { Node } from 'reactflow';

describe('GroupManager - Arrangement Utilities', () => {
    let groupManager: GroupManager;
    let mockNodes: Node[];
    let mockGroups: NodeGroup[];

    beforeEach(() => {
        groupManager = new GroupManager();

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

    describe('getGroupsForArrangement', () => {
        it('should convert groups to arrangement groups with default options', () => {
            const arrangementGroups = groupManager.getGroupsForArrangement(mockGroups, mockNodes);

            expect(arrangementGroups).toHaveLength(2);

            const group1 = arrangementGroups.find(g => g.id === 'group1');
            expect(group1).toBeDefined();
            expect(group1?.nodeIds).toEqual(['node1', 'node2']);
            expect(group1?.treatAsUnit).toBe(true);
            expect(group1?.center).toEqual({ x: 275, y: 120 }); // center of bounds
            expect(group1?.priority).toBe(2); // 2 nodes in group
        });

        it('should respect custom options', () => {
            const options: Partial<GroupArrangementOptions> = {
                respectGroups: false
            };

            const arrangementGroups = groupManager.getGroupsForArrangement(mockGroups, mockNodes, options);

            expect(arrangementGroups[0].treatAsUnit).toBe(false);
        });

        it('should calculate correct center points', () => {
            const arrangementGroups = groupManager.getGroupsForArrangement(mockGroups, mockNodes);

            const group1 = arrangementGroups.find(g => g.id === 'group1');
            const group2 = arrangementGroups.find(g => g.id === 'group2');

            expect(group1?.center).toEqual({
                x: 80 + 390 / 2, // x + width/2
                y: 80 + 80 / 2   // y + height/2
            });

            expect(group2?.center).toEqual({
                x: 80 + 390 / 2,
                y: 280 + 80 / 2
            });
        });
    });

    describe('createArrangementGroupsForUngroupedNodes', () => {
        it('should create individual groups for ungrouped nodes', () => {
            const ungroupedNodes = [mockNodes[0], mockNodes[1]]; // node1, node2
            const options: Partial<GroupArrangementOptions> = {
                ungroupedNodeStrategy: 'treat-as-individual-groups'
            };

            const arrangementGroups = groupManager.createArrangementGroupsForUngroupedNodes(ungroupedNodes, options);

            expect(arrangementGroups).toHaveLength(2);
            expect(arrangementGroups[0].id).toBe('temp-group-node1');
            expect(arrangementGroups[0].nodeIds).toEqual(['node1']);
            expect(arrangementGroups[0].treatAsUnit).toBe(false);
        });

        it('should return empty array when strategy is ignore', () => {
            const ungroupedNodes = [mockNodes[0]];
            const options: Partial<GroupArrangementOptions> = {
                ungroupedNodeStrategy: 'ignore'
            };

            const arrangementGroups = groupManager.createArrangementGroupsForUngroupedNodes(ungroupedNodes, options);

            expect(arrangementGroups).toHaveLength(0);
        });

        it('should return empty array when strategy is arrange-freely', () => {
            const ungroupedNodes = [mockNodes[0]];
            const options: Partial<GroupArrangementOptions> = {
                ungroupedNodeStrategy: 'arrange-freely'
            };

            const arrangementGroups = groupManager.createArrangementGroupsForUngroupedNodes(ungroupedNodes, options);

            expect(arrangementGroups).toHaveLength(0);
        });
    });

    describe('updateGroupBoundsAfterArrangement', () => {
        it('should update group bounds based on new node positions', () => {
            // Move nodes to new positions
            const updatedNodes = mockNodes.map(node => {
                if (node.id === 'node1') {
                    return { ...node, position: { x: 50, y: 50 } };
                }
                if (node.id === 'node2') {
                    return { ...node, position: { x: 250, y: 50 } };
                }
                return node;
            });

            const updatedGroups = groupManager.updateGroupBoundsAfterArrangement(mockGroups, updatedNodes);

            const group1 = updatedGroups.find(g => g.id === 'group1');
            expect(group1).toBeDefined();

            // Should have recalculated bounds based on new positions
            expect(group1?.bounds.x).toBe(30); // 50 - 20 (padding)
            expect(group1?.bounds.y).toBe(30); // 50 - 20 (padding)
            expect(group1?.bounds.width).toBe(390); // 250 + 150 - 50 + 40 (padding)
            expect(group1?.bounds.height).toBe(80); // 50 + 40 - 50 + 40 (padding)
        });

        it('should return unchanged group if no nodes found', () => {
            const emptyGroup = {
                ...mockGroups[0],
                nodeIds: ['nonexistent']
            };

            const updatedGroups = groupManager.updateGroupBoundsAfterArrangement([emptyGroup], mockNodes);

            expect(updatedGroups[0]).toEqual(emptyGroup);
        });
    });

    describe('validateArrangementGroups', () => {
        it('should validate correct arrangement groups', () => {
            const arrangementGroups: ArrangementGroup[] = [
                {
                    id: 'group1',
                    nodeIds: ['node1', 'node2'],
                    bounds: { x: 0, y: 0, width: 100, height: 100 },
                    treatAsUnit: true,
                    center: { x: 50, y: 50 }
                }
            ];

            const result = groupManager.validateArrangementGroups(arrangementGroups, mockNodes);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect invalid group structure', () => {
            const invalidGroups: ArrangementGroup[] = [
                {
                    id: '',
                    nodeIds: [],
                    bounds: { x: 0, y: 0, width: 100, height: 100 },
                    treatAsUnit: true,
                    center: { x: 50, y: 50 }
                }
            ];

            const result = groupManager.validateArrangementGroups(invalidGroups, mockNodes);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Arrangement group at index 0 has invalid ID');
            expect(result.errors).toContain('Arrangement group  has no node IDs');
        });

        it('should detect nonexistent nodes', () => {
            const groupsWithInvalidNodes: ArrangementGroup[] = [
                {
                    id: 'group1',
                    nodeIds: ['nonexistent'],
                    bounds: { x: 0, y: 0, width: 100, height: 100 },
                    treatAsUnit: true,
                    center: { x: 50, y: 50 }
                }
            ];

            const result = groupManager.validateArrangementGroups(groupsWithInvalidNodes, mockNodes);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Node nonexistent in group group1 does not exist');
        });

        it('should detect duplicate node assignments', () => {
            const groupsWithDuplicates: ArrangementGroup[] = [
                {
                    id: 'group1',
                    nodeIds: ['node1'],
                    bounds: { x: 0, y: 0, width: 100, height: 100 },
                    treatAsUnit: true,
                    center: { x: 50, y: 50 }
                },
                {
                    id: 'group2',
                    nodeIds: ['node1'], // Duplicate
                    bounds: { x: 0, y: 0, width: 100, height: 100 },
                    treatAsUnit: true,
                    center: { x: 50, y: 50 }
                }
            ];

            const result = groupManager.validateArrangementGroups(groupsWithDuplicates, mockNodes);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Node node1 is assigned to multiple arrangement groups');
        });
    });
});