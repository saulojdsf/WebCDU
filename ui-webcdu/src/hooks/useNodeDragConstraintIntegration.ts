/**
 * Custom hook to integrate node drag constraints with React Flow
 */
import { useCallback, useEffect, useState } from 'react';
import type { Node } from 'reactflow';
import type { NodeGroup } from '@/lib/group-types';
import { useNodeDragConstraints } from './useNodeDragConstraints';
import { useGroupConstraintFeedback } from './useGroupConstraintFeedback';

export function useNodeDragConstraintIntegration(
    nodes: Node[],
    groups: NodeGroup[],
    expandGroups: boolean = false
) {
    // Initialize the node drag constraints hook
    const {
        createConstraintForNode,
        isNodeWithinGroupBounds,
        expandGroupToFitNode,
        updateNodeDimensions,
        constraintViolation,
        clearConstraintViolation
    } = useNodeDragConstraints(nodes, groups, expandGroups);

    // Initialize the constraint feedback hook
    const {
        showConstraintFeedback,
        hideConstraintFeedback,
        constraintFeedback
    } = useGroupConstraintFeedback();

    // Track nodes being dragged
    const [draggingNodeIds, setDraggingNodeIds] = useState<string[]>([]);

    // Show visual feedback when constraint violation occurs
    useEffect(() => {
        if (constraintViolation) {
            const { nodeId, groupId, direction, position } = constraintViolation;

            // Only show feedback if the node is currently being dragged
            if (draggingNodeIds.includes(nodeId)) {
                showConstraintFeedback(direction, groupId, 1000, true);
            }
        } else {
            hideConstraintFeedback();
        }
    }, [constraintViolation, draggingNodeIds, showConstraintFeedback, hideConstraintFeedback]);

    // Create a node drag handler for React Flow
    const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
        setDraggingNodeIds(prev => [...prev, node.id]);
    }, []);

    // Handle node drag end
    const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
        setDraggingNodeIds(prev => prev.filter(id => id !== node.id));
        clearConstraintViolation();
        hideConstraintFeedback();
    }, [clearConstraintViolation, hideConstraintFeedback]);

    // Create a node position constraint function for React Flow
    const nodePositionChange = useCallback((node: Node, newPosition: { x: number, y: number }) => {
        const constraint = createConstraintForNode(node.id);
        if (constraint) {
            return constraint.constrain(newPosition);
        }
        return newPosition;
    }, [createConstraintForNode]);

    return {
        onNodeDragStart,
        onNodeDragStop,
        nodePositionChange,
        updateNodeDimensions,
        constraintViolation,
        constraintFeedback,
        isNodeWithinGroupBounds,
        expandGroupToFitNode,
        draggingNodeIds
    };
}

export type UseNodeDragConstraintIntegrationReturn = ReturnType<typeof useNodeDragConstraintIntegration>;