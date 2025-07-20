import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DrawingCanvasOverlay } from '../drawing/DrawingCanvasOverlay';
import { DrawingProvider } from '../../contexts/DrawingContext';
import { ReactFlowProvider } from 'reactflow';

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

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
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

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <ReactFlowProvider>
            <DrawingProvider>
                {component}
            </DrawingProvider>
        </ReactFlowProvider>
    );
};

describe('DrawingCanvasOverlay', () => {
    it('renders overlay container with correct positioning', () => {
        renderWithProviders(<DrawingCanvasOverlay />);

        const overlay = document.querySelector('.absolute.inset-0');
        expect(overlay).toBeInTheDocument();
        expect(overlay).toHaveClass('pointer-events-none');
    });

    it('renders canvas when visible', () => {
        renderWithProviders(<DrawingCanvasOverlay />);

        const canvas = document.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('applies custom className', () => {
        renderWithProviders(<DrawingCanvasOverlay className="custom-class" />);

        const overlay = document.querySelector('.absolute.inset-0');
        expect(overlay).toHaveClass('custom-class');
    });

    it('sets correct z-index for layering', () => {
        renderWithProviders(<DrawingCanvasOverlay />);

        const overlay = document.querySelector('.absolute.inset-0');
        expect(overlay).toHaveStyle({ zIndex: '1' });
    });
});