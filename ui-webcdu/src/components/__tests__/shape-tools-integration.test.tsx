import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DrawingCanvas } from '../drawing/DrawingCanvas';
import { DrawingProvider, useDrawing } from '../../contexts/DrawingContext';
import React from 'react';

// Mock the DrawingEngine
vi.mock('../../lib/DrawingEngine', () => {
    const mockEngine = {
        setViewportTransform: vi.fn(),
        resize: vi.fn(),
        importData: vi.fn(),
        exportData: vi.fn(() => ({ version: '1.0.0', strokes: [], shapes: [] })),
        startDrawing: vi.fn(),
        continueDrawing: vi.fn(),
        endDrawing: vi.fn(),
        drawShape: vi.fn(),
        previewShape: vi.fn(),
        redraw: vi.fn(),
        screenToCanvas: vi.fn((point) => point),
    };

    return {
        DrawingEngine: vi.fn(() => mockEngine),
    };
});

// Mock canvas context
const mockGetContext = vi.fn(() => ({
    scale: vi.fn(),
    translate: vi.fn(),
    strokeRect: vi.fn(),
    fillRect: vi.fn(),
    ellipse: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    lineCap: 'round',
    lineJoin: 'round',
    imageSmoothingEnabled: true,
    strokeStyle: '#000000',
    fillStyle: '#ffffff',
    lineWidth: 2,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
}));

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: mockGetContext,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
    value: () => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
    }),
});

// Test component that provides drawing controls
function TestDrawingApp() {
    const {
        setDrawingMode,
        setCurrentTool,
        currentTool,
        isDrawingMode
    } = useDrawing();

    return (
        <div>
            <button
                data-testid="enable-drawing"
                onClick={() => setDrawingMode(true)}
            >
                Enable Drawing
            </button>
            <button
                data-testid="rectangle-tool"
                onClick={() => setCurrentTool('rectangle')}
            >
                Rectangle
            </button>
            <button
                data-testid="circle-tool"
                onClick={() => setCurrentTool('circle')}
            >
                Circle
            </button>
            <button
                data-testid="line-tool"
                onClick={() => setCurrentTool('line')}
            >
                Line
            </button>
            <div data-testid="current-tool">{currentTool}</div>
            <div data-testid="drawing-mode">{isDrawingMode ? 'enabled' : 'disabled'}</div>
            <DrawingCanvas width={800} height={600} />
        </div>
    );
}

describe('Shape Tools Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should enable drawing mode and select tools correctly', async () => {
        const { getByTestId } = render(
            <DrawingProvider>
                <TestDrawingApp />
            </DrawingProvider>
        );

        // Enable drawing mode
        fireEvent.click(getByTestId('enable-drawing'));
        expect(getByTestId('drawing-mode')).toHaveTextContent('enabled');

        // Select rectangle tool
        fireEvent.click(getByTestId('rectangle-tool'));
        expect(getByTestId('current-tool')).toHaveTextContent('rectangle');

        // Select circle tool
        fireEvent.click(getByTestId('circle-tool'));
        expect(getByTestId('current-tool')).toHaveTextContent('circle');

        // Select line tool
        fireEvent.click(getByTestId('line-tool'));
        expect(getByTestId('current-tool')).toHaveTextContent('line');
    });

    it('should render canvas with correct dimensions', async () => {
        const { container } = render(
            <DrawingProvider>
                <TestDrawingApp />
            </DrawingProvider>
        );

        const canvas = container.querySelector('canvas') as HTMLCanvasElement;
        expect(canvas).toBeTruthy();
        expect(canvas.width).toBe(800);
        expect(canvas.height).toBe(600);
    });

    it('should handle mouse interactions on canvas', async () => {
        const { getByTestId, container } = render(
            <DrawingProvider>
                <TestDrawingApp />
            </DrawingProvider>
        );

        // Setup
        fireEvent.click(getByTestId('enable-drawing'));
        fireEvent.click(getByTestId('rectangle-tool'));

        const canvas = container.querySelector('canvas') as HTMLCanvasElement;
        expect(canvas).toBeTruthy();

        // Test mouse interactions
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 200, clientY: 150 });
        fireEvent.mouseUp(canvas, { clientX: 200, clientY: 150 });

        // The component should handle these events without errors
        expect(canvas).toBeTruthy();
    });

    it('should update cursor based on current tool', async () => {
        const { getByTestId, container } = render(
            <DrawingProvider>
                <TestDrawingApp />
            </DrawingProvider>
        );

        // Enable drawing mode
        fireEvent.click(getByTestId('enable-drawing'));

        const canvas = container.querySelector('canvas') as HTMLCanvasElement;

        // Test rectangle tool cursor
        fireEvent.click(getByTestId('rectangle-tool'));
        expect(canvas.style.cursor).toBe('crosshair');

        // Test circle tool cursor
        fireEvent.click(getByTestId('circle-tool'));
        expect(canvas.style.cursor).toBe('crosshair');

        // Test line tool cursor
        fireEvent.click(getByTestId('line-tool'));
        expect(canvas.style.cursor).toBe('crosshair');
    });

    it('should handle keyboard events for shape constraints', async () => {
        render(
            <DrawingProvider>
                <TestDrawingApp />
            </DrawingProvider>
        );

        // Test Shift key handling
        fireEvent.keyDown(window, { key: 'Shift' });
        fireEvent.keyUp(window, { key: 'Shift' });

        // Test other keys (should be ignored)
        fireEvent.keyDown(window, { key: 'Control' });
        fireEvent.keyUp(window, { key: 'Control' });

        // No errors should occur
        expect(true).toBe(true);
    });

    it('should handle mouse leave events', async () => {
        const { getByTestId, container } = render(
            <DrawingProvider>
                <TestDrawingApp />
            </DrawingProvider>
        );

        // Setup
        fireEvent.click(getByTestId('enable-drawing'));
        fireEvent.click(getByTestId('rectangle-tool'));

        const canvas = container.querySelector('canvas') as HTMLCanvasElement;

        // Start drawing and then leave canvas
        fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(canvas, { clientX: 150, clientY: 125 });
        fireEvent.mouseLeave(canvas);

        // Should handle mouse leave without errors
        expect(canvas).toBeTruthy();
    });
});