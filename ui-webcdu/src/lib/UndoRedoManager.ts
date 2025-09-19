import type { Node, Edge } from 'reactflow';
import type {
  DiagramState,
  UndoRedoCommand,
  AddNodeCommand,
  DeleteNodesCommand,
  MoveNodesCommand,
  AddEdgeCommand,
  DeleteEdgesCommand,
  UpdateNodeDataCommand,
  PasteNodesCommand,
  ClearAllCommand,
  CreateGroupCommand,
  DeleteGroupCommand
} from './command-types';

export class UndoRedoManager {
  private history: UndoRedoCommand[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  private getters: {
    getNodes: () => Node[];
    getEdges: () => Edge[];
    getDrawingData: () => any;
    getGroupData: () => any;
    getParameters: () => any;
  };

  private setters: {
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    setDrawingData: (data: any) => void;
    setGroupData: (data: any) => void;
    setParameters: (data: any) => void;
  };

  constructor(
    getters: {
      getNodes: () => Node[];
      getEdges: () => Edge[];
      getDrawingData: () => any;
      getGroupData: () => any;
      getParameters: () => any;
    },
    setters: {
      setNodes: (nodes: Node[]) => void;
      setEdges: (edges: Edge[]) => void;
      setDrawingData: (data: any) => void;
      setGroupData: (data: any) => void;
      setParameters: (data: any) => void;
    }
  ) {
    this.getters = getters;
    this.setters = setters;
  }

  private getCurrentState(): DiagramState {
    return {
      nodes: JSON.parse(JSON.stringify(this.getters.getNodes())), // Deep copy
      edges: JSON.parse(JSON.stringify(this.getters.getEdges())), // Deep copy
      drawingData: this.getters.getDrawingData(),
      groupData: this.getters.getGroupData(),
      parameters: this.getters.getParameters(),
    };
  }

  private applyState(state: DiagramState): void {
    this.setters.setNodes(state.nodes);
    this.setters.setEdges(state.edges);
    if (state.drawingData) this.setters.setDrawingData(state.drawingData);
    if (state.groupData) this.setters.setGroupData(state.groupData);
    if (state.parameters) this.setters.setParameters(state.parameters);
  }

  private addCommand(command: UndoRedoCommand): void {
    // Remove any commands after current index (for redo)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new command
    this.history.push(command);
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
      this.currentIndex = this.maxHistorySize - 1;
    }
  }

  executeCommand(command: UndoRedoCommand): void {
    const newState = command.execute();
    this.applyState(newState);
    this.addCommand(command);
  }

  undo(): boolean {
    if (this.currentIndex < 0) return false;

    const command = this.history[this.currentIndex];
    const previousState = command.undo();
    this.applyState(previousState);
    this.currentIndex--;
    return true;
  }

  redo(): boolean {
    if (this.currentIndex >= this.history.length - 1) return false;

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    const newState = command.execute();
    this.applyState(newState);
    return true;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  getHistory(): UndoRedoCommand[] {
    return [...this.history];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  // Command factory methods
  createAddNodeCommand(node: Node): AddNodeCommand {
    const previousState = this.getCurrentState();
    return {
      id: `add_node_${Date.now()}_${Math.random()}`,
      type: 'ADD_NODE',
      timestamp: Date.now(),
      node,
      previousState,
      execute: () => {
        const currentState = this.getCurrentState();
        return {
          ...currentState,
          nodes: [...currentState.nodes, node],
        };
      },
      undo: () => previousState,
      description: `Add node ${node.data?.label || node.type}`,
    };
  }

  createDeleteNodesCommand(nodeIds: string[]): DeleteNodesCommand {
    const previousState = this.getCurrentState();
    const deletedNodes = previousState.nodes.filter(n => nodeIds.includes(n.id));
    const deletedEdges = previousState.edges.filter(e =>
      nodeIds.includes(e.source) || nodeIds.includes(e.target)
    );

    return {
      id: `delete_nodes_${Date.now()}_${Math.random()}`,
      type: 'DELETE_NODES',
      timestamp: Date.now(),
      nodeIds,
      previousState,
      deletedNodes,
      deletedEdges,
      execute: () => {
        const currentState = this.getCurrentState();
        return {
          ...currentState,
          nodes: currentState.nodes.filter(n => !nodeIds.includes(n.id)),
          edges: currentState.edges.filter(e =>
            !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
          ),
        };
      },
      undo: () => previousState,
      description: `Delete ${nodeIds.length} node(s)`,
    };
  }

  createMoveNodesCommand(
    nodeIds: string[],
    previousPositions: { [nodeId: string]: { x: number; y: number } },
    newPositions: { [nodeId: string]: { x: number; y: number } }
  ): MoveNodesCommand {
    const previousState = this.getCurrentState();

    return {
      id: `move_nodes_${Date.now()}_${Math.random()}`,
      type: 'MOVE_NODES',
      timestamp: Date.now(),
      nodeIds,
      previousPositions,
      newPositions,
      previousState,
      execute: () => {
        const currentState = this.getCurrentState();
        return {
          ...currentState,
          nodes: currentState.nodes.map(node =>
            nodeIds.includes(node.id) && newPositions[node.id]
              ? { ...node, position: newPositions[node.id] }
              : node
          ),
        };
      },
      undo: () => {
        return {
          ...previousState,
          nodes: previousState.nodes.map(node =>
            nodeIds.includes(node.id) && previousPositions[node.id]
              ? { ...node, position: previousPositions[node.id] }
              : node
          ),
        };
      },
      description: `Move ${nodeIds.length} node(s)`,
    };
  }

  createAddEdgeCommand(edge: Edge): AddEdgeCommand {
    const previousState = this.getCurrentState();

    return {
      id: `add_edge_${Date.now()}_${Math.random()}`,
      type: 'ADD_EDGE',
      timestamp: Date.now(),
      edge,
      previousState,
      execute: () => {
        const currentState = this.getCurrentState();
        return {
          ...currentState,
          edges: [...currentState.edges, edge],
        };
      },
      undo: () => previousState,
      description: `Add edge ${edge.source} → ${edge.target}`,
    };
  }

  createDeleteEdgesCommand(edgeIds: string[]): DeleteEdgesCommand {
    const previousState = this.getCurrentState();
    const deletedEdges = previousState.edges.filter(e => edgeIds.includes(e.id));

    return {
      id: `delete_edges_${Date.now()}_${Math.random()}`,
      type: 'DELETE_EDGES',
      timestamp: Date.now(),
      edgeIds,
      previousState,
      deletedEdges,
      execute: () => {
        const currentState = this.getCurrentState();
        return {
          ...currentState,
          edges: currentState.edges.filter(e => !edgeIds.includes(e.id)),
        };
      },
      undo: () => previousState,
      description: `Delete ${edgeIds.length} edge(s)`,
    };
  }

  createUpdateNodeDataCommand(nodeId: string, previousData: any, newData: any): UpdateNodeDataCommand {
    const previousState = this.getCurrentState();

    return {
      id: `update_node_data_${Date.now()}_${Math.random()}`,
      type: 'UPDATE_NODE_DATA',
      timestamp: Date.now(),
      nodeId,
      previousData,
      newData,
      previousState,
      execute: () => {
        const currentState = this.getCurrentState();
        return {
          ...currentState,
          nodes: currentState.nodes.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...newData } }
              : node
          ),
        };
      },
      undo: () => {
        return {
          ...previousState,
          nodes: previousState.nodes.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...previousData } }
              : node
          ),
        };
      },
      description: `Update node ${nodeId} data`,
    };
  }

  createPasteNodesCommand(pastedNodes: Node[], pastedEdges: Edge[]): PasteNodesCommand {
    const previousState = this.getCurrentState();

    return {
      id: `paste_nodes_${Date.now()}_${Math.random()}`,
      type: 'PASTE_NODES',
      timestamp: Date.now(),
      pastedNodes,
      pastedEdges,
      previousState,
      execute: () => {
        const currentState = this.getCurrentState();
        return {
          ...currentState,
          nodes: [...currentState.nodes, ...pastedNodes],
          edges: [...currentState.edges, ...pastedEdges],
        };
      },
      undo: () => previousState,
      description: `Paste ${pastedNodes.length} node(s)`,
    };
  }

  createClearAllCommand(): ClearAllCommand {
    const previousState = this.getCurrentState();

    return {
      id: `clear_all_${Date.now()}_${Math.random()}`,
      type: 'CLEAR_ALL',
      timestamp: Date.now(),
      previousState,
      execute: () => {
        return {
          nodes: [],
          edges: [],
          drawingData: null,
          groupData: null,
          parameters: {},
        };
      },
      undo: () => previousState,
      description: 'Clear all',
    };
  }

  createCreateGroupCommand(groupId: string, nodeIds: string[]): CreateGroupCommand {
    const previousState = this.getCurrentState();

    return {
      id: `create_group_${Date.now()}_${Math.random()}`,
      type: 'CREATE_GROUP',
      timestamp: Date.now(),
      groupId,
      nodeIds,
      previousState,
      execute: () => {
        // Group creation is handled by group state manager
        return this.getCurrentState();
      },
      undo: () => previousState,
      description: `Create group with ${nodeIds.length} node(s)`,
    };
  }

  createDeleteGroupCommand(groupId: string, deletedGroupData: any): DeleteGroupCommand {
    const previousState = this.getCurrentState();

    return {
      id: `delete_group_${Date.now()}_${Math.random()}`,
      type: 'DELETE_GROUP',
      timestamp: Date.now(),
      groupId,
      previousState,
      deletedGroupData,
      execute: () => {
        // Group deletion is handled by group state manager
        return this.getCurrentState();
      },
      undo: () => previousState,
      description: `Delete group ${groupId}`,
    };
  }
}