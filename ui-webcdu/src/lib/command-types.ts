import type { Node, Edge } from 'reactflow';

export interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  drawingData?: any;
  groupData?: any;
  parameters?: any;
}

export interface Command {
  id: string;
  type: string;
  timestamp: number;
  execute(): DiagramState;
  undo(): DiagramState;
  description: string;
}

export interface AddNodeCommand extends Command {
  type: 'ADD_NODE';
  node: Node;
  previousState: DiagramState;
}

export interface DeleteNodesCommand extends Command {
  type: 'DELETE_NODES';
  nodeIds: string[];
  previousState: DiagramState;
  deletedNodes: Node[];
  deletedEdges: Edge[];
}

export interface MoveNodesCommand extends Command {
  type: 'MOVE_NODES';
  nodeIds: string[];
  previousPositions: { [nodeId: string]: { x: number; y: number } };
  newPositions: { [nodeId: string]: { x: number; y: number } };
  previousState: DiagramState;
}

export interface AddEdgeCommand extends Command {
  type: 'ADD_EDGE';
  edge: Edge;
  previousState: DiagramState;
}

export interface DeleteEdgesCommand extends Command {
  type: 'DELETE_EDGES';
  edgeIds: string[];
  previousState: DiagramState;
  deletedEdges: Edge[];
}

export interface UpdateNodeDataCommand extends Command {
  type: 'UPDATE_NODE_DATA';
  nodeId: string;
  previousData: any;
  newData: any;
  previousState: DiagramState;
}

export interface PasteNodesCommand extends Command {
  type: 'PASTE_NODES';
  pastedNodes: Node[];
  pastedEdges: Edge[];
  previousState: DiagramState;
}

export interface ClearAllCommand extends Command {
  type: 'CLEAR_ALL';
  previousState: DiagramState;
}

export interface CreateGroupCommand extends Command {
  type: 'CREATE_GROUP';
  groupId: string;
  nodeIds: string[];
  previousState: DiagramState;
}

export interface DeleteGroupCommand extends Command {
  type: 'DELETE_GROUP';
  groupId: string;
  previousState: DiagramState;
  deletedGroupData: any;
}

export type UndoRedoCommand =
  | AddNodeCommand
  | DeleteNodesCommand
  | MoveNodesCommand
  | AddEdgeCommand
  | DeleteEdgesCommand
  | UpdateNodeDataCommand
  | PasteNodesCommand
  | ClearAllCommand
  | CreateGroupCommand
  | DeleteGroupCommand;