import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';
import type { Node, Edge } from 'reactflow';

const mockNodes: Node[] = [
  { id: '1', type: 'test', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', type: 'test', position: { x: 100, y: 100 }, data: { label: 'Node 2' } },
];

const mockEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
];

describe('useUndoRedo', () => {
  let setNodes: ReturnType<typeof vi.fn>;
  let setEdges: ReturnType<typeof vi.fn>;
  let drawingContext: any;
  let groupStateManager: any;
  let parameterContext: any;

  beforeEach(() => {
    setNodes = vi.fn();
    setEdges = vi.fn();

    drawingContext = {
      exportDrawingData: vi.fn(() => ({})),
      importDrawingData: vi.fn(),
      clearDrawing: vi.fn(),
    };

    groupStateManager = {
      getGroupStateForPersistence: vi.fn(() => ({})),
      loadGroupState: vi.fn(),
      resetGroupState: vi.fn(),
    };

    parameterContext = {
      exportParameters: vi.fn(() => ({})),
      importParameters: vi.fn(),
      clearParameters: vi.fn(),
    };
  });

  it('should initialize with no undo/redo capability', () => {
    const { result } = renderHook(() =>
      useUndoRedo({
        nodes: mockNodes,
        edges: mockEdges,
        setNodes,
        setEdges,
        drawingContext,
        groupStateManager,
        parameterContext,
      })
    );

    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
  });

  it('should be able to undo after executing a delete command', () => {
    const { result } = renderHook(() =>
      useUndoRedo({
        nodes: mockNodes,
        edges: mockEdges,
        setNodes,
        setEdges,
        drawingContext,
        groupStateManager,
        parameterContext,
      })
    );

    act(() => {
      result.current.executeDeleteNodes(['1']);
    });

    expect(result.current.canUndo()).toBe(true);
    expect(result.current.canRedo()).toBe(false);
  });

  it('should restore previous state when undoing', () => {
    const { result } = renderHook(() =>
      useUndoRedo({
        nodes: mockNodes,
        edges: mockEdges,
        setNodes,
        setEdges,
        drawingContext,
        groupStateManager,
        parameterContext,
      })
    );

    act(() => {
      result.current.executeDeleteNodes(['1']);
    });

    act(() => {
      result.current.undo();
    });

    // Should restore the original nodes
    expect(setNodes).toHaveBeenCalledWith(mockNodes);
    expect(setEdges).toHaveBeenCalledWith(mockEdges);
  });

  it('should enable redo after undo', () => {
    const { result } = renderHook(() =>
      useUndoRedo({
        nodes: mockNodes,
        edges: mockEdges,
        setNodes,
        setEdges,
        drawingContext,
        groupStateManager,
        parameterContext,
      })
    );

    act(() => {
      result.current.executeDeleteNodes(['1']);
    });

    act(() => {
      result.current.undo();
    });

    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(true);
  });

  it('should execute redo correctly', () => {
    const { result } = renderHook(() =>
      useUndoRedo({
        nodes: mockNodes,
        edges: mockEdges,
        setNodes,
        setEdges,
        drawingContext,
        groupStateManager,
        parameterContext,
      })
    );

    act(() => {
      result.current.executeDeleteNodes(['1']);
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.redo();
    });

    // Should apply the delete command again
    const expectedNodes = mockNodes.filter(n => n.id !== '1');
    const expectedEdges = mockEdges.filter(e => e.source !== '1' && e.target !== '1');

    expect(setNodes).toHaveBeenLastCalledWith(expectedNodes);
    expect(setEdges).toHaveBeenLastCalledWith(expectedEdges);
  });

  it('should handle add node command', () => {
    const { result } = renderHook(() =>
      useUndoRedo({
        nodes: mockNodes,
        edges: mockEdges,
        setNodes,
        setEdges,
        drawingContext,
        groupStateManager,
        parameterContext,
      })
    );

    const newNode: Node = {
      id: '3',
      type: 'test',
      position: { x: 200, y: 200 },
      data: { label: 'Node 3' },
    };

    act(() => {
      result.current.executeAddNode(newNode);
    });

    expect(result.current.canUndo()).toBe(true);

    act(() => {
      result.current.undo();
    });

    // Should restore original nodes without the new node
    expect(setNodes).toHaveBeenLastCalledWith(mockNodes);
  });

  it('should clear history when clear is called', () => {
    const { result } = renderHook(() =>
      useUndoRedo({
        nodes: mockNodes,
        edges: mockEdges,
        setNodes,
        setEdges,
        drawingContext,
        groupStateManager,
        parameterContext,
      })
    );

    act(() => {
      result.current.executeDeleteNodes(['1']);
    });

    expect(result.current.canUndo()).toBe(true);

    act(() => {
      result.current.clear();
    });

    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
  });
});