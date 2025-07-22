/**
 * Custom hook for constraining node dragging within group boundaries
 */
import { useCallback, useRef, useState } from 'react';
import type { Node } from 'reactflow';
import type { NodeGroup } from '@/lib/group-types';
import { groupManager } from '@/lib/GroupManager';
import type { ConstraintDirection } from './useGroupConstraintFeedback';

interface NodeDragConstraint {
    nodeId: string;
    groupId: string | null;
    constrain: (position: { x: number, y: number }) => { x: number, y: number };
}

interface ConstraintViolation {
    nodeId: string;
    groupId: string;
    direction: ConstraintDirection;
    position: { x: number, y: number };
    constrainedPosition: { x: number, y: number };
}

export function useNodeDragConstraints(
    nodes: Node[],
    groups: NodeGroup[],
    expandGroups: boolean = false
) {
    // Cache of node dimensions
    const nodeDimensionsCache = useRef<Record<string, { width: number, height: number }>>({});

    // Track constraint violations for visual feedback
    const [constraintViolation, setConstraintViolation] = useState<ConstraintViolation | null>(null);

    // Update node dimensions in cache
    const updateNodeDimensions = useCallback((nodeId: string, width: number, height: number) => {
        nodeDimensionsCache.current[nodeId] = { width, height };
    }, []);

    // Get node dimensions from cache or use defaults
    const getNodeDimensions = useCallback((nodeId: string) => {
        return nodeDimensionsCache.current[nodeId] || { width: 150, height: 40 };
    }, []);

    // Find the group that contains a node
    const findGroupForNode = useCallback((nodeId: string): NodeGroup | null => {
        return groupManager.findGroupForNode(nodeId, groups);
    }, [groups]);

    // Determine which boundary is being violated
    const detectConstraintDirection = useCallback((
        position: { x: number, y: number },
        constrainedPosition: { x: number, y: number },
        nodeWidth: number,
        nodeHeight: number,
        group: NodeGroup,
        padding: number = 10
    ): ConstraintDirection => {
        // Calculate the bounds of the group with padding
        const groupLeft = group.bounds.x + padding;
        const groupTop = group.bounds.y + padding;
        const groupRight = group.bounds.x + group.bounds.width - padding;
        const groupBottom = group.bounds.y + group.bounds.height - padding;

        // Check which boundary is being violated
        if (position.x < groupLeft) {
            return 'left';
        } else if (position.x + nodeWidth > groupRight) {
            return 'right';
        } else if (position.y < groupTop) {
            return 'top';
        } else if (position.y + nodeHeight > groupBottom) {
            return 'bottom';
        }

        return null;
    }, []);

    // Create a constraint function for a node
    const createConstraintForNode = useCallback((nodeId: string): NodeDragConstraint | null => {
        const group = findGroupForNode(nodeId);
        if (!group) return null;

        const { width, height } = getNodeDimensions(nodeId);

        return {
            nodeId,
            groupId: group.id,
            constrain: (position: { x: number, y: number }) => {
                if (expandGroups) {
                    // No constraint, but the group will be expanded later
                    return position;
                } else {
                    // Check if the position would violate the constraint
                    const isWithinBounds = groupManager.isNodePositionWithinGroup(
                        nodeId,
                        position,
                        width,
                        height,
                        group,
                        10 // padding
                    );

                    // If within bounds, clear any constraint violation and return the position
                    if (isWithinBounds) {
                        if (constraintViolation?.nodeId === nodeId) {
                            setConstraintViolation(null);
                        }
                        return position;
                    }

                    // Constrain the position to stay within the group bounds
                    const constrainedPosition = groupManager.constrainNodePositionToGroup(
                        nodeId,
                        position,
                        width,
                        height,
                        group,
                        10 // padding
                    );

                    // Detect which boundary is being violated for visual feedback
                    const direction = detectConstraintDirection(
                        position,
                        constrainedPosition,
                        width,
                        height,
                        group,
                        10
                    );

                    // Set constraint violation for visual feedback
                    if (direction) {
                        setConstraintViolation({
                            nodeId,
                            groupId: group.id,
                            direction,
                            position,
                            constrainedPosition
                        });
                    }

                    return constrainedPosition;
                }
            }
        };
    }, [findGroupForNode, getNodeDimensions, expandGroups, detectConstraintDirection, constraintViolation]);

    // Check if a node is within its group bounds
    const isNodeWithinGroupBounds = useCallback((nodeId: string, position: { x: number, y: number }): boolean => {
        const group = findGroupForNode(nodeId);
        if (!group) return true; // No group, so no constraint

        const { width, height } = getNodeDimensions(nodeId);

        return groupManager.isNodePositionWithinGroup(
            nodeId,
            position,
            width,
            height,
            group,
            10 // padding
        );
    }, [findGroupForNode, getNodeDimensions]);

    // Expand a group to fit a node at a new position
    const expandGroupToFitNode = useCallback((nodeId: string, position: { x: number, y: number }): NodeGroup | null => {
        const group = findGroupForNode(nodeId);
        if (!group) return null;

        const { width, height } = getNodeDimensions(nodeId);

        return groupManager.expandGroupToFitNode(
            group,
            nodeId,
            position,
            width,
            height,
            20 // padding
        );
    }, [findGroupForNode, getNodeDimensions]);

    // Clear constraint violation
    const clearConstraintViolation = useCallback(() => {
        if (constraintViolation) {
            setConstraintViolation(null);
        }
    }, [constraintViolation]);

    return {
        createConstraintForNode,
        isNodeWithinGroupBounds,
        expandGroupToFitNode,
        updateNodeDimensions,
        constraintViolation,
        clearConstraintViolation
    };
}

export type UseNodeDragConstraintsReturn = ReturnType<typeof useNodeDragConstraints>;