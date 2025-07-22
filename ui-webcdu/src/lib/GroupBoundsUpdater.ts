/**
 * GroupBoundsUpdater utility for efficient batch updates of group bounds
 * after arrangement operations
 */

import type { Node } from 'reactflow';
import type { NodeGroup, Bounds, BoundsCalculationOptions } from './group-types';
import { groupManager } from './GroupManager';

export interface GroupBoundsUpdateResult {
    /** Whether the update was successful */
    success: boolean;
    /** Updated groups with new bounds */
    updatedGroups: NodeGroup[];
    /** Groups that had their bounds changed */
    changedGroups: NodeGroup[];
    /** Error message if update failed */
    error?: string;
    /** Performance metrics */
    metrics?: {
        totalGroups: number;
        updatedGroups: number;
        processingTimeMs: number;
    };
}

export interface BatchUpdateOptions extends Partial<BoundsCalculationOptions> {
    /** Whether to only update groups that actually need updating */
    onlyUpdateChanged: boolean;
    /** Minimum change threshold to consider a group as changed */
    changeThreshold: number;
    /** Whether to validate group integrity after update */
    validateIntegrity: boolean;
    /** Whether to collect performance metrics */
    collectMetrics: boolean;
}

export class GroupBoundsUpdater {
    private static readonly DEFAULT_BATCH_OPTIONS: BatchUpdateOptions = {
        padding: 20,
        minWidth: 100,
        minHeight: 60,
        includeHandles: true,
        onlyUpdateChanged: true,
        changeThreshold: 1, // 1 pixel threshold
        validateIntegrity: true,
        collectMetrics: false
    };

    /**
     * Update bounds for multiple groups efficiently
     */
    static updateGroupBounds(
        groups: NodeGroup[],
        nodes: Node[],
        options: Partial<BatchUpdateOptions> = {}
    ): GroupBoundsUpdateResult {
        const startTime = Date.now();
        const opts = { ...this.DEFAULT_BATCH_OPTIONS, ...options };

        try {
            const updatedGroups: NodeGroup[] = [];
            const changedGroups: NodeGroup[] = [];

            for (const group of groups) {
                // Calculate new bounds
                const newBounds = groupManager.calculateGroupBounds(
                    group.nodeIds,
                    nodes,
                    {
                        padding: opts.padding!,
                        minWidth: opts.minWidth!,
                        minHeight: opts.minHeight!,
                        includeHandles: opts.includeHandles!
                    }
                );

                // Check if bounds actually changed
                const boundsChanged = opts.onlyUpdateChanged ?
                    this.hasBoundsChanged(group.bounds, newBounds, opts.changeThreshold!) :
                    true;

                if (boundsChanged) {
                    const updatedGroup: NodeGroup = {
                        ...group,
                        bounds: newBounds,
                        updatedAt: Date.now()
                    };

                    updatedGroups.push(updatedGroup);
                    changedGroups.push(updatedGroup);
                } else {
                    updatedGroups.push(group);
                }
            }

            // Validate integrity if requested (but allow empty groups to pass)
            if (opts.validateIntegrity) {
                const validationResult = this.validateGroupIntegrity(updatedGroups, nodes);
                if (!validationResult.isValid) {
                    // Only fail if there are serious errors, not just empty groups
                    const seriousErrors = validationResult.errors.filter(error =>
                        !error.includes('has no valid nodes')
                    );
                    if (seriousErrors.length > 0) {
                        return {
                            success: false,
                            updatedGroups: [],
                            changedGroups: [],
                            error: `Group integrity validation failed: ${seriousErrors.join(', ')}`
                        };
                    }
                }
            }

            const endTime = Date.now();
            const result: GroupBoundsUpdateResult = {
                success: true,
                updatedGroups,
                changedGroups
            };

            if (opts.collectMetrics) {
                result.metrics = {
                    totalGroups: groups.length,
                    updatedGroups: changedGroups.length,
                    processingTimeMs: endTime - startTime
                };
            }

            return result;
        } catch (error) {
            return {
                success: false,
                updatedGroups: [],
                changedGroups: [],
                error: `Batch update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Update bounds for a single group
     */
    static updateSingleGroupBounds(
        group: NodeGroup,
        nodes: Node[],
        options: Partial<BoundsCalculationOptions> = {}
    ): NodeGroup {
        const newBounds = groupManager.calculateGroupBounds(group.nodeIds, nodes, options);

        // Ensure timestamp is always newer
        const newTimestamp = Math.max(Date.now(), group.updatedAt + 1);

        return {
            ...group,
            bounds: newBounds,
            updatedAt: newTimestamp
        };
    }

    /**
     * Check if group bounds have changed significantly
     */
    private static hasBoundsChanged(
        oldBounds: Bounds,
        newBounds: Bounds,
        threshold: number
    ): boolean {
        return (
            Math.abs(oldBounds.x - newBounds.x) > threshold ||
            Math.abs(oldBounds.y - newBounds.y) > threshold ||
            Math.abs(oldBounds.width - newBounds.width) > threshold ||
            Math.abs(oldBounds.height - newBounds.height) > threshold
        );
    }

    /**
     * Validate that all groups properly contain their nodes
     */
    private static validateGroupIntegrity(
        groups: NodeGroup[],
        nodes: Node[]
    ): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        for (const group of groups) {
            const groupNodes = nodes.filter(node => group.nodeIds.includes(node.id));

            if (groupNodes.length === 0) {
                errors.push(`Group ${group.id} has no valid nodes`);
                continue;
            }

            // Check if all nodes are within group bounds
            for (const node of groupNodes) {
                const nodeRight = node.position.x + (node.width || 150);
                const nodeBottom = node.position.y + (node.height || 40);

                if (
                    node.position.x < group.bounds.x ||
                    node.position.y < group.bounds.y ||
                    nodeRight > group.bounds.x + group.bounds.width ||
                    nodeBottom > group.bounds.y + group.bounds.height
                ) {
                    errors.push(`Node ${node.id} is outside bounds of group ${group.id}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Optimize group bounds to minimize overlap
     */
    static optimizeGroupBounds(
        groups: NodeGroup[],
        nodes: Node[],
        options: Partial<BatchUpdateOptions> = {}
    ): GroupBoundsUpdateResult {
        const opts = { ...this.DEFAULT_BATCH_OPTIONS, ...options };

        // First, resolve overlaps with current bounds
        const optimizedGroups = this.resolveGroupOverlaps(groups);

        // Then, update bounds normally for the optimized groups
        const finalUpdate = this.updateGroupBounds(optimizedGroups, nodes, opts);

        if (!finalUpdate.success) {
            return finalUpdate;
        }

        return {
            ...finalUpdate,
            changedGroups: optimizedGroups.filter(group =>
                groups.some(original => original.id === group.id &&
                    this.hasBoundsChanged(original.bounds, group.bounds, opts.changeThreshold!))
            )
        };
    }

    /**
     * Resolve overlaps between groups by adjusting positions
     */
    private static resolveGroupOverlaps(groups: NodeGroup[]): NodeGroup[] {
        // Simple overlap resolution - move overlapping groups apart
        const resolvedGroups = [...groups];
        const spacing = 20;

        for (let i = 0; i < resolvedGroups.length; i++) {
            for (let j = i + 1; j < resolvedGroups.length; j++) {
                const group1 = resolvedGroups[i];
                const group2 = resolvedGroups[j];

                if (this.groupsOverlap(group1.bounds, group2.bounds)) {
                    // Move group2 to the right of group1
                    const newX = group1.bounds.x + group1.bounds.width + spacing;
                    resolvedGroups[j] = {
                        ...group2,
                        bounds: {
                            ...group2.bounds,
                            x: newX
                        },
                        updatedAt: Date.now()
                    };
                }
            }
        }

        return resolvedGroups;
    }

    /**
     * Check if two group bounds overlap
     */
    private static groupsOverlap(bounds1: Bounds, bounds2: Bounds): boolean {
        return !(
            bounds1.x + bounds1.width <= bounds2.x ||
            bounds2.x + bounds2.width <= bounds1.x ||
            bounds1.y + bounds1.height <= bounds2.y ||
            bounds2.y + bounds2.height <= bounds1.y
        );
    }

    /**
     * Get groups that need bounds updates based on node changes
     */
    static getGroupsNeedingUpdate(
        groups: NodeGroup[],
        changedNodeIds: string[]
    ): NodeGroup[] {
        return groups.filter(group =>
            group.nodeIds.some(nodeId => changedNodeIds.includes(nodeId))
        );
    }

    /**
     * Create a debounced bounds updater for real-time updates
     */
    static createDebouncedUpdater(
        updateCallback: (groups: NodeGroup[]) => void,
        delay: number = 300
    ) {
        let timeoutId: NodeJS.Timeout | null = null;
        let pendingGroups: NodeGroup[] = [];
        let pendingNodes: Node[] = [];

        return {
            scheduleUpdate: (groups: NodeGroup[], nodes: Node[]) => {
                pendingGroups = groups;
                pendingNodes = nodes;

                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                timeoutId = setTimeout(() => {
                    const result = this.updateGroupBounds(pendingGroups, pendingNodes, {
                        onlyUpdateChanged: true,
                        collectMetrics: false
                    });

                    if (result.success && result.changedGroups.length > 0) {
                        updateCallback(result.updatedGroups);
                    }

                    timeoutId = null;
                }, delay);
            },

            cancel: () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
            }
        };
    }
}