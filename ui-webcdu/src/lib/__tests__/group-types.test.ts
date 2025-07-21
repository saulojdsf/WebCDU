/**
 * Tests for group types to ensure compatibility and correctness
 */

import { describe, it, expect } from 'vitest';
import type { Node, Edge } from 'reactflow';
import {
  type NodeGroup,
  type GroupState,
  type DiagramState,
  type CreateGroupParams,
  type UpdateGroupParams,
  type GroupOperationResult,
  type GroupValidationResult,
  isNodeGroup,
  isGroupState,
  DEFAULT_GROUP_STYLE,
  DEFAULT_BOUNDS_OPTIONS,
  DEFAULT_GROUP_THEME,
} from '../group-types';

describe('Group Types', () => {
  describe('NodeGroup interface', () => {
    it('should define a valid NodeGroup structure', () => {
      const mockGroup: NodeGroup = {
        id: 'group-1',
        title: 'Test Group',
        nodeIds: ['node-1', 'node-2'],
        bounds: { x: 0, y: 0, width: 200, height: 100 },
        style: {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          borderRadius: 8,
        },
        zIndex: -1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(mockGroup.id).toBe('group-1');
      expect(mockGroup.nodeIds).toHaveLength(2);
      expect(mockGroup.bounds.width).toBe(200);
    });
  });

  describe('GroupState interface', () => {
    it('should define a valid GroupState structure', () => {
      const mockGroupState: GroupState = {
        groups: [],
        selectedGroupIds: [],
        groupCounter: 0,
      };

      expect(Array.isArray(mockGroupState.groups)).toBe(true);
      expect(Array.isArray(mockGroupState.selectedGroupIds)).toBe(true);
      expect(typeof mockGroupState.groupCounter).toBe('number');
    });
  });

  describe('DiagramState interface', () => {
    it('should be compatible with ReactFlow types', () => {
      const mockNodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 0, y: 0 },
          data: { label: 'Node 1' },
        },
      ];

      const mockEdges: Edge[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
        },
      ];

      const mockDiagramState: DiagramState = {
        nodes: mockNodes,
        edges: mockEdges,
        groupState: {
          groups: [],
          selectedGroupIds: [],
          groupCounter: 0,
        },
        selectedNodeIds: [],
        selectedEdgeIds: [],
      };

      expect(mockDiagramState.nodes).toEqual(mockNodes);
      expect(mockDiagramState.edges).toEqual(mockEdges);
      expect(mockDiagramState.groupState.groups).toHaveLength(0);
    });
  });

  describe('Type guards', () => {
    describe('isNodeGroup', () => {
      it('should return true for valid NodeGroup', () => {
        const validGroup = {
          id: 'group-1',
          title: 'Test Group',
          nodeIds: ['node-1'],
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

        expect(isNodeGroup(validGroup)).toBe(true);
      });

      it('should return false for invalid objects', () => {
        expect(isNodeGroup(null)).toBe(false);
        expect(isNodeGroup(undefined)).toBe(false);
        expect(isNodeGroup({})).toBe(false);
        expect(isNodeGroup({ id: 'test' })).toBe(false);
      });
    });

    describe('isGroupState', () => {
      it('should return true for valid GroupState', () => {
        const validState = {
          groups: [],
          selectedGroupIds: [],
          groupCounter: 0,
        };

        expect(isGroupState(validState)).toBe(true);
      });

      it('should return false for invalid objects', () => {
        expect(isGroupState(null)).toBe(false);
        expect(isGroupState({})).toBe(false);
        expect(isGroupState({ groups: 'not-array' })).toBe(false);
      });
    });
  });

  describe('Default configurations', () => {
    it('should provide valid default group style', () => {
      expect(DEFAULT_GROUP_STYLE.backgroundColor).toBeDefined();
      expect(DEFAULT_GROUP_STYLE.borderColor).toBeDefined();
      expect(DEFAULT_GROUP_STYLE.borderRadius).toBeGreaterThan(0);
    });

    it('should provide valid default bounds options', () => {
      expect(DEFAULT_BOUNDS_OPTIONS.padding).toBeGreaterThan(0);
      expect(DEFAULT_BOUNDS_OPTIONS.minWidth).toBeGreaterThan(0);
      expect(DEFAULT_BOUNDS_OPTIONS.minHeight).toBeGreaterThan(0);
    });

    it('should provide valid default theme', () => {
      expect(DEFAULT_GROUP_THEME.light.backgroundColor).toBeDefined();
      expect(DEFAULT_GROUP_THEME.dark.backgroundColor).toBeDefined();
      expect(DEFAULT_GROUP_THEME.light.borderColor).toBeDefined();
      expect(DEFAULT_GROUP_THEME.dark.borderColor).toBeDefined();
    });
  });

  describe('Operation interfaces', () => {
    it('should define valid CreateGroupParams', () => {
      const params: CreateGroupParams = {
        nodeIds: ['node-1', 'node-2'],
        title: 'New Group',
        style: {
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
        },
      };

      expect(params.nodeIds).toHaveLength(2);
      expect(params.title).toBe('New Group');
      expect(params.style?.backgroundColor).toBeDefined();
    });

    it('should define valid UpdateGroupParams', () => {
      const params: UpdateGroupParams = {
        groupId: 'group-1',
        title: 'Updated Title',
      };

      expect(params.groupId).toBe('group-1');
      expect(params.title).toBe('Updated Title');
    });

    it('should define valid GroupOperationResult', () => {
      const successResult: GroupOperationResult = {
        success: true,
        group: {
          id: 'group-1',
          title: 'Test',
          nodeIds: [],
          bounds: { x: 0, y: 0, width: 100, height: 50 },
          style: DEFAULT_GROUP_STYLE,
          zIndex: -1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      const errorResult: GroupOperationResult = {
        success: false,
        error: 'Operation failed',
      };

      expect(successResult.success).toBe(true);
      expect(successResult.group).toBeDefined();
      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('Operation failed');
    });
  });
});