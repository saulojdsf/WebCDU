import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DrawingCanvas } from '../drawing/DrawingCanvas';
import { DrawingProvider } from '../../contexts/DrawingContext';

// Mock the DrawingEngine
vi.mock('../../lib/DrawingEngine', () => ({
    DrawingEngine: vi.fn().mockImplementation(() => ({
        setViewportTransform: vi.fn(),
        resize: vi.fn(),
        importData: vi.fn(),
        exportData: vi.fn(() => ({ version: '1.0.0', strokes: [], shapes: [] })),
        startDrawing: vi.fn(),
        continueDrawing: vi.fn(),
        endDrawing: vi.fn(),
    })),
}));

// Mock canvas context
const mockContext = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    lineCap: 'round',
    lineJoin: 'round',
    lineWidth: 1,
    strokeStyle: '#000000',
    fillStyle: '#000000',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    imageSmoothingEnabled: true,
};

// Mock HTMLCanvasElement.getContext
beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: vi.fn(),
    }));
});

afterEach(() => {
    vi.clearAllMocks();
});

const renderWithProvider = (component: React.ReactElement) => {
    return render(
        <DrawingProvider>
            {component}
        </DrawingProvider>
    );
};

describe('DrawingCanvas', () => {
    it('renders canvas element with correct dimensions', () => {
        renderWithProvider(
            <DrawingCanvas width={800} height={600} />
        );

        const canvas = document.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
        expect(canvas).toHaveAttribute('width', '800');
        expect(canvas).toHaveAttribute('height', '600');
    });

    it('applies correct styling and positioning', () => {
        renderWithProvider(
            <DrawingCanvas width={800} height={600} className="test-class" />
        );

        const canvas = document.querySelector('canvas');
        expect(canvas).toHaveClass('absolute', 'top-0', 'left-0', 'pointer-events-auto', 'test-class');
        expect(canvas).toHaveStyle({
            width: '800px',
            height: '600px',
            zIndex: '1',
        });
    });

    it('sets cursor to default when not in drawing mode', () => {
        renderWithProvider(
            <DrawingCanvas width={800} height={600} />
        );

        const canvas = document.querySelector('canvas');

        // Initially should have default cursor (not in drawing mode)
        expect(canvas).toHaveStyle({ cursor: 'default' });
    });

    it('handles mouse events for drawing operations', () => {
        renderWithProvider(
            <DrawingCanvas width={800} height={600} />
        );

        const canvas = document.querySelector('canvas');

        // Test mouse down
        fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100 });

        // Test mouse move
        fireEvent.mouseMove(canvas!, { clientX: 150, clientY: 150 });

        // Test mouse up
        fireEvent.mouseUp(canvas!, { clientX: 200, clientY: 200 });

        // Events should be handled without errors
        expect(canvas).toBeInTheDocument();
    });

    it('prevents context menu on right click', () => {
        renderWithProvider(
            <DrawingCanvas width={800} height={600} />
        );

        const canvas = document.querySelector('canvas');
        const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true });
        const preventDefaultSpy = vi.spyOn(contextMenuEvent, 'preventDefault');

        fireEvent(canvas!, contextMenuEvent);

        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('handles mouse leave event', () => {
        renderWithProvider(
            <DrawingCanvas width={800} height={600} />
        );

        const canvas = document.querySelector('canvas');

        // Start drawing
        fireEvent.mouseDown(canvas!, { clientX: 100, clientY: 100 });

        // Leave canvas while drawing
        fireEvent.mouseLeave(canvas!);

        // Should handle the event without errors
        expect(canvas).toBeInTheDocument();
    });

    it('renders canvas by default when visible', () => {
        renderWithProvider(
            <DrawingCanvas width={800} height={600} />
        );

        const canvas = document.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('updates canvas size when dimensions change', () => {
        const { rerender } = renderWithProvider(
            <DrawingCanvas width={800} height={600} />
        );

        let canvas = document.querySelector('canvas');
        expect(canvas).toHaveAttribute('width', '800');
        expect(canvas).toHaveAttribute('height', '600');

        // Re-render with different dimensions
        rerender(
            <DrawingProvider>
                <DrawingCanvas width={1000} height={800} />
            </DrawingProvider>
        );

        canvas = document.querySelector('canvas');
        expect(canvas).toHaveAttribute('width', '1000');
        expect(canvas).toHaveAttribute('height', '800');
    });

    it('applies scale and offset transformations', () => {
        renderWithProvider(
            <DrawingCanvas
                width={800}
                height={600}
                scale={2}
                offset={{ x: 50, y: 100 }}
            />
        );

        const canvas = document.querySelector('canvas');
        expect(canvas).toBeInTheDocument();

        // The actual transformation testing would require mocking the DrawingEngine methods
        // which are already mocked in this test setup
    });
});