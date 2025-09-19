import { useRef, useCallback, useEffect } from 'react';
import type { Node, Edge } from 'reactflow';
import { UndoRedoManager } from '@/lib/UndoRedoManager';
import { toast } from 'sonner';

interface UseUndoRedoParams {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  drawingContext?: {
    exportDrawingData: () => any;
    importDrawingData: (data: any) => void;
    clearDrawing: () => void;
  };
  groupStateManager?: {
    getGroupStateForPersistence: () => any;
    loadGroupState: (data: any) => void;
    resetGroupState: () => void;
  };
  parameterContext?: {
    exportParameters: () => any;
    importParameters: (data: any) => void;
    clearParameters: () => void;
  };
}

export function useUndoRedo({
  nodes,
  edges,
  setNodes,
  setEdges,
  drawingContext,
  groupStateManager,
  parameterContext,
}: UseUndoRedoParams) {
  const undoRedoManagerRef = useRef<UndoRedoManager | null>(null);

  // Initialize undo/redo manager - do this only once
  useEffect(() => {
    // Create getter functions that will always return current values
    const getters = {
      getNodes: () => {
        // This will get the current nodes from the closure
        return undoRedoManagerRef.current ? nodes : [];
      },
      getEdges: () => {
        // This will get the current edges from the closure
        return undoRedoManagerRef.current ? edges : [];
      },
      getDrawingData: () => drawingContext?.exportDrawingData() || null,
      getGroupData: () => groupStateManager?.getGroupStateForPersistence() || null,
      getParameters: () => parameterContext?.exportParameters() || {},
    };

    const setters = {
      setNodes,
      setEdges,
      setDrawingData: (data: any) => {
        if (data && drawingContext?.importDrawingData) {
          drawingContext.importDrawingData(data);
        } else if (!data && drawingContext?.clearDrawing) {
          drawingContext.clearDrawing();
        }
      },
      setGroupData: (data: any) => {
        if (data && groupStateManager?.loadGroupState) {
          groupStateManager.loadGroupState(data);
        } else if (!data && groupStateManager?.resetGroupState) {
          groupStateManager.resetGroupState();
        }
      },
      setParameters: (data: any) => {
        if (data && parameterContext?.importParameters) {
          parameterContext.importParameters(data);
        } else if (!data && parameterContext?.clearParameters) {
          parameterContext.clearParameters();
        }
      },
    };

    if (!undoRedoManagerRef.current) {
      undoRedoManagerRef.current = new UndoRedoManager(getters, setters);
    }
  }, [
    setNodes,
    setEdges,
    drawingContext,
    groupStateManager,
    parameterContext,
  ]);

  // Update the getters to use current data whenever nodes/edges change
  useEffect(() => {
    if (undoRedoManagerRef.current) {
      // Update the getters with current data by reassigning the getter functions
      const getters = {
        getNodes: () => nodes,
        getEdges: () => edges,
        getDrawingData: () => drawingContext?.exportDrawingData() || null,
        getGroupData: () => groupStateManager?.getGroupStateForPersistence() || null,
        getParameters: () => parameterContext?.exportParameters() || {},
      };

      // We need to update the manager's getters
      (undoRedoManagerRef.current as any).getters = getters;
    }
  }, [nodes, edges, drawingContext, groupStateManager, parameterContext]);


  const undo = useCallback(() => {
    if (!undoRedoManagerRef.current) {
      console.log('Undo: No undo manager available');
      toast.error('Sistema de desfazer não disponível');
      return false;
    }

    console.log('Undo: canUndo =', undoRedoManagerRef.current.canUndo());
    console.log('Undo: history length =', undoRedoManagerRef.current.getHistory().length);
    console.log('Undo: current index =', undoRedoManagerRef.current.getCurrentIndex());

    const success = undoRedoManagerRef.current.undo();
    if (success) {
      toast.success('Desfazer realizado');
    } else {
      toast.error('Nada para desfazer');
    }
    return success;
  }, []);

  const redo = useCallback(() => {
    if (!undoRedoManagerRef.current) return false;

    const success = undoRedoManagerRef.current.redo();
    if (success) {
      toast.success('Refazer realizado');
    } else {
      toast.error('Nada para refazer');
    }
    return success;
  }, []);

  const canUndo = useCallback(() => {
    return undoRedoManagerRef.current?.canUndo() || false;
  }, []);

  const canRedo = useCallback(() => {
    return undoRedoManagerRef.current?.canRedo() || false;
  }, []);

  const clear = useCallback(() => {
    undoRedoManagerRef.current?.clear();
  }, []);

  // Command execution methods
  const executeAddNode = useCallback((node: Node) => {
    if (!undoRedoManagerRef.current) return;
    console.log('ExecuteAddNode: Adding node', node.id);
    const command = undoRedoManagerRef.current.createAddNodeCommand(node);
    undoRedoManagerRef.current.executeCommand(command);
    console.log('ExecuteAddNode: History length after =', undoRedoManagerRef.current.getHistory().length);
  }, []);

  const executeDeleteNodes = useCallback((nodeIds: string[]) => {
    if (!undoRedoManagerRef.current) return;
    const command = undoRedoManagerRef.current.createDeleteNodesCommand(nodeIds);
    undoRedoManagerRef.current.executeCommand(command);
  }, []);

  const executeMoveNodes = useCallback((
    nodeIds: string[],
    previousPositions: { [nodeId: string]: { x: number; y: number } },
    newPositions: { [nodeId: string]: { x: number; y: number } }
  ) => {
    if (!undoRedoManagerRef.current) return;
    const command = undoRedoManagerRef.current.createMoveNodesCommand(
      nodeIds,
      previousPositions,
      newPositions
    );
    undoRedoManagerRef.current.executeCommand(command);
  }, []);

  const executeAddEdge = useCallback((edge: Edge) => {
    if (!undoRedoManagerRef.current) return;
    const command = undoRedoManagerRef.current.createAddEdgeCommand(edge);
    undoRedoManagerRef.current.executeCommand(command);
  }, []);

  const executeDeleteEdges = useCallback((edgeIds: string[]) => {
    if (!undoRedoManagerRef.current) return;
    const command = undoRedoManagerRef.current.createDeleteEdgesCommand(edgeIds);
    undoRedoManagerRef.current.executeCommand(command);
  }, []);

  const executeUpdateNodeData = useCallback((nodeId: string, previousData: any, newData: any) => {
    if (!undoRedoManagerRef.current) return;
    const command = undoRedoManagerRef.current.createUpdateNodeDataCommand(nodeId, previousData, newData);
    undoRedoManagerRef.current.executeCommand(command);
  }, []);

  const executePasteNodes = useCallback((pastedNodes: Node[], pastedEdges: Edge[]) => {
    if (!undoRedoManagerRef.current) return;
    const command = undoRedoManagerRef.current.createPasteNodesCommand(pastedNodes, pastedEdges);
    undoRedoManagerRef.current.executeCommand(command);
  }, []);

  const executeClearAll = useCallback(() => {
    if (!undoRedoManagerRef.current) return;
    const command = undoRedoManagerRef.current.createClearAllCommand();
    undoRedoManagerRef.current.executeCommand(command);
  }, []);

  const executeCreateGroup = useCallback((groupId: string, nodeIds: string[]) => {
    if (!undoRedoManagerRef.current) return;
    const command = undoRedoManagerRef.current.createCreateGroupCommand(groupId, nodeIds);
    undoRedoManagerRef.current.executeCommand(command);
  }, []);

  const executeDeleteGroup = useCallback((groupId: string, deletedGroupData: any) => {
    if (!undoRedoManagerRef.current) return;
    const command = undoRedoManagerRef.current.createDeleteGroupCommand(groupId, deletedGroupData);
    undoRedoManagerRef.current.executeCommand(command);
  }, []);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    executeAddNode,
    executeDeleteNodes,
    executeMoveNodes,
    executeAddEdge,
    executeDeleteEdges,
    executeUpdateNodeData,
    executePasteNodes,
    executeClearAll,
    executeCreateGroup,
    executeDeleteGroup,
  };
}