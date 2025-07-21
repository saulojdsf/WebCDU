/**
 * Custom hook for managing group state in the diagram
 * 
 * This hook provides state management for node groups, including:
 * - Group data storage and manipulation
 * - Selected group tracking
 * - Group counter for default naming
 * - Integration with existing ReactFlow state
 */

import { useState, useCallback, useMemo } from 'react';
import type { Node } from 'reactflow';
import type { 
  GroupState, 
  NodeGroup, 
  CreateGroupParams, 
  UpdateGroupParams,
  GroupOperationResult 
} from '@/lib/group-types';
import { groupManager } from '@/lib/GroupManager';

/**
 * Initial group state
 */
const INITIAL_GROUP_STATE: GroupState = {
  groups: [],
  selectedGroupIds: [],
  groupCounter: 0,
};

/**
 * Hook for managing group state
 */
export function useGroupState() {
  const [groupState, setGroupState] = useState<GroupState>(INITIAL_GROUP_STATE);

  /**
   * Get a group by ID
   */
  const getGroupById = useCallback((groupId: string): NodeGroup | undefined => {
    return groupState.groups.find(group => group.id === groupId);
  }, [groupState.groups]);

  /**
   * Get groups that contain a specific node
   */
  const getGroupsContainingNode = useCallback((nodeId: string): NodeGroup[] => {
    return groupState.groups.filter(group => group.nodeIds.includes(nodeId));
  }, [groupState.groups]);

  /**
   * Check if a node is in any group
   */
  const isNodeInGroup = useCallback((nodeId: string): boolean => {
    return groupState.groups.some(group => group.nodeIds.includes(nodeId));
  }, [groupState.groups]);

  /**
   * Get all selected groups
   */
  const getSelectedGroups = useCallback((): NodeGroup[] => {
    return groupState.groups.filter(group => 
      groupState.selectedGroupIds.includes(group.id)
    );
  }, [groupState.groups, groupState.selectedGroupIds]);

  /**
   * Add a new group to the state
   */
  const addGroup = useCallback((group: NodeGroup): void => {
    setGroupState(prev => ({
      ...prev,
      groups: [...prev.groups, group],
      groupCounter: Math.max(prev.groupCounter, parseInt(group.id.replace('group-', '')) || 0),
    }));
  }, []);

  /**
   * Update an existing group
   */
  const updateGroup = useCallback((groupId: string, updates: Partial<NodeGroup>): boolean => {
    let updated = false;
    setGroupState(prev => ({
      ...prev,
      groups: prev.groups.map(group => {
        if (group.id === groupId) {
          updated = true;
          return {
            ...group,
            ...updates,
            updatedAt: Date.now(),
          };
        }
        return group;
      }),
    }));
    return updated;
  }, []);

  /**
   * Remove a group from the state
   */
  const removeGroup = useCallback((groupId: string): boolean => {
    let removed = false;
    setGroupState(prev => {
      const groupExists = prev.groups.some(group => group.id === groupId);
      if (groupExists) {
        removed = true;
        return {
          ...prev,
          groups: prev.groups.filter(group => group.id !== groupId),
          selectedGroupIds: prev.selectedGroupIds.filter(id => id !== groupId),
        };
      }
      return prev;
    });
    return removed;
  }, []);

  /**
   * Select groups (replaces current selection)
   */
  const selectGroups = useCallback((groupIds: string[]): void => {
    setGroupState(prev => ({
      ...prev,
      selectedGroupIds: groupIds,
    }));
  }, []);

  /**
   * Add groups to selection
   */
  const addToSelection = useCallback((groupIds: string[]): void => {
    setGroupState(prev => ({
      ...prev,
      selectedGroupIds: [...new Set([...prev.selectedGroupIds, ...groupIds])],
    }));
  }, []);

  /**
   * Remove groups from selection
   */
  const removeFromSelection = useCallback((groupIds: string[]): void => {
    setGroupState(prev => ({
      ...prev,
      selectedGroupIds: prev.selectedGroupIds.filter(id => !groupIds.includes(id)),
    }));
  }, []);

  /**
   * Clear group selection
   */
  const clearSelection = useCallback((): void => {
    setGroupState(prev => ({
      ...prev,
      selectedGroupIds: [],
    }));
  }, []);

  /**
   * Toggle group selection
   */
  const toggleGroupSelection = useCallback((groupId: string): void => {
    setGroupState(prev => ({
      ...prev,
      selectedGroupIds: prev.selectedGroupIds.includes(groupId)
        ? prev.selectedGroupIds.filter(id => id !== groupId)
        : [...prev.selectedGroupIds, groupId],
    }));
  }, []);

  /**
   * Get next available group counter
   */
  const getNextGroupCounter = useCallback((): number => {
    return groupState.groupCounter + 1;
  }, [groupState.groupCounter]);

  /**
   * Increment group counter
   */
  const incrementGroupCounter = useCallback((): void => {
    setGroupState(prev => ({
      ...prev,
      groupCounter: prev.groupCounter + 1,
    }));
  }, []);

  /**
   * Reset group state to initial state
   */
  const resetGroupState = useCallback((): void => {
    setGroupState(INITIAL_GROUP_STATE);
  }, []);

  /**
   * Load group state from external data
   */
  const loadGroupState = useCallback((newGroupState: GroupState): void => {
    setGroupState(newGroupState);
  }, []);

  /**
   * Get group state for persistence
   */
  const getGroupStateForPersistence = useCallback(() => {
    return {
      ...groupState,
      // Remove any runtime-only properties if needed
    };
  }, [groupState]);

  /**
   * Create a new group using GroupManager
   */
  const createGroup = useCallback((params: CreateGroupParams, nodes: Node[]): GroupOperationResult => {
    // Validate that nodes exist
    const nodeValidation = groupManager.validateNodesExist(params.nodeIds, nodes);
    if (!nodeValidation.isValid) {
      return {
        success: false,
        error: nodeValidation.errors.join(', '),
      };
    }

    // Validate that nodes are not already in other groups
    const groupValidation = groupManager.validateNodesNotInOtherGroups(params.nodeIds, groupState.groups);
    if (!groupValidation.isValid) {
      return {
        success: false,
        error: groupValidation.errors.join(', '),
      };
    }

    // Create the group
    const result = groupManager.createGroup(params);
    if (!result.success || !result.group) {
      return result;
    }

    // Calculate bounds for the new group
    const groupWithBounds = groupManager.updateGroupBounds(result.group, nodes);

    // Add to state
    addGroup(groupWithBounds);
    incrementGroupCounter();

    return {
      success: true,
      group: groupWithBounds,
    };
  }, [groupState.groups, addGroup, incrementGroupCounter]);

  /**
   * Update group title using GroupManager
   */
  const updateGroupTitle = useCallback((groupId: string, newTitle: string): GroupOperationResult => {
    const validation = groupManager.updateGroupTitle(groupId, newTitle);
    if (!validation.success) {
      return validation;
    }

    const updated = updateGroup(groupId, { title: newTitle.trim() });
    return {
      success: updated,
      error: updated ? undefined : 'Group not found',
    };
  }, [updateGroup]);

  /**
   * Delete group using GroupManager
   */
  const deleteGroup = useCallback((groupId: string): GroupOperationResult => {
    const validation = groupManager.deleteGroup(groupId);
    if (!validation.success) {
      return validation;
    }

    const removed = removeGroup(groupId);
    return {
      success: removed,
      error: removed ? undefined : 'Group not found',
    };
  }, [removeGroup]);

  /**
   * Update group bounds for all groups
   */
  const updateAllGroupBounds = useCallback((nodes: Node[]): void => {
    setGroupState(prev => ({
      ...prev,
      groups: prev.groups.map(group => 
        groupManager.updateGroupBounds(group, nodes)
      ),
    }));
  }, []);

  /**
   * Update bounds for a specific group
   */
  const updateGroupBounds = useCallback((groupId: string, nodes: Node[]): boolean => {
    let updated = false;
    setGroupState(prev => ({
      ...prev,
      groups: prev.groups.map(group => {
        if (group.id === groupId) {
          updated = true;
          return groupManager.updateGroupBounds(group, nodes);
        }
        return group;
      }),
    }));
    return updated;
  }, []);

  /**
   * Add nodes to an existing group
   */
  const addNodesToGroup = useCallback((groupId: string, nodeIds: string[], nodes: Node[]): GroupOperationResult => {
    const group = getGroupById(groupId);
    if (!group) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    // Validate that nodes exist
    const nodeValidation = groupManager.validateNodesExist(nodeIds, nodes);
    if (!nodeValidation.isValid) {
      return {
        success: false,
        error: nodeValidation.errors.join(', '),
      };
    }

    // Validate that nodes are not already in other groups
    const groupValidation = groupManager.validateNodesNotInOtherGroups(nodeIds, groupState.groups, groupId);
    if (!groupValidation.isValid) {
      return {
        success: false,
        error: groupValidation.errors.join(', '),
      };
    }

    const result = groupManager.addNodesToGroup(group, nodeIds);
    if (!result.success || !result.group) {
      return result;
    }

    // Update bounds and save
    const groupWithBounds = groupManager.updateGroupBounds(result.group, nodes);
    updateGroup(groupId, groupWithBounds);

    return {
      success: true,
      group: groupWithBounds,
    };
  }, [getGroupById, groupState.groups, updateGroup]);

  /**
   * Remove nodes from an existing group
   */
  const removeNodesFromGroup = useCallback((groupId: string, nodeIds: string[], nodes: Node[]): GroupOperationResult => {
    const group = getGroupById(groupId);
    if (!group) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    const result = groupManager.removeNodesFromGroup(group, nodeIds);
    if (!result.success || !result.group) {
      return result;
    }

    // Update bounds and save
    const groupWithBounds = groupManager.updateGroupBounds(result.group, nodes);
    updateGroup(groupId, groupWithBounds);

    return {
      success: true,
      group: groupWithBounds,
    };
  }, [getGroupById, updateGroup]);

  /**
   * Computed values
   */
  const computedValues = useMemo(() => ({
    hasGroups: groupState.groups.length > 0,
    hasSelection: groupState.selectedGroupIds.length > 0,
    selectedGroupCount: groupState.selectedGroupIds.length,
    totalGroupCount: groupState.groups.length,
    isMultipleGroupsSelected: groupState.selectedGroupIds.length > 1,
  }), [groupState]);

  return {
    // State
    groupState,
    
    // Getters
    getGroupById,
    getGroupsContainingNode,
    isNodeInGroup,
    getSelectedGroups,
    getNextGroupCounter,
    
    // Group management (low-level)
    addGroup,
    updateGroup,
    removeGroup,
    
    // Group management (high-level with GroupManager)
    createGroup,
    updateGroupTitle,
    deleteGroup,
    updateAllGroupBounds,
    updateGroupBounds,
    addNodesToGroup,
    removeNodesFromGroup,
    
    // Selection management
    selectGroups,
    addToSelection,
    removeFromSelection,
    clearSelection,
    toggleGroupSelection,
    
    // Utility functions
    incrementGroupCounter,
    resetGroupState,
    loadGroupState,
    getGroupStateForPersistence,
    
    // Computed values
    ...computedValues,
  };
}

/**
 * Type for the return value of useGroupState hook
 */
export type UseGroupStateReturn = ReturnType<typeof useGroupState>;