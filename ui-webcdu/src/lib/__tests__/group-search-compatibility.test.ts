/**
 * Test compatibility between group types and existing search types
 */

import { describe, it, expect } from 'vitest';
import type { SearchableNode, SearchableEdge } from '../search-types';
import type { NodeGroup, DiagramState } from '../group-types';
import { DEFAULT_GROUP_STYLE } from '../group-types';

describe('Group and Search Types Compatibility', () => {
  it('should work with SearchableNode types', () => {
    const searchableNodes: SearchableNode[] = [
      {
        id: 'node-1',
        position: { x: 0, y: 0 },
        data: {
          id: 'ENTRAD_001',
          Vout: 'X0001',
          type: 'ENTRAD',
        },
        type: 'ENTRAD',
      },
      {
        id: 'node-2',
        position: { x: 200, y: 0 },
        data: {
          id: 'GANHO_001',
          Vin: 'X0001',
          Vout: 'X0002',
          type: 'GANHO',
        },
        type: 'GANHO',
      },
    ];

    const group: NodeGroup = {
      id: 'group-1',
      title: 'Signal Chain',
      nodeIds: ['node-1', 'node-2'],
      bounds: { x: -20, y: -20, width: 240, height: 40 },
      style: DEFAULT_GROUP_STYLE,
      zIndex: -1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Verify group contains searchable nodes
    const nodeIds = new Set(searchableNodes.map(n => n.id));
    group.nodeIds.forEach(id => {
      expect(nodeIds.has(id)).toBe(true);
    });

    // Verify we can find nodes by their data properties
    const entradNode = searchableNodes.find(n => n.data.type === 'ENTRAD');
    const ganhoNode = searchableNodes.find(n => n.data.type === 'GANHO');
    
    expect(entradNode).toBeDefined();
    expect(ganhoNode).toBeDefined();
    expect(group.nodeIds).toContain(entradNode!.id);
    expect(group.nodeIds).toContain(ganhoNode!.id);
  });

  it('should work with SearchableEdge types', () => {
    const searchableEdges: SearchableEdge[] = [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'default',
      },
    ];

    const group: NodeGroup = {
      id: 'group-1',
      title: 'Connected Components',
      nodeIds: ['node-1', 'node-2'],
      bounds: { x: 0, y: 0, width: 200, height: 100 },
      style: DEFAULT_GROUP_STYLE,
      zIndex: -1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Find edges that are internal to the group
    const groupNodeIds = new Set(group.nodeIds);
    const internalEdges = searchableEdges.filter(edge =>
      groupNodeIds.has(edge.source) && groupNodeIds.has(edge.target)
    );

    expect(internalEdges).toHaveLength(1);
    expect(internalEdges[0].source).toBe('node-1');
    expect(internalEdges[0].target).toBe('node-2');
  });

  it('should integrate with DiagramState containing searchable elements', () => {
    const searchableNodes: SearchableNode[] = [
      {
        id: 'input-1',
        position: { x: 0, y: 0 },
        data: { id: 'INPUT_001', Vout: 'X0001' },
        type: 'ENTRAD',
      },
      {
        id: 'gain-1',
        position: { x: 150, y: 0 },
        data: { id: 'GAIN_001', Vin: 'X0001', Vout: 'X0002' },
        type: 'GANHO',
      },
      {
        id: 'output-1',
        position: { x: 300, y: 0 },
        data: { id: 'OUTPUT_001', Vin: 'X0002' },
        type: 'SAIDA',
      },
    ];

    const searchableEdges: SearchableEdge[] = [
      { id: 'edge-1', source: 'input-1', target: 'gain-1' },
      { id: 'edge-2', source: 'gain-1', target: 'output-1' },
    ];

    const groups: NodeGroup[] = [
      {
        id: 'group-1',
        title: 'Processing Chain',
        nodeIds: ['input-1', 'gain-1', 'output-1'],
        bounds: { x: -20, y: -20, width: 340, height: 40 },
        style: DEFAULT_GROUP_STYLE,
        zIndex: -1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const diagramState: DiagramState = {
      nodes: searchableNodes,
      edges: searchableEdges,
      groupState: {
        groups,
        selectedGroupIds: [],
        groupCounter: 1,
      },
      selectedNodeIds: [],
      selectedEdgeIds: [],
    };

    // Verify the diagram state is properly structured
    expect(diagramState.nodes).toHaveLength(3);
    expect(diagramState.edges).toHaveLength(2);
    expect(diagramState.groupState.groups).toHaveLength(1);

    // Verify group contains all nodes
    const group = diagramState.groupState.groups[0];
    expect(group.nodeIds).toHaveLength(3);
    expect(group.nodeIds).toContain('input-1');
    expect(group.nodeIds).toContain('gain-1');
    expect(group.nodeIds).toContain('output-1');

    // Verify we can still search within grouped nodes
    const nodesByType = {
      input: searchableNodes.filter(n => n.type === 'ENTRAD'),
      gain: searchableNodes.filter(n => n.type === 'GANHO'),
      output: searchableNodes.filter(n => n.type === 'SAIDA'),
    };

    expect(nodesByType.input).toHaveLength(1);
    expect(nodesByType.gain).toHaveLength(1);
    expect(nodesByType.output).toHaveLength(1);

    // Verify variable connections work across grouped nodes
    const x0001Producers = searchableNodes.filter(n => n.data.Vout === 'X0001');
    const x0001Consumers = searchableNodes.filter(n => n.data.Vin === 'X0001');
    
    expect(x0001Producers).toHaveLength(1);
    expect(x0001Consumers).toHaveLength(1);
    expect(x0001Producers[0].id).toBe('input-1');
    expect(x0001Consumers[0].id).toBe('gain-1');
  });
});