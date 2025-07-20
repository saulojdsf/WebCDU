import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { useViewportSync } from '../useViewportSync';
import React from 'react';

// Mock useViewport hook
const mockViewport = { x: 0, y: 0, zoom: 1 };
vi.mock('reactflow', async () => {
    const actual = await vi.importActual('reactflow');
    return {
        ...actual,
        useViewport: () => mockViewport,
    };
});

// Mock performance.now
Object.defineProperty(window, 'performance', {
    value: {
        now: vi.fn(() => Date.now()),
    },
    writable: true,
});

describe('useViewportSync', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReactFlowProvider>{children}</ReactFlowProvider>
    );

    beforeEach(() => {
        vi.clearAllMocks();
        mockViewport.x = 0;
        mockViewport.y = 0;
        mockViewport.zoom = 1;
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    it('should return current viewport state', () => {
        const { result } = renderHook(() => useViewportSync(), { wrapper });

        expect(result.current.viewport).toEqual({ x: 0, y: 0, zoom: 1 });
    });

    it('should call onViewportChange when viewport changes significantly', async () => {
        const onViewportChange = vi.fn();

        const { result, rerender } = renderHook(
            () => useViewportSync({ onViewportChange }),
            { wrapper }
        );

        // Change viewport significantly
        mockViewport.x = 10;
        mockViewport.y = 10;
        mockViewport.zoom = 1.1;

        rerender();

        // Should call the callback
        expect(onViewportChange).toHaveBeenCalledWith({ x: 10, y: 10, zoom: 1.1 });
    });

    it('should not call onViewportChange for insignificant changes', async () => {
        const onViewportChange = vi.fn();

        const { rerender } = renderHook(
            () => useViewportSync({
                onViewportChange,
                significantChangeThreshold: { zoom: 0.1, position: 5 }
            }),
            { wrapper }
        );

        // Change viewport insignificantly
        mockViewport.x = 1;
        mockViewport.y = 1;
        mockViewport.zoom = 1.01;

        rerender();

        // Should not call the callback
        expect(onViewportChange).not.toHaveBeenCalled();
    });

    it('should throttle viewport change callbacks', async () => {
        vi.useFakeTimers();
        const onViewportChange = vi.fn();

        const { rerender } = renderHook(
            () => useViewportSync({
                onViewportChange,
                throttleMs: 100
            }),
            { wrapper }
        );

        // First significant change
        mockViewport.x = 10;
        rerender();
        expect(onViewportChange).toHaveBeenCalledTimes(1);

        // Second change within throttle window
        mockViewport.x = 20;
        rerender();
        expect(onViewportChange).toHaveBeenCalledTimes(1); // Still 1

        // Advance time past throttle window
        act(() => {
            vi.advanceTimersByTime(100);
        });

        expect(onViewportChange).toHaveBeenCalledTimes(2); // Now called again

        vi.useRealTimers();
    });

    it('should detect significant zoom changes', () => {
        const { result, rerender } = renderHook(
            () => useViewportSync({
                significantChangeThreshold: { zoom: 0.05, position: 1 }
            }),
            { wrapper }
        );

        // Initial state - no significant change
        expect(result.current.isSignificantChange()).toBe(false);

        // Significant zoom change
        mockViewport.zoom = 1.1;
        rerender();

        expect(result.current.isSignificantChange()).toBe(true);
    });

    it('should detect significant position changes', () => {
        const { result, rerender } = renderHook(
            () => useViewportSync({
                significantChangeThreshold: { zoom: 0.1, position: 5 }
            }),
            { wrapper }
        );

        // Initial state - no significant change
        expect(result.current.isSignificantChange()).toBe(false);

        // Significant position change
        mockViewport.x = 10;
        mockViewport.y = 10;
        rerender();

        expect(result.current.isSignificantChange()).toBe(true);
    });

    it('should use default throttle and threshold values', () => {
        const onViewportChange = vi.fn();

        const { rerender } = renderHook(
            () => useViewportSync({ onViewportChange }),
            { wrapper }
        );

        // Change by default threshold amounts
        mockViewport.x = 2; // > 1 (default position threshold)
        mockViewport.zoom = 1.02; // > 0.01 (default zoom threshold)

        rerender();

        expect(onViewportChange).toHaveBeenCalled();
    });

    it('should cleanup timeout on unmount', () => {
        vi.useFakeTimers();
        const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

        const { unmount } = renderHook(
            () => useViewportSync({ throttleMs: 100 }),
            { wrapper }
        );

        unmount();

        expect(clearTimeoutSpy).toHaveBeenCalled();

        vi.useRealTimers();
    });

    it('should handle rapid viewport changes efficiently', async () => {
        vi.useFakeTimers();
        const onViewportChange = vi.fn();

        const { rerender } = renderHook(
            () => useViewportSync({
                onViewportChange,
                throttleMs: 50
            }),
            { wrapper }
        );

        // Rapid changes
        for (let i = 1; i <= 10; i++) {
            mockViewport.x = i * 10;
            rerender();
        }

        // Should only call once initially
        expect(onViewportChange).toHaveBeenCalledTimes(1);

        // Advance time to trigger throttled call
        act(() => {
            vi.advanceTimersByTime(50);
        });

        // Should call once more with the latest value
        expect(onViewportChange).toHaveBeenCalledTimes(2);
        expect(onViewportChange).toHaveBeenLastCalledWith({ x: 100, y: 0, zoom: 1 });

        vi.useRealTimers();
    });
});