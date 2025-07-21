/**
 * Tests for GroupManager service class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Node } from 'reactflow';
import { GroupManager } from '../GroupManager';
import type { CreateGroupParams, NodeGroup } from '../group-types';

describe('GroupManager', () => {
  let groupManager: GroupManager;
  let mockNodes: Node[];

  beforeEach(() => {
    groupManager = new GroupManager();
    mockNodes = [
      {
        id: 'node-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Node 1' },
      },
      {
        id: 'node-2',
        type: 'default',
        position: { x: 200, y: 150 },
        data: { label: 'Node 2' },
      },
      {
        id: 'node-3',
        type: 'default',
        position: { x: 300, y: 200 },
        data: { label: 'Node 3' },
      },
    ];
  });

  describe('createGroup', () => {
    it('should create a valid group with minimum required parameters', () => {
      const params: CreateGroupParams = {
        nodeIds: ['node-1', 'node-2'],
      };

      const result = groupManager.createGroup(params);

      expect(result.success).toBe(true);
      expect(result.group).toBeDefined();
      expect(result.group!.nodeIds).toEqual(['node-1', 'node-2']);
      expect(result.group!.title).toMatch(/^Group \d+$/);
      expect(result.group!.id).toMatch(/^group-\d+-[a-z0-9]+$/);
    });

    it('should create a group with custom title', () => {
      const params: CreateGroupParams = {
        nodeIds: ['node-1', 'node-2'],
        title: 'Custom Group Title',
      };

      const result = groupManager.createGroup(params);

      expect(result.success).toBe(true);
      expect(result.group!.title).toBe('Custom Group Title');
    });

    it('should create a group with custom styling', () => {
      const params: CreateGroupParams = {
        nodeIds: ['node-1', 'node-2'],
        style: {
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderColor: 'red',
        },
      };

      const result = groupManager.createGroup(params);

      expect(result.success).toBe(true);
      expect(result.group!.style.backgroundColor).toBe('rgba(255, 0, 0, 0.1)');
      expect(result.group!.style.borderColor).toBe('red');
    });

    it('should fail with less than 2 nodes', () => {
      const params: CreateGroupParams = {
        nodeIds: ['node-1'],
      };

      const result = groupManager.createGroup(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 nodes');
    });

    it('should fail with empty node array', () => {
      const params: CreateGroupParams = {
        nodeIds: [],
      };

      const result = groupManager.createGroup(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 nodes');
    });

    it('should fail with invalid node IDs', () => {
      const params: CreateGroupParams = {
        nodeIds: ['node-1', ''],
      };

      const result = groupManager.createGroup(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty strings');
    });
  });

  describe('updateGroupTitle', () => {
    it('should validate valid title', () => {
      const result = groupManager.updateGroupTitle('group-1', 'New Title');

      expect(result.success).toBe(true);
    });

    it('should fail with empty title', () => {
      const result = groupManager.updateGroupTitle('group-1', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
    });

    it('should fail with whitespace-only title', () => {
      const result = groupManager.updateGroupTitle('group-1', '   ');

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should fail with title too long', () => {
      const longTitle = 'a'.repeat(101);
      const result = groupManager.updateGroupTitle('group-1', longTitle);

      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot exceed 100 characters');
    });
  });

  describe('deleteGroup', () => {
    it('should validate group deletion', () => {
      const result = groupManager.deleteGroup('group-1');

      expect(result.success).toBe(true);
    });

    it('should fail with empty group ID', () => {
      const result = groupManager.deleteGroup('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty string');
    });
  });

  describe('calculateGroupBounds', () => {
    it('should calculate bounds for multiple nodes', () => {
      const nodeIds = ['node-1', 'node-2'];
      const bounds = groupManager.calculateGroupBounds(nodeIds, mockNodes);

      expect(bounds.x).toBeLessThan(100); // Should include padding
      expect(bounds.y).toBeLessThan(100);
      expect(bounds.width).toBeGreaterThan(150); // Should encompass both nodes
      expect(bounds.height).toBeGreaterThan(40);
    });

    it('should return minimum bounds for empty node list', () => {
      const bounds = groupManager.calculateGroupBounds([], mockNodes);

      expect(bounds.width).toBe(100); // Default minimum width
      expect(bounds.height).toBe(60); // Default minimum height
    });

    it('should respect custom bounds options', () => {
      const nodeIds = ['node-1'];
      const options = {
        padding: 50,
        minWidth: 200,
        minHeight: 100,
      };

      const bounds = groupManager.calculateGroupBounds(nodeIds, mockNodes, options);

      expect(bounds.width).toBeGreaterThanOrEqual(200);
      expect(bounds.height).toBeGreaterThanOrEqual(100);
    });
  });

  describe('updateGroupBounds', () => {
    it('should update group bounds based on current node positions', () => {
      const group: NodeGroup = {
        id: 'group-1',
        title: 'Test Group',
        nodeIds: ['node-1', 'node-2'],
        bounds: { x: 0, y: 0, width: 0, height: 0 },
        style: { backgroundColor: 'blue', borderColor: 'blue', borderRadius: 8 },
        zIndex: -1,
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      };

      const updatedGroup = groupManager.updateGroupBounds(group, mockNodes);

      expect(updatedGroup.bounds.width).toBeGreaterThan(0);
      expect(updatedGroup.bounds.height).toBeGreaterThan(0);
      expect(updatedGroup.updatedAt).toBeGreaterThan(group.updatedAt);
    });
  });

  describe('addNodesToGroup', () => {
    let testGroup: NodeGroup;

    beforeEach(() => {
      testGroup = {
        id: 'group-1',
        title: 'Test Group',
        nodeIds: ['node-1'],
        bounds: { x: 0, y: 0, width: 100, height: 60 },
        style: { backgroundColor: 'blue', borderColor: 'blue', borderRadius: 8 },
        zIndex: -1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    });

    it('should add new nodes to group', () => {
      const result = groupManager.addNodesToGroup(testGroup, ['node-2']);

      expect(result.success).toBe(true);
      expect(result.group!.nodeIds).toContain('node-1');
      expect(result.group!.nodeIds).toContain('node-2');
    });

    it('should fail when adding nodes already in group', () => {
      const result = groupManager.addNodesToGroup(testGroup, ['node-1']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already in the group');
    });

    it('should fail with empty node array', () => {
      const result = groupManager.addNodesToGroup(testGroup, []);

      expect(result.success).toBe(false);
      expect(result.error).toContain('non-empty array');
    });
  });

  describe('removeNodesFromGroup', () => {
    let testGroup: NodeGroup;

    beforeEach(() => {
      testGroup = {
        id: 'group-1',
        title: 'Test Group',
        nodeIds: ['node-1', 'node-2', 'node-3'],
        bounds: { x: 0, y: 0, width: 100, height: 60 },
        style: { backgroundColor: 'blue', borderColor: 'blue', borderRadius: 8 },
        zIndex: -1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    });

    it('should remove nodes from group', () => {
      const result = groupManager.removeNodesFromGroup(testGroup, ['node-3']);

      expect(result.success).toBe(true);
      expect(result.group!.nodeIds).toEqual(['node-1', 'node-2']);
    });

    it('should fail when removing all nodes', () => {
      const result = groupManager.removeNodesFromGroup(testGroup, ['node-1', 'node-2', 'node-3']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('would become empty');
    });

    it('should fail when group would have less than 2 nodes', () => {
      const result = groupManager.removeNodesFromGroup(testGroup, ['node-1', 'node-2']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('at least 2 nodes');
    });
  });

  describe('validation methods', () => {
    it('should validate nodes exist', () => {
      const result = groupManager.validateNodesExist(['node-1', 'node-2'], mockNodes);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing nodes', () => {
      const result = groupManager.validateNodesExist(['node-1', 'missing-node'], mockNodes);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('missing-node');
    });

    it('should validate nodes not in other groups', () => {
      const existingGroups: NodeGroup[] = [
        {
          id: 'existing-group',
          title: 'Existing Group',
          nodeIds: ['node-1'],
          bounds: { x: 0, y: 0, width: 100, height: 60 },
          style: { backgroundColor: 'blue', borderColor: 'blue', borderRadius: 8 },
          zIndex: -1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const result = groupManager.validateNodesNotInOtherGroups(['node-1'], existingGroups);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('already in other groups');
    });

    it('should allow nodes in same group when excluding group ID', () => {
      const existingGroups: NodeGroup[] = [
        {
          id: 'existing-group',
          title: 'Existing Group',
          nodeIds: ['node-1'],
          bounds: { x: 0, y: 0, width: 100, height: 60 },
          style: { backgroundColor: 'blue', borderColor: 'blue', borderRadius: 8 },
          zIndex: -1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const result = groupManager.validateNodesNotInOtherGroups(['node-1'], existingGroups, 'existing-group');

      expect(result.isValid).toBe(true);
    });
  });
});