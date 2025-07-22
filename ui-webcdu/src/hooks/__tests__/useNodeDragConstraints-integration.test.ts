/**
 * Integration test for node drag constraints
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNodeDragConstraints } from '../useNodeDragConstraints';
import type { Node } from 'reactflow';
import type { NodeGroup } from '@/lib/group-types';

describe('useNodeDragConstraints Integration', () => {
    const mockNodes: Node[] = [
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
            position: { x: 200, y: 200 },
            data: { label: 'Node 2' },
            width: 150,
            height: 40
        }
    ];

    const mockGroups: NodeGroup[] = [
        {
            id: 'group1',
            title: 'Test Group',
            nodeIds: ['node1', 'node2'],
            bounds: { x: 50, y: 50, width: 350, height: 250 },
            style: {
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                borderColor: '#0000ff',
                borderRadius: 8
            },
            zIndex: -1,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
    ];

    it('should create constraints for nodes in groups', () => {
        const { result } = renderHook(() =>
            useNodeDragConstraints(mockNodes, mockGroups, false)
        );

        const constraint = result.current.createConstraintForNode('node1');
        expect(constraint).toBeDefined();
        expect(constraint?.nodeId).toBe('node1');
        expect(constraint?.groupId).toBe('group1');
    });

    it('should not create constraints for nodes not in groups', () => {
        const nodesNotInGroup: Node[] = [
            {
                id: 'node3',
                type: 'default',
                position: { x: 500, y: 500 },
                data: { label: 'Node 3' },
                width: 150,
                height: 40
            }
        ];

        const { result } = renderHook(() =>
            useNodeDragConstraints(nodesNotInGroup, mockGroups, false)
        );

        const constraint = result.current.createConstraintForNode('node3');
        expect(constraint).toBeNull();
    });

    it('should constrain node position within group bounds', () => {
        const { result } = renderHook(() =>
            useNodeDragConstraints(mockNodes, mockGroups, false)
        );

        const constraint = result.current.createConstraintForNode('node1');
        expect(constraint).toBeDefined();

        // Try to move node outside group bounds
        const outsidePosition = { x: 500, y: 500 };
        const constrainedPosition = constraint!.constrain(outsidePosition);

        // Position should be constrained within group bounds
        expect(constrainedPosition.x).toBeLessThan(outsidePosition.x);
        expect(constrainedPosition.y).toBeLessThan(outsidePosition.y);

        // Should be within group bounds (accounting for node size and padding)
        const group = mockGroups[0];
        const padding = 10;
        const nodeWidth = 150;
        const nodeHeight = 40;

        expect(constrainedPosition.x).toBeGreaterThanOrEqual(group.bounds.x + padding);
        expect(constrainedPosition.y).toBeGreaterThanOrEqual(group.bounds.y + padding);
        expect(constrainedPosition.x + nodeWidth).toBeLessThanOrEqual(group.bounds.x + group.bounds.width - padding);
        expect(constrainedPosition.y + nodeHeight).toBeLessThanOrEqual(group.bounds.y + group.bounds.height - padding);
    });

    it('should detect when node is within group bounds', () => {
        const { result } = renderHook(() =>
            useNodeDragConstraints(mockNodes, mockGroups, false)
        );

        // Position within bounds
        const withinBounds = result.current.isNodeWithinGroupBounds('node1', { x: 100, y: 100 });
        expect(withinBounds).toBe(true);

        // Position outside bounds
        const outsideBounds = result.current.isNodeWithinGroupBounds('node1', { x: 500, y: 500 });
        expect(outsideBounds).toBe(false);
    });

    it('should expand group to fit node when enabled', () => {
        const { result } = renderHook(() =>
            useNodeDragConstraints(mockNodes, mockGroups, true) // expandGroups = true
        );

        const originalGroup = mockGroups[0];
        const newPosition = { x: 500, y: 500 };

        const expandedGroup = result.current.expandGroupToFitNode('node1', newPosition);
        expect(expandedGroup).toBeDefined();

        if (expandedGroup) {
            // Group should be expanded to include the new position
            expect(expandedGroup.bounds.width).toBeGreaterThan(originalGroup.bounds.width);
            expect(expandedGroup.bounds.height).toBeGreaterThan(originalGroup.bounds.height);
        }
    });
});