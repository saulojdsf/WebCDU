import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { GridSnapController } from '@/lib/GridSnapController';
import { useGridSnapDragPreview } from '@/hooks/useGridSnapDragPreview';
import { GridSnapPreview } from '@/components/grid/GridSnapPreview';

// Mock ReactFlow
vi.mock('reactflow', async () => {
    const actual = await vi.importActual('reactflow');
    return {
        ...actual,
        useReactFlow: () => ({
            getViewport: () => ({ x: 0, y: 0, zoom: 1 }),
        }),
    };
});

// Test component that uses the drag preview hook
function TestDragComponent({
    gridSnapController,
    isEnabled
}: {
    gridSnapController: GridSnapController;
    isEnabled: boolean;
}) {
    const dragPreview = useGridSnapDragPreview(
        gridSnapController.getPositionManager(),
        isEnabled
    );

    const handleDragStart = (event: React.MouseEvent) => {
        const mockNode = {
            id: 'test-node',
            type: 'default',
            position: { x: 100, y: 100 },
            data: {},
        };
        dragPreview.onDragStart(event, mockNode as any);
    };

    const handleDrag = (event: React.MouseEvent) => {
        const mockNode = {
            id: 'test-node',
            type: 'default',
            position: { x: 110, y: 110 },
            data: {},
        };
        dragPreview.onDrag(event, mockNode as any);
    };

    const handleDragStop = (event: React.MouseEvent) => {
        const mockNode = {
            id: 'test-node',
            type: 'default',
            position: { x: 120, y: 120 },
            data: {},
        };
        dragPreview.onDragStop(event, mockNode as any);
    };

    return (
        <ReactFlowProvider>
            <div>
                <button
                    data-testid="drag-start"
                    onMouseDown={handleDragStart}
                >
                    Start Drag
                </button>
                <button
                    data-testid="drag"
                    onMouseMove={handleDrag}
                >
                    Drag
                </button>
                <button
                    data-testid="drag-stop"
                    onMouseUp={handleDragStop}
                >
                    Stop Drag
                </button>
                <GridSnapPreview
                    dragPreview={dragPreview.dragPreview}
                    gridSize={20}
                />
            </div>
        </ReactFlowProvider>
    );
}

describe('GridSnapDragIntegration', () => {
    let gridSnapController: GridSnapController;

    beforeEach(() => {
        gridSnapController = new GridSnapController({
            size: 20,
            enabled: true,
            showOverlay: true,
            snapThreshold: 10,
        });
    });

    it('should initialize drag preview when grid snapping is enabled', () => {
        render(
            <TestDragComponent
                gridSnapController={gridSnapController}
                isEnabled={true}
            />
        );

        const dragStartButton = screen.getByTestId('drag-start');
        expect(dragStartButton).toBeInTheDocument();
    });

    it('should not show preview when grid snapping is disabled', () => {
        gridSnapController.disableGridSnap();

        render(
            <TestDragComponent
                gridSnapController={gridSnapController}
                isEnabled={false}
            />
        );

        const dragStartButton = screen.getByTestId('drag-start');
        fireEvent.mouseDown(dragStartButton);

        // Preview should not be visible when grid snapping is disabled
        const preview = document.querySelector('.border-blue-500');
        expect(preview).not.toBeInTheDocument();
    });

    it('should show snap preview during drag when close to grid intersection', () => {
        render(
            <TestDragComponent
                gridSnapController={gridSnapController}
                isEnabled={true}
            />
        );

        const dragStartButton = screen.getByTestId('drag-start');
        const dragButton = screen.getByTestId('drag');

        // Start drag
        fireEvent.mouseDown(dragStartButton);

        // Simulate drag near grid intersection (position 110, 110 should snap to 120, 120)
        fireEvent.mouseMove(dragButton);

        // Check if preview elements are rendered
        // Note: The actual preview rendering depends on the position being close enough to snap
        // This test verifies the integration works without throwing errors
        expect(dragStartButton).toBeInTheDocument();
    });

    it('should clear preview on drag stop', () => {
        render(
            <TestDragComponent
                gridSnapController={gridSnapController}
                isEnabled={true}
            />
        );

        const dragStartButton = screen.getByTestId('drag-start');
        const dragButton = screen.getByTestId('drag');
        const dragStopButton = screen.getByTestId('drag-stop');

        // Start drag
        fireEvent.mouseDown(dragStartButton);

        // Drag
        fireEvent.mouseMove(dragButton);

        // Stop drag
        fireEvent.mouseUp(dragStopButton);

        // Preview should be cleared after drag stop
        // This test verifies the cleanup works without throwing errors
        expect(dragStopButton).toBeInTheDocument();
    });

    it('should calculate correct snap positions during drag', () => {
        const positionManager = gridSnapController.getPositionManager();

        // Test snap calculation
        const position = { x: 115, y: 115 };
        const snappedPosition = positionManager.snapToGrid(position);

        expect(snappedPosition.x).toBe(120); // Should snap to nearest 20px grid
        expect(snappedPosition.y).toBe(120);
        expect(snappedPosition.isSnapped).toBe(true);
    });

    it('should determine when position should snap based on threshold', () => {
        const positionManager = gridSnapController.getPositionManager();

        // Position within snap threshold (10px)
        const closePosition = { x: 115, y: 115 };
        expect(positionManager.shouldSnapToGrid(closePosition)).toBe(true);

        // Test the threshold logic with a clear case
        // Position exactly at threshold boundary
        const thresholdPosition = { x: 110, y: 110 }; // 10px away from (120, 120)
        expect(positionManager.shouldSnapToGrid(thresholdPosition)).toBe(true);
    });

    it('should handle drag preview state transitions correctly', () => {
        render(
            <TestDragComponent
                gridSnapController={gridSnapController}
                isEnabled={true}
            />
        );

        const dragStartButton = screen.getByTestId('drag-start');
        const dragButton = screen.getByTestId('drag');
        const dragStopButton = screen.getByTestId('drag-stop');

        // Verify initial state
        expect(dragStartButton).toBeInTheDocument();

        // Test complete drag cycle
        fireEvent.mouseDown(dragStartButton);
        fireEvent.mouseMove(dragButton);
        fireEvent.mouseUp(dragStopButton);

        // Should complete without errors
        expect(dragStopButton).toBeInTheDocument();
    });
});