import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DrawingProvider } from '../../contexts/DrawingContext';
import { useDrawingState } from '../useDrawingState';
import { Point } from '../../lib/drawing-types';

// Wrapper component for the hook
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DrawingProvider>{children}</DrawingProvider>
);

describe('useDrawingState', () => {
    it('should provide initial state and functions', () => {
        const { result } = renderHook(() => useDrawingState(), { wrapper });

        expect(result.current.isDrawingMode).toBe(false);
        expect(result.current.currentTool).toBe('pen');
        expect(result.current.isVisible).toBe(true);
        expect(typeof result.current.createStroke).toBe('function');
        expect(typeof result.current.createShape).toBe('function');
        expect(typeof result.current.toggleDrawingMode).toBe('function');
    });

    it('should toggle drawing mode', () => {
        const { result } = renderHook(() => useDrawingState(), { wrapper });

        expect(result.current.isDrawingMode).toBe(false);

        act(() => {
            result.current.toggleDrawingMode();
        });

        expect(result.current.isDrawingMode).toBe(true);
    });

    it('should create stroke with current tool settings', () => {
        const { result } = renderHook(() => useDrawingState(), { wrapper });

        const points: Point[] = [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
        ];

        act(() => {
            result.current.setCurrentTool('pen');
        });

        const stroke = result.current.createStroke(points);

        expect(stroke.tool).toBe('pen');
        expect(stroke.points).toEqual(points);
        expect(stroke.settings.size).toBe(2); // Default pen size
        expect(stroke.settings.color).toBe('#000000'); // Default pen color
        expect(typeof stroke.id).toBe('string');
        expect(typeof stroke.timestamp).toBe('number');
    });

    it('should create shape with current tool settings', () => {
        const { result } = renderHook(() => useDrawingState(), { wrapper });

        const bounds = { x: 10, y: 20, width: 100, height: 50 };

        const shape = result.current.createShape('rectangle', bounds);

        expect(shape.type).toBe('rectangle');
        expect(shape.bounds).toEqual(bounds);
        expect(shape.settings.strokeColor).toBe('#000000'); // Default stroke color
        expect(shape.settings.filled).toBe(false); // Default filled state
        expect(typeof shape.id).toBe('string');
        expect(typeof shape.timestamp).toBe('number');
    });

    it('should handle stroke workflow', () => {
        const { result } = renderHook(() => useDrawingState(), { wrapper });

        const startPoint: Point = { x: 0, y: 0 };
        const middlePoint: Point = { x: 5, y: 5 };
        const endPoint: Point = { x: 10, y: 10 };

        // Start stroke
        let currentPoints = result.current.startStroke(startPoint);
        expect(currentPoints).toEqual([startPoint]);

        // Continue stroke
        currentPoints = result.current.continueStroke(currentPoints, middlePoint);
        expect(currentPoints).toEqual([startPoint, middlePoint]);

        currentPoints = result.current.continueStroke(currentPoints, endPoint);
        expect(currentPoints).toEqual([startPoint, middlePoint, endPoint]);

        // Finish stroke
        act(() => {
            const stroke = result.current.finishStroke(currentPoints);
            expect(stroke).toBeTruthy();
            expect(stroke?.points).toEqual(currentPoints);
        });

        // Check that stroke was added to drawing data
        expect(result.current.drawingData.strokes).toHaveLength(1);
    });

    it('should add shape to drawing data', () => {
        const { result } = renderHook(() => useDrawingState(), { wrapper });

        const bounds = { x: 0, y: 0, width: 50, height: 50 };

        act(() => {
            const shape = result.current.addShape('circle', bounds);
            expect(shape.type).toBe('circle');
        });

        expect(result.current.drawingData.shapes).toHaveLength(1);
        expect(result.current.drawingData.shapes[0].type).toBe('circle');
    });

    it('should provide correct cursor styles', () => {
        const { result } = renderHook(() => useDrawingState(), { wrapper });

        act(() => {
            result.current.setCurrentTool('pen');
        });
        expect(result.current.getCursorStyle()).toBe('crosshair');

        act(() => {
            result.current.setCurrentTool('eraser');
        });
        expect(result.current.getCursorStyle()).toBe('crosshair');

        act(() => {
            result.current.setCurrentTool('rectangle');
        });
        expect(result.current.getCursorStyle()).toBe('crosshair');
    });

    it('should identify tool types correctly', () => {
        const { result } = renderHook(() => useDrawingState(), { wrapper });

        act(() => {
            result.current.setCurrentTool('pen');
        });
        expect(result.current.isDrawingTool()).toBe(true);
        expect(result.current.isShapeTool()).toBe(false);

        act(() => {
            result.current.setCurrentTool('rectangle');
        });
        expect(result.current.isDrawingTool()).toBe(false);
        expect(result.current.isShapeTool()).toBe(true);

        act(() => {
            result.current.setCurrentTool('eraser');
        });
        expect(result.current.isDrawingTool()).toBe(true);
        expect(result.current.isShapeTool()).toBe(false);
    });

    it('should throw error when creating stroke with non-drawing tool', () => {
        const { result } = renderHook(() => useDrawingState(), { wrapper });

        act(() => {
            result.current.setCurrentTool('rectangle');
        });

        expect(() => {
            result.current.createStroke([{ x: 0, y: 0 }]);
        }).toThrow('createStroke can only be used with pen or eraser tools');
    });
});