/**
 * GroupManager service class for managing node groups
 * 
 * This service provides all the business logic for group operations including:
 * - Group creation and deletion
 * - Group bounds calculation and updates
 * - Group membership management
 * - Validation logic for group operations
 */

import type { Node } from 'reactflow';
import type {
  NodeGroup,
  CreateGroupParams,
  UpdateGroupParams,
  GroupOperationResult,
  Bounds,
  BoundsCalculationOptions,
  GroupValidationResult,
  ArrangementGroup,
  GroupArrangementOptions,
  DEFAULT_GROUP_ARRANGEMENT_OPTIONS
} from './group-types';
import { DEFAULT_GROUP_STYLE, DEFAULT_BOUNDS_OPTIONS, DEFAULT_GROUP_ARRANGEMENT_OPTIONS } from './group-types';

/**
 * GroupManager service class
 */
export class GroupManager {
  /**
   * Create a new group from the provided parameters
   */
  createGroup(params: CreateGroupParams): GroupOperationResult {
    try {
      // Validate input parameters
      const validation = this.validateCreateGroupParams(params);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Generate unique group ID
      const groupId = this.generateGroupId();

      // Generate default title if not provided
      const title = params.title || this.generateDefaultTitle(groupId);

      // Create group style (merge with defaults)
      const style = {
        ...DEFAULT_GROUP_STYLE,
        ...params.style,
      };

      // Create the group object (bounds will be calculated separately)
      const group: NodeGroup = {
        id: groupId,
        title,
        nodeIds: [...params.nodeIds], // Create a copy
        bounds: { x: 0, y: 0, width: 0, height: 0 }, // Placeholder
        style,
        zIndex: -1, // Groups render behind nodes
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return {
        success: true,
        group,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update an existing group's title
   */
  updateGroupTitle(groupId: string, newTitle: string): GroupOperationResult {
    try {
      // Validate title
      if (!newTitle || typeof newTitle !== 'string') {
        return {
          success: false,
          error: 'Title must be a non-empty string',
        };
      }

      const sanitizedTitle = newTitle.trim();
      if (sanitizedTitle.length === 0) {
        return {
          success: false,
          error: 'Title cannot be empty',
        };
      }

      if (sanitizedTitle.length > 100) {
        return {
          success: false,
          error: 'Title cannot exceed 100 characters',
        };
      }

      return {
        success: true,
        group: undefined, // The actual update will be handled by the calling code
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update group title: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Delete a group (validation only - actual deletion handled by calling code)
   */
  deleteGroup(groupId: string): GroupOperationResult {
    try {
      // Validate group ID
      if (!groupId || typeof groupId !== 'string') {
        return {
          success: false,
          error: 'Group ID must be a non-empty string',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete group: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Calculate bounds for a group based on its member nodes
   */
  calculateGroupBounds(
    nodeIds: string[],
    nodes: Node[],
    options: Partial<BoundsCalculationOptions> = {}
  ): Bounds {
    const opts = { ...DEFAULT_BOUNDS_OPTIONS, ...options };

    // Filter nodes to only include group members
    const groupNodes = nodes.filter(node => nodeIds.includes(node.id));

    if (groupNodes.length === 0) {
      return {
        x: 0,
        y: 0,
        width: opts.minWidth,
        height: opts.minHeight,
      };
    }

    // Calculate bounding box of all nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    groupNodes.forEach(node => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;

      // Estimate node dimensions (default ReactFlow node size)
      const nodeWidth = (node.width || 150);
      const nodeHeight = (node.height || 40);

      minX = Math.min(minX, nodeX);
      minY = Math.min(minY, nodeY);
      maxX = Math.max(maxX, nodeX + nodeWidth);
      maxY = Math.max(maxY, nodeY + nodeHeight);
    });

    // Add padding
    const x = minX - opts.padding;
    const y = minY - opts.padding;
    const width = Math.max(maxX - minX + (opts.padding * 2), opts.minWidth);
    const height = Math.max(maxY - minY + (opts.padding * 2), opts.minHeight);

    return { x, y, width, height };
  }

  /**
   * Update group bounds for an existing group
   */
  updateGroupBounds(group: NodeGroup, nodes: Node[]): NodeGroup {
    const newBounds = this.calculateGroupBounds(group.nodeIds, nodes);

    return {
      ...group,
      bounds: newBounds,
      updatedAt: Date.now(),
    };
  }

  /**
   * Add nodes to a group
   */
  addNodesToGroup(group: NodeGroup, nodeIds: string[]): GroupOperationResult {
    try {
      // Validate input
      if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
        return {
          success: false,
          error: 'Node IDs must be a non-empty array',
        };
      }

      // Filter out nodes that are already in the group
      const newNodeIds = nodeIds.filter(id => !group.nodeIds.includes(id));

      if (newNodeIds.length === 0) {
        return {
          success: false,
          error: 'All specified nodes are already in the group',
        };
      }

      const updatedGroup: NodeGroup = {
        ...group,
        nodeIds: [...group.nodeIds, ...newNodeIds],
        updatedAt: Date.now(),
      };

      return {
        success: true,
        group: updatedGroup,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add nodes to group: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Remove nodes from a group
   */
  removeNodesFromGroup(group: NodeGroup, nodeIds: string[]): GroupOperationResult {
    try {
      // Validate input
      if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
        return {
          success: false,
          error: 'Node IDs must be a non-empty array',
        };
      }

      // Filter out nodes that are in the group
      const remainingNodeIds = group.nodeIds.filter(id => !nodeIds.includes(id));

      // Check if group would become empty
      if (remainingNodeIds.length === 0) {
        return {
          success: false,
          error: 'Cannot remove all nodes from group - group would become empty',
        };
      }

      // Check if group would have less than 2 nodes
      if (remainingNodeIds.length < 2) {
        return {
          success: false,
          error: 'Group must contain at least 2 nodes',
        };
      }

      const updatedGroup: NodeGroup = {
        ...group,
        nodeIds: remainingNodeIds,
        updatedAt: Date.now(),
      };

      return {
        success: true,
        group: updatedGroup,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to remove nodes from group: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate parameters for group creation
   */
  private validateCreateGroupParams(params: CreateGroupParams): GroupValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate nodeIds
    if (!params.nodeIds || !Array.isArray(params.nodeIds)) {
      errors.push('nodeIds must be an array');
    } else {
      if (params.nodeIds.length < 2) {
        errors.push('Group must contain at least 2 nodes');
      }

      if (params.nodeIds.some(id => typeof id !== 'string' || id.trim().length === 0)) {
        errors.push('All node IDs must be non-empty strings');
      }

      // Check for duplicates
      const uniqueIds = new Set(params.nodeIds);
      if (uniqueIds.size !== params.nodeIds.length) {
        warnings.push('Duplicate node IDs found - duplicates will be removed');
      }
    }

    // Validate title if provided
    if (params.title !== undefined) {
      if (typeof params.title !== 'string') {
        errors.push('Title must be a string');
      } else if (params.title.trim().length === 0) {
        warnings.push('Empty title provided - default title will be used');
      } else if (params.title.length > 100) {
        errors.push('Title cannot exceed 100 characters');
      }
    }

    // Validate style if provided
    if (params.style !== undefined) {
      if (typeof params.style !== 'object' || params.style === null) {
        errors.push('Style must be an object');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate a unique group ID
   */
  private generateGroupId(): string {
    return `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a default title for a group
   */
  private generateDefaultTitle(groupId: string): string {
    // Extract a simple number from the group ID for default naming
    const timestamp = groupId.split('-')[1];
    const shortId = timestamp ? timestamp.slice(-4) : Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `Group ${shortId}`;
  }

  /**
   * Check if a node position is within a group's bounds
   */
  isNodePositionWithinGroup(
    nodeId: string,
    position: { x: number, y: number },
    nodeWidth: number,
    nodeHeight: number,
    group: NodeGroup,
    padding: number = 10
  ): boolean {
    // Calculate the bounds of the node at the new position
    const nodeRight = position.x + nodeWidth;
    const nodeBottom = position.y + nodeHeight;

    // Calculate the bounds of the group with padding
    const groupLeft = group.bounds.x + padding;
    const groupTop = group.bounds.y + padding;
    const groupRight = group.bounds.x + group.bounds.width - padding;
    const groupBottom = group.bounds.y + group.bounds.height - padding;

    // Check if the node is completely within the group bounds
    return (
      position.x >= groupLeft &&
      position.y >= groupTop &&
      nodeRight <= groupRight &&
      nodeBottom <= groupBottom
    );
  }

  /**
   * Constrain a node position to stay within a group's bounds
   */
  constrainNodePositionToGroup(
    nodeId: string,
    position: { x: number, y: number },
    nodeWidth: number,
    nodeHeight: number,
    group: NodeGroup,
    padding: number = 10
  ): { x: number, y: number } {
    // Calculate the bounds of the group with padding
    const groupLeft = group.bounds.x + padding;
    const groupTop = group.bounds.y + padding;
    const groupRight = group.bounds.x + group.bounds.width - padding;
    const groupBottom = group.bounds.y + group.bounds.height - padding;

    // Constrain the position to stay within the group bounds
    return {
      x: Math.max(groupLeft, Math.min(position.x, groupRight - nodeWidth)),
      y: Math.max(groupTop, Math.min(position.y, groupBottom - nodeHeight))
    };
  }

  /**
   * Expand a group to fit a node at a new position
   */
  expandGroupToFitNode(
    group: NodeGroup,
    nodeId: string,
    position: { x: number, y: number },
    nodeWidth: number,
    nodeHeight: number,
    padding: number = 20
  ): NodeGroup {
    // Calculate the current bounds of the group
    let { x, y, width, height } = group.bounds;

    // Calculate the bounds needed to include the node at its new position
    const nodeRight = position.x + nodeWidth;
    const nodeBottom = position.y + nodeHeight;

    // Expand the bounds if necessary
    const newX = Math.min(x, position.x - padding);
    const newY = Math.min(y, position.y - padding);
    const newWidth = Math.max(width, nodeRight - newX + padding);
    const newHeight = Math.max(height, nodeBottom - newY + padding);

    // Return updated group with new bounds
    return {
      ...group,
      bounds: {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      },
      updatedAt: Date.now()
    };
  }

  /**
   * Validate that nodes exist in the provided node array
   */
  validateNodesExist(nodeIds: string[], nodes: Node[]): GroupValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const existingNodeIds = new Set(nodes.map(node => node.id));
    const missingNodeIds = nodeIds.filter(id => !existingNodeIds.has(id));

    if (missingNodeIds.length > 0) {
      errors.push(`Nodes not found: ${missingNodeIds.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if nodes are already in other groups
   */
  validateNodesNotInOtherGroups(nodeIds: string[], existingGroups: NodeGroup[], excludeGroupId?: string): GroupValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const conflictingNodes: string[] = [];

    existingGroups.forEach(group => {
      if (excludeGroupId && group.id === excludeGroupId) {
        return; // Skip the group we're updating
      }

      const conflicts = nodeIds.filter(nodeId => group.nodeIds.includes(nodeId));
      if (conflicts.length > 0) {
        conflictingNodes.push(...conflicts);
      }
    });

    if (conflictingNodes.length > 0) {
      errors.push(`Nodes already in other groups: ${[...new Set(conflictingNodes)].join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Find the group that contains a node
   */
  findGroupForNode(nodeId: string, groups: NodeGroup[]): NodeGroup | null {
    for (const group of groups) {
      if (group.nodeIds.includes(nodeId)) {
        return group;
      }
    }
    return null;
  }

  /**
   * Get groups formatted for arrangement operations
   */
  getGroupsForArrangement(
    groups: NodeGroup[],
    nodes: Node[],
    options: Partial<GroupArrangementOptions> = {}
  ): ArrangementGroup[] {
    const opts = { ...DEFAULT_GROUP_ARRANGEMENT_OPTIONS, ...options };

    return groups.map(group => {
      // Calculate center point of the group
      const center = {
        x: group.bounds.x + group.bounds.width / 2,
        y: group.bounds.y + group.bounds.height / 2
      };

      // Determine priority based on group size and connectivity
      const groupNodes = nodes.filter(node => group.nodeIds.includes(node.id));
      const priority = groupNodes.length; // Larger groups get higher priority

      return {
        id: group.id,
        nodeIds: [...group.nodeIds], // Create a copy
        bounds: { ...group.bounds }, // Create a copy
        treatAsUnit: opts.respectGroups,
        center,
        priority
      };
    });
  }

  /**
   * Create arrangement groups for ungrouped nodes
   */
  createArrangementGroupsForUngroupedNodes(
    ungroupedNodes: Node[],
    options: Partial<GroupArrangementOptions> = {}
  ): ArrangementGroup[] {
    const opts = { ...DEFAULT_GROUP_ARRANGEMENT_OPTIONS, ...options };

    if (opts.ungroupedNodeStrategy === 'ignore') {
      return [];
    }

    if (opts.ungroupedNodeStrategy === 'treat-as-individual-groups') {
      return ungroupedNodes.map(node => ({
        id: `temp-group-${node.id}`,
        nodeIds: [node.id],
        bounds: {
          x: node.position.x,
          y: node.position.y,
          width: node.width || 150,
          height: node.height || 40
        },
        treatAsUnit: false,
        center: {
          x: node.position.x + (node.width || 150) / 2,
          y: node.position.y + (node.height || 40) / 2
        },
        priority: 1
      }));
    }

    // For 'arrange-freely', return empty array (handled by arrangement algorithm)
    return [];
  }

  /**
   * Update group bounds after arrangement to ensure all nodes are contained
   */
  updateGroupBoundsAfterArrangement(
    groups: NodeGroup[],
    nodes: Node[],
    options: Partial<BoundsCalculationOptions> = {}
  ): NodeGroup[] {
    return groups.map(group => {
      // Get the current positions of nodes in this group
      const groupNodes = nodes.filter(node => group.nodeIds.includes(node.id));

      if (groupNodes.length === 0) {
        return group; // Return unchanged if no nodes found
      }

      // Calculate new bounds based on current node positions
      const newBounds = this.calculateGroupBounds(group.nodeIds, nodes, options);

      return {
        ...group,
        bounds: newBounds,
        updatedAt: Date.now()
      };
    });
  }

  /**
   * Validate arrangement groups for consistency
   */
  validateArrangementGroups(
    arrangementGroups: ArrangementGroup[],
    nodes: Node[]
  ): GroupValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const allNodeIds = new Set(nodes.map(node => node.id));
    const seenNodeIds = new Set<string>();

    arrangementGroups.forEach((group, index) => {
      // Check if group has valid structure
      if (!group.id || typeof group.id !== 'string') {
        errors.push(`Arrangement group at index ${index} has invalid ID`);
      }

      if (!Array.isArray(group.nodeIds) || group.nodeIds.length === 0) {
        errors.push(`Arrangement group ${group.id} has no node IDs`);
      }

      // Check if all node IDs exist
      group.nodeIds.forEach(nodeId => {
        if (!allNodeIds.has(nodeId)) {
          errors.push(`Node ${nodeId} in group ${group.id} does not exist`);
        }

        // Check for duplicate node assignments
        if (seenNodeIds.has(nodeId)) {
          errors.push(`Node ${nodeId} is assigned to multiple arrangement groups`);
        }
        seenNodeIds.add(nodeId);
      });

      // Validate bounds
      if (!group.bounds || typeof group.bounds !== 'object') {
        errors.push(`Arrangement group ${group.id} has invalid bounds`);
      } else {
        const { x, y, width, height } = group.bounds;
        if (typeof x !== 'number' || typeof y !== 'number' ||
          typeof width !== 'number' || typeof height !== 'number') {
          errors.push(`Arrangement group ${group.id} has invalid bounds values`);
        }
        if (width <= 0 || height <= 0) {
          warnings.push(`Arrangement group ${group.id} has zero or negative dimensions`);
        }
      }

      // Validate center point
      if (!group.center || typeof group.center !== 'object') {
        errors.push(`Arrangement group ${group.id} has invalid center point`);
      } else {
        const { x, y } = group.center;
        if (typeof x !== 'number' || typeof y !== 'number') {
          errors.push(`Arrangement group ${group.id} has invalid center coordinates`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Singleton instance of GroupManager
 */
export const groupManager = new GroupManager();