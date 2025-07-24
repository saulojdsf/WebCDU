import { renderHook, act } from '@testing-library/react';
import { useCopyPaste } from '../useCopyPaste';
import { Node } from 'reactflow';
import { vi } from 'vitest';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('useCopyPaste', () => {
    const mockSetNodes = vi.fn();
    const mockReactFlowInstance = {
        screenToFlowPosition: vi.fn(() => ({ x: 400, y: 300 })),
        getViewport: vi.fn(() => ({ x: 0, y: 0, zoom: 1 })),
    };

    const sampleNodes: Node[] = [
        {
            id: '0001',
            type: 'ganho',
            position: { x: 100, y: 100 },
            data: { id: '0001', Vout: 'X0001', P1: '2.5' },
        },
        {
            id: '0002',
            type: 'soma',
            position: { x: 200, y: 200 },
            data: { id: '0002', Vout: 'X0002', Vin: '[X0001]' },
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockSetNodes.mockClear();
    });

    it('should copy selected nodes', () => {
        const { result } = renderHook(() =>
            useCopyPaste({
                nodes: sampleNodes,
                setNodes: mockSetNodes,
                selectedNodes: ['0001'],
                reactFlowInstance: mockReactFlowInstance,
            })
        );

        act(() => {
            result.current.copyNodes();
        });

        expect(toast.success).toHaveBeenCalledWith('Copied 1 node');
    });

    it('should copy multiple selected nodes', () => {
        const { result } = renderHook(() =>
            useCopyPaste({
                nodes: sampleNodes,
                setNodes: mockSetNodes,
                selectedNodes: ['0001', '0002'],
                reactFlowInstance: mockReactFlowInstance,
            })
        );

        act(() => {
            result.current.copyNodes();
        });

        expect(toast.success).toHaveBeenCalledWith('Copied 2 nodes');
    });

    it('should show error when no nodes are selected for copy', () => {
        const { result } = renderHook(() =>
            useCopyPaste({
                nodes: sampleNodes,
                setNodes: mockSetNodes,
                selectedNodes: [],
                reactFlowInstance: mockReactFlowInstance,
            })
        );

        act(() => {
            result.current.copyNodes();
        });

        expect(toast.error).toHaveBeenCalledWith('No nodes selected to copy');
    });

    it('should paste copied nodes with unique IDs and Vouts', () => {
        const { result } = renderHook(() =>
            useCopyPaste({
                nodes: sampleNodes,
                setNodes: mockSetNodes,
                selectedNodes: ['0001'],
                reactFlowInstance: mockReactFlowInstance,
            })
        );

        // First copy a node
        act(() => {
            result.current.copyNodes();
        });

        // Then paste it
        act(() => {
            result.current.pasteNodes();
        });

        expect(mockSetNodes).toHaveBeenCalledWith(expect.any(Function));

        // Verify the function passed to setNodes creates new nodes with unique IDs
        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = setNodesCall(sampleNodes);

        expect(newNodes).toHaveLength(3); // Original 2 + 1 pasted

        const pastedNode = newNodes[2];
        expect(pastedNode.id).toBe('0003'); // Next available ID
        expect(pastedNode.data.id).toBe('0003');
        expect(pastedNode.data.Vout).toBe('X0003'); // Unique Vout
        expect(pastedNode.data.P1).toBe('2.5'); // Copied parameter
        expect(pastedNode.data.Vin).toBe(''); // Cleared connection
        expect(pastedNode.position.x).toBe(150); // Original position + offset
        expect(pastedNode.position.y).toBe(150);
    });

    it('should show error when trying to paste with no copied nodes', () => {
        const { result } = renderHook(() =>
            useCopyPaste({
                nodes: sampleNodes,
                setNodes: mockSetNodes,
                selectedNodes: [],
                reactFlowInstance: mockReactFlowInstance,
            })
        );

        act(() => {
            result.current.pasteNodes();
        });

        expect(toast.error).toHaveBeenCalledWith('No nodes to paste');
    });

    it('should show error when ReactFlow instance is not available', () => {
        const { result } = renderHook(() =>
            useCopyPaste({
                nodes: sampleNodes,
                setNodes: mockSetNodes,
                selectedNodes: ['0001'],
                reactFlowInstance: null,
            })
        );

        // Copy first
        act(() => {
            result.current.copyNodes();
        });

        // Try to paste without ReactFlow instance
        act(() => {
            result.current.pasteNodes();
        });

        expect(toast.error).toHaveBeenCalledWith('Canvas not ready for pasting');
    });

    it('should handle Vout conflicts by generating unique names', () => {
        const nodesWithConflict: Node[] = [
            ...sampleNodes,
            {
                id: '0003',
                type: 'ganho',
                position: { x: 300, y: 300 },
                data: { id: '0003', Vout: 'X0004' }, // This will conflict with the next available ID
            },
        ];

        const { result } = renderHook(() =>
            useCopyPaste({
                nodes: nodesWithConflict,
                setNodes: mockSetNodes,
                selectedNodes: ['0001'],
                reactFlowInstance: mockReactFlowInstance,
            })
        );

        // Copy and paste
        act(() => {
            result.current.copyNodes();
        });

        act(() => {
            result.current.pasteNodes();
        });

        const setNodesCall = mockSetNodes.mock.calls[0][0];
        const newNodes = setNodesCall(nodesWithConflict);

        const pastedNode = newNodes[3];
        expect(pastedNode.data.Vout).toBe('X0004_1'); // Unique Vout due to conflict
    });
});