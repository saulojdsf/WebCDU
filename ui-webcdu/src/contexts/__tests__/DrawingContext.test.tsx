import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { DrawingProvider, useDrawing } from '../DrawingContext';
import { DrawingTool } from '../../lib/drawing-types';

// Test component to access the context
function TestComponent() {
    const drawing = useDrawing();

    return (
        <div>
            <div data-testid="drawing-mode">{drawing.isDrawingMode.toString()}</div>
            <div data-testid="current-tool">{drawing.currentTool}</div>
            <div data-testid="visibility">{drawing.isVisible.toString()}</div>
            <div data-testid="strokes-count">{drawing.drawingData.strokes.length}</div>
            <div data-testid="shapes-count">{drawing.drawingData.shapes.length}</div>
            <button
                data-testid="toggle-drawing"
                onClick={() => drawing.setDrawingMode(!drawing.isDrawingMode)}
            >
                Toggle Drawing
            </button>
            <button
                data-testid="set-pen"
                onClick={() => drawing.setCurrentTool('pen')}
            >
                Set Pen
            </button>
            <button
                data-testid="clear-drawing"
                onClick={() => drawing.clearDrawing()}
            >
                Clear
            </button>
        </div>
    );
}

describe('DrawingContext', () => {
    it('should provide initial state correctly', () => {
        const { getByTestId } = render(
            <DrawingProvider>
                <TestComponent />
            </DrawingProvider>
        );

        expect(getByTestId('drawing-mode')).toHaveTextContent('false');
        expect(getByTestId('current-tool')).toHaveTextContent('pen');
        expect(getByTestId('visibility')).toHaveTextContent('true');
        expect(getByTestId('strokes-count')).toHaveTextContent('0');
        expect(getByTestId('shapes-count')).toHaveTextContent('0');
    });

    it('should toggle drawing mode', () => {
        const { getByTestId } = render(
            <DrawingProvider>
                <TestComponent />
            </DrawingProvider>
        );

        const toggleButton = getByTestId('toggle-drawing');
        const drawingModeElement = getByTestId('drawing-mode');

        expect(drawingModeElement).toHaveTextContent('false');

        act(() => {
            toggleButton.click();
        });

        expect(drawingModeElement).toHaveTextContent('true');
    });

    it('should change current tool', () => {
        const { getByTestId } = render(
            <DrawingProvider>
                <TestComponent />
            </DrawingProvider>
        );

        const setPenButton = getByTestId('set-pen');
        const currentToolElement = getByTestId('current-tool');

        expect(currentToolElement).toHaveTextContent('pen');

        act(() => {
            setPenButton.click();
        });

        expect(currentToolElement).toHaveTextContent('pen');
    });

    it('should clear drawing data', () => {
        const { getByTestId } = render(
            <DrawingProvider>
                <TestComponent />
            </DrawingProvider>
        );

        const clearButton = getByTestId('clear-drawing');
        const strokesCount = getByTestId('strokes-count');
        const shapesCount = getByTestId('shapes-count');

        expect(strokesCount).toHaveTextContent('0');
        expect(shapesCount).toHaveTextContent('0');

        act(() => {
            clearButton.click();
        });

        expect(strokesCount).toHaveTextContent('0');
        expect(shapesCount).toHaveTextContent('0');
    });

    it('should throw error when used outside provider', () => {
        // Suppress console.error for this test
        const originalError = console.error;
        console.error = () => { };

        expect(() => {
            render(<TestComponent />);
        }).toThrow('useDrawing must be used within a DrawingProvider');

        console.error = originalError;
    });
});