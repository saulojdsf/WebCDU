/**
 * Group-aware arrangement hook that extends the base arrangement functionality
 * to respect group boundaries and treat groups as cohesive units
 */

import { useCallback, useMemo } from 'react';
import { type Node, type Edge } from 'reactflow';
import { toast } from 'sonner';
import { groupManager } from '../lib/GroupManager';
import { GroupBoundsUpdater } from '../lib/GroupBoundsUpdater';
import type {
    NodeGroup,
    ArrangementGroup,
    GroupArrangementOptions,
    GroupArrangementResult
} from '../lib/group-types';

export interface UseGroupAwareArrangementProps {
    nodes: Node[];
    edges: Edge[];
    groups: NodeGroup[];
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    setGroups: (groups: NodeGroup[] | ((groups: NodeGroup[]) => NodeGroup[])) => void;
    options?: Partial<GroupArrangementOptions>;
}

export const useGroupAwareArrangement = ({
    nodes,
    edges,
    groups,
    setNodes,
    setGroups,
    options = {}
}: UseGroupAwareArrangementProps) => {

    /**
     * Apply hierarchical layout that respects groups
     */
    const applyGroupAwareHierarchicalLayout = useCallback(async (
        arrangementGroups: ArrangementGroup[],
        ungroupedNodes: Node[]
    ): Promise<Array<{ id: string; x: number; y: number }>> => {
        const positions: Array<{ id: string; x: number; y: number }> = [];

        // First, arrange groups as units
        if (arrangementGroups.length > 0) {
            // Find groups with no incoming connections (source groups)
            const sourceGroups = arrangementGroups.filter(group => {
                const groupNodeIds = new Set(group.nodeIds);
                return !edges.some(edge =>
                    groupNodeIds.has(edge.target) &&
                    !groupNodeIds.has(edge.source)
                );
            });

            let currentLayer = 0;
            const processedGroups = new Set<string>();
            const groupPositions = new Map<string, { x: number; y: number }>();

            // Start with source groups
            if (sourceGroups.length > 0) {
                sourceGroups.forEach((group, index) => {
                    groupPositions.set(group.id, {
                        x: 50,
                        y: 50 + index * (group.bounds.height + (options.groupSpacing ?? 50))
                    });
                    processedGroups.add(group.id);
                });
                currentLayer = 1;
            }

            // Process remaining groups layer by layer
            while (processedGroups.size < arrangementGroups.length) {
                const currentLayerGroups = arrangementGroups.filter(group => {
                    if (processedGroups.has(group.id)) return false;

                    const groupNodeIds = new Set(group.nodeIds);
                    const incomingEdges = edges.filter(edge =>
                        groupNodeIds.has(edge.target) && !groupNodeIds.has(edge.source)
                    );

                    return incomingEdges.length === 0 || incomingEdges.every(edge => {
                        // Check if source node's group is already processed
                        const sourceGroup = arrangementGroups.find(g => g.nodeIds.includes(edge.source));
                        return sourceGroup ? processedGroups.has(sourceGroup.id) : true;
                    });
                });

                if (currentLayerGroups.length === 0) {
                    // Handle remaining groups (likely in cycles)
                    const remainingGroups = arrangementGroups.filter(group => !processedGroups.has(group.id));
                    remainingGroups.forEach((group, index) => {
                        groupPositions.set(group.id, {
                            x: 50 + currentLayer * 300,
                            y: 50 + index * (group.bounds.height + (options.groupSpacing ?? 50))
                        });
                        processedGroups.add(group.id);
                    });
                    break;
                }

                currentLayerGroups.forEach((group, index) => {
                    groupPositions.set(group.id, {
                        x: 50 + currentLayer * 300,
                        y: 50 + index * (group.bounds.height + (options.groupSpacing ?? 50))
                    });
                    processedGroups.add(group.id);
                });

                currentLayer++;
            }

            // Convert group positions to node positions
            arrangementGroups.forEach(group => {
                const groupPos = groupPositions.get(group.id);
                if (!groupPos) return;

                if (options.arrangeWithinGroups) {
                    // Arrange nodes within the group
                    const groupNodes = nodes.filter(node => group.nodeIds.includes(node.id));
                    const groupEdges = edges.filter(edge =>
                        group.nodeIds.includes(edge.source) && group.nodeIds.includes(edge.target)
                    );

                    // Simple grid layout within group
                    const gridSize = Math.ceil(Math.sqrt(groupNodes.length));
                    const nodeSpacing = 120;

                    groupNodes.forEach((node, index) => {
                        positions.push({
                            id: node.id,
                            x: groupPos.x + 20 + (index % gridSize) * nodeSpacing,
                            y: groupPos.y + 20 + Math.floor(index / gridSize) * nodeSpacing
                        });
                    });
                } else {
                    // Maintain relative positions within group
                    const offsetX = groupPos.x - group.bounds.x;
                    const offsetY = groupPos.y - group.bounds.y;

                    group.nodeIds.forEach(nodeId => {
                        const node = nodes.find(n => n.id === nodeId);
                        if (node) {
                            positions.push({
                                id: nodeId,
                                x: node.position.x + offsetX,
                                y: node.position.y + offsetY
                            });
                        }
                    });
                }
            });
        }

        // Handle ungrouped nodes
        if (ungroupedNodes.length > 0) {
            const startY = Math.max(
                ...positions.map(p => p.y),
                ...arrangementGroups.map(g => g.bounds.y + g.bounds.height)
            ) + (options.groupSpacing ?? 50);

            ungroupedNodes.forEach((node, index) => {
                positions.push({
                    id: node.id,
                    x: 50 + (index % 5) * 200,
                    y: startY + Math.floor(index / 5) * 100
                });
            });
        }

        return positions;
    }, [nodes, edges, options]);

    /**
     * Apply grid layout that respects groups
     */
    const applyGroupAwareGridLayout = useCallback(async (
        arrangementGroups: ArrangementGroup[],
        ungroupedNodes: Node[]
    ): Promise<Array<{ id: string; x: number; y: number }>> => {
        const positions: Array<{ id: string; x: number; y: number }> = [];

        // Arrange groups in a grid
        const totalGroups = arrangementGroups.length + (ungroupedNodes.length > 0 ? 1 : 0);
        const gridSize = Math.ceil(Math.sqrt(totalGroups));
        const groupSpacing = options.groupSpacing ?? 50;

        let groupIndex = 0;

        // Position groups
        arrangementGroups.forEach(group => {
            const gridX = groupIndex % gridSize;
            const gridY = Math.floor(groupIndex / gridSize);

            const groupX = 50 + gridX * (300 + groupSpacing);
            const groupY = 50 + gridY * (200 + groupSpacing);

            if (options.arrangeWithinGroups) {
                // Grid layout within group
                const groupNodes = nodes.filter(node => group.nodeIds.includes(node.id));
                const nodeGridSize = Math.ceil(Math.sqrt(groupNodes.length));

                groupNodes.forEach((node, index) => {
                    positions.push({
                        id: node.id,
                        x: groupX + 20 + (index % nodeGridSize) * 120,
                        y: groupY + 20 + Math.floor(index / nodeGridSize) * 80
                    });
                });
            } else {
                // Maintain relative positions
                const offsetX = groupX - group.bounds.x;
                const offsetY = groupY - group.bounds.y;

                group.nodeIds.forEach(nodeId => {
                    const node = nodes.find(n => n.id === nodeId);
                    if (node) {
                        positions.push({
                            id: nodeId,
                            x: node.position.x + offsetX,
                            y: node.position.y + offsetY
                        });
                    }
                });
            }

            groupIndex++;
        });

        // Handle ungrouped nodes
        if (ungroupedNodes.length > 0) {
            const gridX = groupIndex % gridSize;
            const gridY = Math.floor(groupIndex / gridSize);

            const startX = 50 + gridX * (300 + groupSpacing);
            const startY = 50 + gridY * (200 + groupSpacing);

            const nodeGridSize = Math.ceil(Math.sqrt(ungroupedNodes.length));

            ungroupedNodes.forEach((node, index) => {
                positions.push({
                    id: node.id,
                    x: startX + (index % nodeGridSize) * 120,
                    y: startY + Math.floor(index / nodeGridSize) * 80
                });
            });
        }

        return positions;
    }, [nodes, options]);

    /**
     * Apply circular layout that respects groups
     */
    const applyGroupAwareCircularLayout = useCallback(async (
        arrangementGroups: ArrangementGroup[],
        ungroupedNodes: Node[]
    ): Promise<Array<{ id: string; x: number; y: number }>> => {
        const positions: Array<{ id: string; x: number; y: number }> = [];

        const centerX = 400;
        const centerY = 300;
        const totalGroups = arrangementGroups.length + (ungroupedNodes.length > 0 ? 1 : 0);
        const radius = Math.max(200, totalGroups * 30);

        let groupIndex = 0;

        // Position groups in a circle
        arrangementGroups.forEach(group => {
            const angle = (2 * Math.PI * groupIndex) / totalGroups;
            const groupX = centerX + radius * Math.cos(angle);
            const groupY = centerY + radius * Math.sin(angle);

            if (options.arrangeWithinGroups) {
                // Circular layout within group
                const groupNodes = nodes.filter(node => group.nodeIds.includes(node.id));
                const nodeRadius = Math.max(50, groupNodes.length * 10);

                groupNodes.forEach((node, index) => {
                    const nodeAngle = (2 * Math.PI * index) / groupNodes.length;
                    positions.push({
                        id: node.id,
                        x: groupX + nodeRadius * Math.cos(nodeAngle),
                        y: groupY + nodeRadius * Math.sin(nodeAngle)
                    });
                });
            } else {
                // Maintain relative positions
                const offsetX = groupX - group.bounds.x - group.bounds.width / 2;
                const offsetY = groupY - group.bounds.y - group.bounds.height / 2;

                group.nodeIds.forEach(nodeId => {
                    const node = nodes.find(n => n.id === nodeId);
                    if (node) {
                        positions.push({
                            id: nodeId,
                            x: node.position.x + offsetX,
                            y: node.position.y + offsetY
                        });
                    }
                });
            }

            groupIndex++;
        });

        // Handle ungrouped nodes
        if (ungroupedNodes.length > 0) {
            const angle = (2 * Math.PI * groupIndex) / totalGroups;
            const groupX = centerX + radius * Math.cos(angle);
            const groupY = centerY + radius * Math.sin(angle);

            const nodeRadius = Math.max(50, ungroupedNodes.length * 10);

            ungroupedNodes.forEach((node, index) => {
                const nodeAngle = (2 * Math.PI * index) / ungroupedNodes.length;
                positions.push({
                    id: node.id,
                    x: groupX + nodeRadius * Math.cos(nodeAngle),
                    y: groupY + nodeRadius * Math.sin(nodeAngle)
                });
            });
        }

        return positions;
    }, [nodes, options]);

    /**
     * Main group-aware arrangement function
     */
    const applyGroupAwareArrangement = useCallback(async (
        strategy: 'hierarchical' | 'grid' | 'circular' = 'hierarchical'
    ): Promise<GroupArrangementResult> => {
        try {
            // Get arrangement groups
            const arrangementGroups = groupManager.getGroupsForArrangement(groups, nodes, options);

            // Validate arrangement groups
            const validation = groupManager.validateArrangementGroups(arrangementGroups, nodes);
            if (!validation.isValid) {
                return {
                    success: false,
                    nodePositions: [],
                    updatedGroups: [],
                    error: `Invalid arrangement groups: ${validation.errors.join(', ')}`
                };
            }

            // Get ungrouped nodes
            const groupedNodeIds = new Set(groups.flatMap(g => g.nodeIds));
            const ungroupedNodes = nodes.filter(node => !groupedNodeIds.has(node.id));

            // Create arrangement groups for ungrouped nodes if needed
            const ungroupedArrangementGroups = groupManager.createArrangementGroupsForUngroupedNodes(
                ungroupedNodes,
                options
            );

            // Apply the selected arrangement strategy
            let newPositions: Array<{ id: string; x: number; y: number }>;

            switch (strategy) {
                case 'hierarchical':
                    newPositions = await applyGroupAwareHierarchicalLayout(arrangementGroups, ungroupedNodes);
                    break;
                case 'grid':
                    newPositions = await applyGroupAwareGridLayout(arrangementGroups, ungroupedNodes);
                    break;
                case 'circular':
                    newPositions = await applyGroupAwareCircularLayout(arrangementGroups, ungroupedNodes);
                    break;
                default:
                    newPositions = await applyGroupAwareHierarchicalLayout(arrangementGroups, ungroupedNodes);
            }

            // Update group bounds after arrangement using the efficient batch updater
            const nodesWithNewPositions = nodes.map(node => {
                const newPos = newPositions.find(pos => pos.id === node.id);
                return newPos ? { ...node, position: { x: newPos.x, y: newPos.y } } : node;
            });

            const boundsUpdateResult = GroupBoundsUpdater.updateGroupBounds(
                groups,
                nodesWithNewPositions,
                {
                    onlyUpdateChanged: true,
                    validateIntegrity: true,
                    collectMetrics: false
                }
            );

            if (!boundsUpdateResult.success) {
                return {
                    success: false,
                    nodePositions: [],
                    updatedGroups: [],
                    error: `Failed to update group bounds: ${boundsUpdateResult.error}`
                };
            }

            const updatedGroups = boundsUpdateResult.updatedGroups;

            return {
                success: true,
                nodePositions: newPositions,
                updatedGroups,
            };
        } catch (error) {
            return {
                success: false,
                nodePositions: [],
                updatedGroups: [],
                error: `Arrangement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }, [groups, nodes, options, applyGroupAwareHierarchicalLayout, applyGroupAwareGridLayout, applyGroupAwareCircularLayout]);

    /**
     * Apply arrangement and update state
     */
    const handleGroupAwareArrangement = useCallback(async (
        strategy: 'hierarchical' | 'grid' | 'circular' = 'hierarchical'
    ) => {
        try {
            toast.info(`Applying ${strategy} layout with group awareness...`);

            const result = await applyGroupAwareArrangement(strategy);

            if (!result.success) {
                toast.error(result.error || 'Arrangement failed');
                return;
            }

            // Update node positions
            setNodes(currentNodes => currentNodes.map(node => {
                const newPos = result.nodePositions.find(pos => pos.id === node.id);
                return newPos ? { ...node, position: { x: newPos.x, y: newPos.y } } : node;
            }));

            // Update group bounds
            setGroups(result.updatedGroups);

            toast.success(`${strategy} layout applied successfully with group awareness`);
        } catch (error) {
            console.error('Group-aware arrangement failed:', error);
            toast.error(`Failed to apply ${strategy} layout: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [applyGroupAwareArrangement, setNodes, setGroups]);

    return {
        applyGroupAwareArrangement,
        handleGroupAwareArrangement,
        applyGroupAwareHierarchicalLayout,
        applyGroupAwareGridLayout,
        applyGroupAwareCircularLayout
    };
};