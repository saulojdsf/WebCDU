/**
 * Usage examples and tests for group types to demonstrate proper usage patterns
 */

import { describe, it, expect } from 'vitest';
import {
  type NodeGroup,
  type GroupState,
  type CreateGroupParams,
  type UpdateGroupParams,
  type GroupOperationResult,
  DEFAULT_GROUP_STYLE,
  DEFAULT_GROUP_THEME,
  isNodeGroup,
  isGroupState,
} from '../group-types';

describe('Group Types Usage Examples', () => {
  describe('Creating groups', () => {
    it('should demonstrate basic group creation', () => {
      const createParams: CreateGroupParams = {
        nodeIds: ['node-1', 'node-2', 'node-3'],
        title: 'Control Loop Components',
      };

      const newGroup: NodeGroup = {
        id: `group-${Date.now()}`,
        title: createParams.title || 'Untitled Group',
        nodeIds: createParams.nodeIds,
        bounds: { x: 0, y: 0, width: 200, height: 150 },
        style: createParams.style || DEFAULT_GROUP_STYLE,
        zIndex: -1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(newGroup.nodeIds).toEqual(['node-1', 'node-2', 'node-3']);
      expect(newGroup.title).toBe('Control Loop Components');
      expect(isNodeGroup(newGroup)).toBe(true);
    });

    it('should demonstrate group creation with custom styling', () => {
      const customStyle = {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgb(34, 197, 94)',
        borderRadius: 12,
        borderWidth: 3,
      };

      const createParams: CreateGroupParams = {
        nodeIds: ['input-1', 'processor-1', 'output-1'],
        title: 'Signal Processing Chain',
        style: customStyle,
      };

      expect(createParams.style?.backgroundColor).toBe('rgba(34, 197, 94, 0.1)');
      expect(createParams.style?.borderRadius).toBe(12);
    });
  });

  describe('Managing group state', () => {
    it('should demonstrate group state management', () => {
      const initialState: GroupState = {
        groups: [],
        selectedGroupIds: [],
        groupCounter: 0,
      };

      // Add a group
      const newGroup: NodeGroup = {
        id: 'group-1',
        title: 'Group 1',
        nodeIds: ['node-1', 'node-2'],
        bounds: { x: 0, y: 0, width: 150, height: 100 },
        style: DEFAULT_GROUP_STYLE,
        zIndex: -1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedState: GroupState = {
        ...initialState,
        groups: [...initialState.groups, newGroup],
        groupCounter: initialState.groupCounter + 1,
      };

      expect(updatedState.groups).toHaveLength(1);
      expect(updatedState.groupCounter).toBe(1);
      expect(isGroupState(updatedState)).toBe(true);
    });

    it('should demonstrate group selection management', () => {
      const groupState: GroupState = {
        groups: [
          {
            id: 'group-1',
            title: 'Group 1',
            nodeIds: ['node-1'],
            bounds: { x: 0, y: 0, width: 100, height: 50 },
            style: DEFAULT_GROUP_STYLE,
            zIndex: -1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'group-2',
            title: 'Group 2',
            nodeIds: ['node-2'],
            bounds: { x: 150, y: 0, width: 100, height: 50 },
            style: DEFAULT_GROUP_STYLE,
            zIndex: -1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        selectedGroupIds: [],
        groupCounter: 2,
      };

      // Select a group
      const withSelection: GroupState = {
        ...groupState,
        selectedGroupIds: ['group-1'],
      };

      expect(withSelection.selectedGroupIds).toEqual(['group-1']);

      // Multi-select
      const withMultiSelection: GroupState = {
        ...groupState,
        selectedGroupIds: ['group-1', 'group-2'],
      };

      expect(withMultiSelection.selectedGroupIds).toHaveLength(2);
    });
  });

  describe('Group operations', () => {
    it('should demonstrate group update operations', () => {
      const updateParams: UpdateGroupParams = {
        groupId: 'group-1',
        title: 'Updated Group Title',
        style: {
          borderColor: 'rgb(239, 68, 68)',
        },
      };

      expect(updateParams.groupId).toBe('group-1');
      expect(updateParams.title).toBe('Updated Group Title');
      expect(updateParams.style?.borderColor).toBe('rgb(239, 68, 68)');
    });

    it('should demonstrate operation result handling', () => {
      const successResult: GroupOperationResult = {
        success: true,
        group: {
          id: 'group-1',
          title: 'Successfully Created Group',
          nodeIds: ['node-1', 'node-2'],
          bounds: { x: 0, y: 0, width: 200, height: 100 },
          style: DEFAULT_GROUP_STYLE,
          zIndex: -1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      const errorResult: GroupOperationResult = {
        success: false,
        error: 'Cannot create group: insufficient nodes selected',
      };

      if (successResult.success) {
        expect(successResult.group).toBeDefined();
        expect(successResult.group?.title).toBe('Successfully Created Group');
      }

      if (!errorResult.success) {
        expect(errorResult.error).toContain('insufficient nodes');
      }
    });
  });

  describe('Theme integration', () => {
    it('should demonstrate theme-aware styling', () => {
      const lightThemeGroup: NodeGroup = {
        id: 'group-light',
        title: 'Light Theme Group',
        nodeIds: ['node-1'],
        bounds: { x: 0, y: 0, width: 100, height: 50 },
        style: {
          backgroundColor: DEFAULT_GROUP_THEME.light.backgroundColor,
          borderColor: DEFAULT_GROUP_THEME.light.borderColor,
          borderRadius: 8,
        },
        zIndex: -1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const darkThemeGroup: NodeGroup = {
        id: 'group-dark',
        title: 'Dark Theme Group',
        nodeIds: ['node-2'],
        bounds: { x: 0, y: 0, width: 100, height: 50 },
        style: {
          backgroundColor: DEFAULT_GROUP_THEME.dark.backgroundColor,
          borderColor: DEFAULT_GROUP_THEME.dark.borderColor,
          borderRadius: 8,
        },
        zIndex: -1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(lightThemeGroup.style.backgroundColor).toBe(DEFAULT_GROUP_THEME.light.backgroundColor);
      expect(darkThemeGroup.style.backgroundColor).toBe(DEFAULT_GROUP_THEME.dark.backgroundColor);
      expect(lightThemeGroup.style.borderColor).not.toBe(darkThemeGroup.style.borderColor);
    });
  });

  describe('Validation and type safety', () => {
    it('should demonstrate type validation', () => {
      const validGroup = {
        id: 'group-1',
        title: 'Valid Group',
        nodeIds: ['node-1', 'node-2'],
        bounds: { x: 0, y: 0, width: 100, height: 50 },
        style: {
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderColor: 'rgb(0,0,0)',
          borderRadius: 8,
        },
        zIndex: -1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const invalidGroup = {
        id: 'group-1',
        title: 'Invalid Group',
        // Missing required fields
      };

      expect(isNodeGroup(validGroup)).toBe(true);
      expect(isNodeGroup(invalidGroup)).toBe(false);
    });

    it('should demonstrate state validation', () => {
      const validState = {
        groups: [],
        selectedGroupIds: [],
        groupCounter: 0,
      };

      const invalidState = {
        groups: 'not-an-array',
        selectedGroupIds: [],
        groupCounter: 0,
      };

      expect(isGroupState(validState)).toBe(true);
      expect(isGroupState(invalidState)).toBe(false);
    });
  });
});