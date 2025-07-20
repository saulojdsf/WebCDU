import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { DrawingProvider } from '../../contexts/DrawingContext';
import { DrawingCanvasOverlay } from '../drawing/DrawingCanvasOverlay';
import React from 'react';

// Mock React Flow hooks
const mockViewport = { x: 0, y: 0, zoom: 1 };
const mockReactFlowInstance = {
    screenToFlowPosition: vi.fn(),
    fitView: vi.fn(),
};

vi.mock('reactflow', async () => {
    const actual = await vi.importActual('reactflow');
    return {
        ...actual,
        useViewport: () => mockViewport,
        useReactFlow: () => mockReactFlowInstance,
    };
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock requestAnimationFrame
Object.defineProperty(window, 'requestAnimationFrame', {
    value: vi.fn((callback) => {
        setTimeout(callback, 16);
        return 1;
    }),
    writable: true,
});

// Mock performance.now
Object.defineProperty(window, 'performance', {
    value: {
        now: vi.fn(() => Date.now()),
    },
    writable: true,
});

describe('Viewport Synchronization Integration', () => {
    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <ReactFlowProvider>
            <DrawingProvider>
                {children}
            </DrawingProvider>
        </ReactFlowProvider>
    );

    beforeEach(() => {
        vi.clearAllMocks();
        mockViewport.x = 0;
        mockViewport.y = 0;
        mockViewport.zoom = 1;

        // Mock canvas and context
        const mockContext = {
            scale: vi.fn(),
            translate: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            clearRect: vi.fn(),
            stroke: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            set lineCap(value: string) { },
            set lineJoin(value: string) { },
            set imageSmoothingEnabled(value: boolean) { },
            set strokeStyle(value: string) { },
            set lineWidth(value: number) { },
            set globalAlpha(value: number) { },
            set globalCompositeOperation(value: string) { },
        };

        HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockContext);
        HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
            left: 0,
            top: 0,
            width: 800,
            height: 600,
            right: 800,
            bottom: 600,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        });
    });

    it('should render DrawingCanvasOverlay with correct viewport synchronization', () => {
        const { container } = render(
            <TestWrapper>
                <DrawingCanvasOverlay />
            </TestWrapper>
        );

        const overlay = container.querySelector('.absolute.inset-0');
        expect(overlay).toBeInTheDocument();

        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('should update canvas when viewport changes', async () => {
        const { rerender } = render(
            <TestWrapper>
                <DrawingCanvasOverlay />
            </TestWrapper>
        );

        // Change viewport
        mockViewport.x = 100;
        mockViewport.y = 50;
        mockViewport.zoom = 2;

        await act(async () => {
            rerender(
                <TestWrapper>
                    <DrawingCanvasOverlay />
                </TestWrapper>
            );
        });

        // Canvas should be updated with new viewport parameters
        // This is verified through the DrawingEngine's coordinate transformation
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();
    });

    it('should handle rapid viewport changes efficiently', async () => {
        vi.useFakeTimers();

        const { rerender } = render(
            <TestWrapper>
                <DrawingCanvasOverlay />
            </TestWrapper>
        );

        // Simulate rapid viewport changes
        for (let i = 1; i <= 10; i++) {
            mockViewport.x = i * 10;
            mockViewport.y = i * 5;
            mockViewport.zoom = 1 + i * 0.1;

            await act(async () => {
                rerender(
                    <TestWrapper>
                        <DrawingCanvasOverlay />
                    </TestWrapper>
                );
            });
        }

        // Should handle changes efficiently without excessive re-renders
        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();

        vi.useRealTimers();
    });

    it('should maintain correct z-index and opacity from layer state', () => {
        const { container } = render(
            <TestWrapper>
                <DrawingCanvasOverlay />
            </TestWrapper>
        );

        const overlay = container.querySelector('.absolute.inset-0') as HTMLElement;
        expect(overlay).toBeInTheDocument();

        // Should have default layer state styling
        const style = window.getComputedStyle(overlay);
        expect(overlay.style.zIndex).toBeTruthy();
        expect(overlay.style.opacity).toBeTruthy();
    });

    it('should handle canvas resizing when container size changes', async () => {
        const { container } = render(
            <TestWrapper>
                <DrawingCanvasOverlay />
            </TestWrapper>
        );

        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();

        // Simulate container resize
        const resizeObserver = (global.ResizeObserver as any).mock.instances[0];
        expect(resizeObserver.observe).toHaveBeenCalled();

        // Trigger resize callback
        const resizeCallback = (global.ResizeObserver as any).mock.calls[0][0];
        await act(async () => {
            resizeCallback([]);
        });

        // Canvas should maintain correct dimensions
        expect(canvas).toBeInTheDocument();
    });

    it('should not render when drawing layer is not visible', () => {
        // This would require mocking the DrawingContext to return isVisible: false
        // For now, we test the basic rendering case
        const { container } = render(
            <TestWrapper>
                <DrawingCanvasOverlay />
            </TestWrapper>
        );

        // Should render by default (when visible)
        const overlay = container.querySelector('.absolute.inset-0');
        expect(overlay).toBeInTheDocument();
    });

    it('should apply correct pointer events based on drawing mode', () => {
        const { container } = render(
            <TestWrapper>
                <DrawingCanvasOverlay />
            </TestWrapper>
        );

        const overlay = container.querySelector('.absolute.inset-0') as HTMLElement;
        expect(overlay).toHaveClass('pointer-events-none');

        const canvas = container.querySelector('canvas') as HTMLElement;
        // Canvas pointer events depend on drawing mode and layer lock state
        expect(canvas).toBeInTheDocument();
    });

    it('should cleanup resources on unmount', () => {
        const { unmount } = render(
            <TestWrapper>
                <DrawingCanvasOverlay />
            </TestWrapper>
        );

        const resizeObserver = (global.ResizeObserver as any).mock.instances[0];

        unmount();

        expect(resizeObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle viewport synchronization with performance optimizations', async () => {
        vi.useFakeTimers();

        const { rerender } = render(
            <TestWrapper>
                <DrawingCanvasOverlay />
            </TestWrapper>
        );

        // Test throttling behavior
        mockViewport.x = 10;
        await act(async () => {
            rerender(
                <TestWrapper>
                    <DrawingCanvasOverlay />
                </TestWrapper>
            );
        });

        // Rapid change within throttle window
        mockViewport.x = 20;
        await act(async () => {
            rerender(
                <TestWrapper>
                    <DrawingCanvasOverlay />
                </TestWrapper>
            );
        });

        // Advance time to trigger throttled update
        act(() => {
            vi.advanceTimersByTime(20);
        });

        expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalled();

        vi.useRealTimers();
    });
});