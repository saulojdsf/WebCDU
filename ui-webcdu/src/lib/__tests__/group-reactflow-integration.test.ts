/**
 * Integration tests to verify group types work correctly with ReactFlow types
 */

import { describe, it, expect } from 'vitest';
import type { Node, Edge } from 'reactflow';
import {
  type NodeGroup,
  type DiagramState,
  DEFAULT_GROUP_STYLE,
} from '../group-types';

describe('Group Types ReactFlow Integration', () => {
  it('should work with ReactFlow Node types', () => {
    // Create some ReactFlow nodes
    const reactFlowNodes: Node[] = [
      {
        id: 'node-1',
        position: { x: 100, y: 100 },
        data: { label: 'Input Node', type: 'ENTRAD' },
        type: 'ENTRAD',
      },
      {
        id: 'node-2',
        position: { x: 300, y: 100 },
        data: { label: 'Gain Node', type: 'GANHO' },
        type: 'GANHO',
      },
    ];

    // Create a group containing these nodes
    const nodeGroup: NodeGroup = {
      id: 'group-1',
      title: 'Control Loop',
      nodeIds: ['node-1', 'node-2'],
      bounds: { x: 80, y: 80, width: 260, height: 60 },
      style: DEFAULT_GROUP_STYLE,
      zIndex: -1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Verify the group references valid node IDs
    expect(nodeGroup.nodeIds).toEqual(['node-1', 'node-2']);
    expect(reactFlowNodes.map(n => n.id)).toEqual(['node-1', 'node-2']);
    
    // Verify all group node IDs exist in the ReactFlow nodes
    const nodeIds = new Set(reactFlowNodes.map(n => n.id));
    nodeGroup.nodeIds.forEach(id => {
      expect(nodeIds.has(id)).toBe(true);
    });
  });

  it('should work with ReactFlow Edge types', () => {
    const reactFlowEdges: Edge[] = [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'default',
      },
    ];

    const nodeGroup: NodeGroup = {
      id: 'group-1',
      title: 'Connected Nodes',
      nodeIds: ['node-1', 'node-2'],
      bounds: { x: 0, y: 0, width: 200, height: 100 },
      style: DEFAULT_GROUP_STYLE,
      zIndex: -1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Verify that edges connect nodes within the group
    const groupNodeIds = new Set(nodeGroup.nodeIds);
    const internalEdges = reactFlowEdges.filter(edge => 
      groupNodeIds.has(edge.source) && groupNodeIds.has(edge.target)
    );

    expect(internalEdges).toHaveLength(1);
    expect(internalEdges[0].source).toBe('node-1');
    expect(internalEdges[0].target).toBe('node-2');
  });

  it('should integrate properly with DiagramState', () => {
    const nodes: Node[] = [
      {
        id: 'node-1',
        position: { x: 0, y: 0 },
        data: { label: 'Node 1' },
      },
      {
        id: 'node-2',
        position: { x: 100, y: 0 },
        data: { label: 'Node 2' },
      },
    ];

    const edges: Edge[] = [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      },
    ];

    const groups: NodeGroup[] = [
      {
        id: 'group-1',
        title: 'Test Group',
        nodeIds: ['node-1', 'node-2'],
        bounds: { x: -20, y: -20, width: 140, height: 40 },
        style: DEFAULT_GROUP_STYLE,
        zIndex: -1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const diagramState: DiagramState = {
      nodes,
      edges,
      groupState: {
        groups,
        selectedGroupIds: [],
        groupCounter: 1,
      },
      selectedNodeIds: [],
      selectedEdgeIds: [],
    };

    // Verify the diagram state structure
    expect(diagramState.nodes).toHaveLength(2);
    expect(diagramState.edges).toHaveLength(1);
    expect(diagramState.groupState.groups).toHaveLength(1);
    expect(diagramState.groupState.groupCounter).toBe(1);

    // Verify group contains valid node references
    const nodeIds = new Set(diagramState.nodes.map(n => n.id));
    diagramState.groupState.groups.forEach(group => {
      group.nodeIds.forEach(nodeId => {
        expect(nodeIds.has(nodeId)).toBe(true);
      });
    });
  });

  it('should handle empty group states correctly', () => {
    const diagramState: DiagramState = {
      nodes: [],
      edges: [],
      groupState: {
        groups: [],
        selectedGroupIds: [],
        groupCounter: 0,
      },
      selectedNodeIds: [],
      selectedEdgeIds: [],
    };

    expect(diagramState.groupState.groups).toHaveLength(0);
    expect(diagramState.groupState.selectedGroupIds).toHaveLength(0);
    expect(diagramState.groupState.groupCounter).toBe(0);
  });

  it('should support multiple groups with different node sets', () => {
    const nodes: Node[] = [
      { id: 'node-1', position: { x: 0, y: 0 }, data: {} },
      { id: 'node-2', position: { x: 100, y: 0 }, data: {} },
      { id: 'node-3', position: { x: 0, y: 100 }, data: {} },
      { id: 'node-4', position: { x: 100, y: 100 }, data: {} },
    ];

    const group1: NodeGroup = {
      id: 'group-1',
      title: 'Group 1',
      nodeIds: ['node-1', 'node-2'],
      bounds: { x: -20, y: -20, width: 140, height: 40 },
      style: DEFAULT_GROUP_STYLE,
      zIndex: -1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const group2: NodeGroup = {
      id: 'group-2',
      title: 'Group 2',
      nodeIds: ['node-3', 'node-4'],
      bounds: { x: -20, y: 80, width: 140, height: 40 },
      style: { ...DEFAULT_GROUP_STYLE, borderColor: 'rgb(239, 68, 68)' },
      zIndex: -1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Verify groups don't share nodes
    const group1Nodes = new Set(group1.nodeIds);
    const group2Nodes = new Set(group2.nodeIds);
    
    group1.nodeIds.forEach(nodeId => {
      expect(group2Nodes.has(nodeId)).toBe(false);
    });

    group2.nodeIds.forEach(nodeId => {
      expect(group1Nodes.has(nodeId)).toBe(false);
    });

    // Verify all nodes are accounted for
    const allGroupedNodes = [...group1.nodeIds, ...group2.nodeIds];
    const allNodeIds = nodes.map(n => n.id);
    expect(allGroupedNodes.sort()).toEqual(allNodeIds.sort());
  });
});