import { renderHook, act } from '@testing-library/react';
import { useNodeDragConstraintIntegration } from '../useNodeDragConstraintIntegration';
import { useNodeDragConstraints } from '../useNodeDragConstraints';
import { useGroupConstraintFeedback } from '../useGroupConstraintFeedback';

import { vi } from 'vitest';

// Mock the dependencies
vi.mock('../useNodeDragConstraints', () => ({
    useNodeDragConstraints: vi.fn()
}));

vi.mock('../useGroupConstraintFeedback', () => ({
    useGroupConstraintFeedback: vi.fn()
}));

describe('useNodeDragConstraintIntegration', () => {
    // Setup mock return values
    const mockCreateConstraintForNode = vi.fn();
    const mockIsNodeWithinGroupBounds = vi.fn();
    const mockExpandGroupToFitNode = vi.fn();
    const mockUpdateNodeDimensions = vi.fn();
    const mockClearConstraintViolation = vi.fn();

    const mockShowConstraintFeedback = vi.fn();
    const mockHideConstraintFeedback = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock useNodeDragConstraints
        (useNodeDragConstraints as any).mockReturnValue({
            createConstraintForNode: mockCreateConstraintForNode,
            isNodeWithinGroupBounds: mockIsNodeWithinGroupBounds,
            expandGroupToFitNode: mockExpandGroupToFitNode,
            updateNodeDimensions: mockUpdateNodeDimensions,
            constraintViolation: null,
            clearConstraintViolation: mockClearConstraintViolation
        });

        // Mock useGroupConstraintFeedback
        (useGroupConstraintFeedback as any).mockReturnValue({
            showConstraintFeedback: mockShowConstraintFeedback,
            hideConstraintFeedback: mockHideConstraintFeedback,
            constraintFeedback: {
                active: false,
                direction: null,
                groupId: null,
                pulsing: false
            }
        });
    });

    it('should initialize with empty dragging node IDs', () => {
        const { result } = renderHook(() => useNodeDragConstraintIntegration([], []));

        expect(result.current.draggingNodeIds).toEqual([]);
    });

    it('should track dragging nodes on drag start and stop', () => {
        const { result } = renderHook(() => useNodeDragConstraintIntegration([], []));

        // Start dragging a node
        act(() => {
            result.current.onNodeDragStart({} as React.MouseEvent, { id: 'node1' } as any);
        });

        expect(result.current.draggingNodeIds).toEqual(['node1']);

        // Start dragging another node
        act(() => {
            result.current.onNodeDragStart({} as React.MouseEvent, { id: 'node2' } as any);
        });

        expect(result.current.draggingNodeIds).toEqual(['node1', 'node2']);

        // Stop dragging the first node
        act(() => {
            result.current.onNodeDragStop({} as React.MouseEvent, { id: 'node1' } as any);
        });

        expect(result.current.draggingNodeIds).toEqual(['node2']);
        expect(mockClearConstraintViolation).toHaveBeenCalledTimes(1);
        expect(mockHideConstraintFeedback).toHaveBeenCalledTimes(1);
    });

    it('should apply position constraints when nodePositionChange is called', () => {
        // Setup mock constraint function
        const mockConstraint = vi.fn().mockImplementation(pos => ({ x: pos.x + 10, y: pos.y }));
        mockCreateConstraintForNode.mockReturnValue({
            nodeId: 'node1',
            groupId: 'group1',
            constrain: mockConstraint
        });

        const { result } = renderHook(() => useNodeDragConstraintIntegration([], []));

        // Call nodePositionChange
        const newPosition = result.current.nodePositionChange(
            { id: 'node1' } as any,
            { x: 100, y: 200 }
        );

        expect(mockCreateConstraintForNode).toHaveBeenCalledWith('node1');
        expect(mockConstraint).toHaveBeenCalledWith({ x: 100, y: 200 });
        expect(newPosition).toEqual({ x: 110, y: 200 });
    });

    it('should show constraint feedback when constraint violation occurs', () => {
        // Setup mock constraint violation
        (useNodeDragConstraints as any).mockReturnValue({
            createConstraintForNode: mockCreateConstraintForNode,
            isNodeWithinGroupBounds: mockIsNodeWithinGroupBounds,
            expandGroupToFitNode: mockExpandGroupToFitNode,
            updateNodeDimensions: mockUpdateNodeDimensions,
            constraintViolation: {
                nodeId: 'node1',
                groupId: 'group1',
                direction: 'right',
                position: { x: 100, y: 200 },
                constrainedPosition: { x: 90, y: 200 }
            },
            clearConstraintViolation: mockClearConstraintViolation
        });

        const { result } = renderHook(() => useNodeDragConstraintIntegration([], []));

        // Start dragging the node
        act(() => {
            result.current.onNodeDragStart({} as React.MouseEvent, { id: 'node1' } as any);
        });

        // Should show constraint feedback
        expect(mockShowConstraintFeedback).toHaveBeenCalledWith('right', 'group1', 1000, true);
    });
});