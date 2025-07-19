import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DrawingProvider, useDrawing } from '../DrawingContext';
import type { DrawingData, Stroke, Shape } from '../../lib/drawing-types';

// Wrapper component for testing
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DrawingProvider>{children}</DrawingProvider>
);

describe('DrawingContext Persistence', () => {
    let result: any;

    beforeEach(() => {
        const { result: hookResult } = renderHook(() => useDrawing(), { wrapper });
        result = hookResult;
    });

    describe('Export Drawing Data', () => {
        it('should export empty drawing data by default', () => {
            const exportedData = result.current.exportDrawingData();

            expect(exportedData).toEqual({
                version: '1.0.0',
                strokes: [],
                shapes: [],
            });
        });

        it('should export drawing data with strokes', () => {
            const testStroke: Stroke = {
                id: 'test-stroke-1',
                points: [
                    { x: 10, y: 10 },
                    { x: 20, y: 20 },
                ],
                tool: 'pen',
                settings: {
                    size: 2,
                    color: '#000000',
                    opacity: 1,
                },
                timestamp: Date.now(),
            };

            act(() => {
                result.current.addStroke(testStroke);
            });

            const exportedData = result.current.exportDrawingData();

            expect(exportedData.strokes).toHaveLength(1);
            expect(exportedData.strokes[0]).toEqual(testStroke);
            expect(exportedData.shapes).toHaveLength(0);
        });

        it('should export drawing data with shapes', () => {
            const testShape: Shape = {
                id: 'test-shape-1',
                type: 'rectangle',
                bounds: {
                    x: 10,
                    y: 10,
                    width: 40,
                    height: 30,
                },
                settings: {
                    strokeColor: '#000000',
                    fillColor: '#ffffff',
                    strokeWidth: 2,
                    filled: false,
                },
                timestamp: Date.now(),
            };

            act(() => {
                result.current.addShape(testShape);
            });

            const exportedData = result.current.exportDrawingData();

            expect(exportedData.shapes).toHaveLength(1);
            expect(exportedData.shapes[0]).toEqual(testShape);
            expect(exportedData.strokes).toHaveLength(0);
        });

        it('should export complex drawing data', () => {
            const testStroke: Stroke = {
                id: 'stroke-1',
                points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
                tool: 'pen',
                settings: { size: 2, color: '#000000', opacity: 1 },
                timestamp: Date.now() - 1000,
            };

            const testShape: Shape = {
                id: 'shape-1',
                type: 'circle',
                bounds: { x: 50, y: 50, width: 30, height: 30 },
                settings: { strokeColor: '#ff0000', fillColor: '#00ff00', strokeWidth: 3, filled: true },
                timestamp: Date.now(),
            };

            act(() => {
                result.current.addStroke(testStroke);
                result.current.addShape(testShape);
            });

            const exportedData = result.current.exportDrawingData();

            expect(exportedData.strokes).toHaveLength(1);
            expect(exportedData.shapes).toHaveLength(1);
            expect(exportedData.strokes[0]).toEqual(testStroke);
            expect(exportedData.shapes[0]).toEqual(testShape);
        });
    });

    describe('Import Drawing Data', () => {
        it('should import empty drawing data', () => {
            const emptyData: DrawingData = {
                version: '1.0.0',
                strokes: [],
                shapes: [],
            };

            act(() => {
                result.current.importDrawingData(emptyData);
            });

            const exportedData = result.current.exportDrawingData();
            expect(exportedData).toEqual(emptyData);
        });

        it('should import drawing data with strokes', () => {
            const strokeData: DrawingData = {
                version: '1.0.0',
                strokes: [
                    {
                        id: 'imported-stroke-1',
                        points: [
                            { x: 15, y: 15 },
                            { x: 25, y: 25 },
                            { x: 35, y: 35 },
                        ],
                        tool: 'pen',
                        settings: {
                            size: 4,
                            color: '#ff0000',
                            opacity: 0.8,
                        },
                        timestamp: Date.now(),
                    },
                ],
                shapes: [],
            };

            act(() => {
                result.current.importDrawingData(strokeData);
            });

            const exportedData = result.current.exportDrawingData();
            expect(exportedData).toEqual(strokeData);
        });

        it('should import drawing data with shapes', () => {
            const shapeData: DrawingData = {
                version: '1.0.0',
                strokes: [],
                shapes: [
                    {
                        id: 'imported-shape-1',
                        type: 'rectangle',
                        bounds: {
                            x: 20,
                            y: 20,
                            width: 50,
                            height: 40,
                        },
                        settings: {
                            strokeColor: '#00ff00',
                            fillColor: '#ffff00',
                            strokeWidth: 3,
                            filled: true,
                        },
                        timestamp: Date.now(),
                    },
                ],
            };

            act(() => {
                result.current.importDrawingData(shapeData);
            });

            const exportedData = result.current.exportDrawingData();
            expect(exportedData).toEqual(shapeData);
        });

        it('should replace existing data when importing', () => {
            // Add initial data
            const initialStroke: Stroke = {
                id: 'initial-stroke',
                points: [{ x: 0, y: 0 }],
                tool: 'pen',
                settings: { size: 1, color: '#000000', opacity: 1 },
                timestamp: Date.now() - 2000,
            };

            act(() => {
                result.current.addStroke(initialStroke);
            });

            // Verify initial data exists
            expect(result.current.exportDrawingData().strokes).toHaveLength(1);

            // Import new data
            const newData: DrawingData = {
                version: '1.0.0',
                strokes: [
                    {
                        id: 'new-stroke',
                        points: [{ x: 100, y: 100 }],
                        tool: 'pen',
                        settings: { size: 5, color: '#ff0000', opacity: 1 },
                        timestamp: Date.now(),
                    },
                ],
                shapes: [],
            };

            act(() => {
                result.current.importDrawingData(newData);
            });

            const exportedData = result.current.exportDrawingData();
            expect(exportedData).toEqual(newData);
            expect(exportedData.strokes[0].id).toBe('new-stroke');
        });

        it('should import complex drawing data', () => {
            const complexData: DrawingData = {
                version: '1.0.0',
                strokes: [
                    {
                        id: 'complex-stroke-1',
                        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
                        tool: 'pen',
                        settings: { size: 2, color: '#000000', opacity: 1 },
                        timestamp: Date.now() - 1000,
                    },
                    {
                        id: 'complex-stroke-2',
                        points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
                        tool: 'pen',
                        settings: { size: 4, color: '#ff0000', opacity: 0.5 },
                        timestamp: Date.now() - 500,
                    },
                ],
                shapes: [
                    {
                        id: 'complex-shape-1',
                        type: 'rectangle',
                        bounds: { x: 50, y: 50, width: 20, height: 15 },
                        settings: { strokeColor: '#0000ff', fillColor: '#ffffff', strokeWidth: 1, filled: false },
                        timestamp: Date.now() - 200,
                    },
                    {
                        id: 'complex-shape-2',
                        type: 'circle',
                        bounds: { x: 100, y: 100, width: 30, height: 30 },
                        settings: { strokeColor: '#00ff00', fillColor: '#ffff00', strokeWidth: 2, filled: true },
                        timestamp: Date.now(),
                    },
                ],
            };

            act(() => {
                result.current.importDrawingData(complexData);
            });

            const exportedData = result.current.exportDrawingData();
            expect(exportedData).toEqual(complexData);
        });
    });

    describe('Data Integrity', () => {
        it('should preserve data through export/import cycle', () => {
            const testStroke: Stroke = {
                id: 'cycle-test-stroke',
                points: [{ x: 5, y: 5 }, { x: 15, y: 15 }],
                tool: 'pen',
                settings: { size: 3, color: '#0000ff', opacity: 0.7 },
                timestamp: Date.now() - 500,
            };

            const testShape: Shape = {
                id: 'cycle-test-shape',
                type: 'line',
                bounds: { x: 30, y: 30, width: 20, height: 10 },
                settings: { strokeColor: '#ff00ff', fillColor: '#00ffff', strokeWidth: 4, filled: false },
                timestamp: Date.now(),
            };

            // Add data
            act(() => {
                result.current.addStroke(testStroke);
                result.current.addShape(testShape);
            });

            // Export data
            const originalData = result.current.exportDrawingData();

            // Clear and import data
            act(() => {
                result.current.clearDrawing();
                result.current.importDrawingData(originalData);
            });

            // Export again and compare
            const roundTripData = result.current.exportDrawingData();
            expect(roundTripData).toEqual(originalData);
        });

        it('should maintain state consistency after import', () => {
            const importData: DrawingData = {
                version: '1.0.0',
                strokes: [
                    {
                        id: 'consistency-stroke',
                        points: [{ x: 1, y: 1 }],
                        tool: 'pen',
                        settings: { size: 1, color: '#111111', opacity: 1 },
                        timestamp: Date.now(),
                    },
                ],
                shapes: [
                    {
                        id: 'consistency-shape',
                        type: 'rectangle',
                        bounds: { x: 10, y: 10, width: 10, height: 10 },
                        settings: { strokeColor: '#222222', fillColor: '#333333', strokeWidth: 1, filled: true },
                        timestamp: Date.now(),
                    },
                ],
            };

            act(() => {
                result.current.importDrawingData(importData);
            });

            // Check that the drawing data state is updated
            expect(result.current.drawingData).toEqual(importData);

            // Check that export returns the same data
            const exportedData = result.current.exportDrawingData();
            expect(exportedData).toEqual(importData);
        });
    });

    describe('Integration with Clear Drawing', () => {
        it('should clear all data including imported data', () => {
            const testData: DrawingData = {
                version: '1.0.0',
                strokes: [
                    {
                        id: 'clear-test-stroke',
                        points: [{ x: 0, y: 0 }],
                        tool: 'pen',
                        settings: { size: 1, color: '#000000', opacity: 1 },
                        timestamp: Date.now(),
                    },
                ],
                shapes: [
                    {
                        id: 'clear-test-shape',
                        type: 'circle',
                        bounds: { x: 0, y: 0, width: 10, height: 10 },
                        settings: { strokeColor: '#000000', fillColor: '#ffffff', strokeWidth: 1, filled: false },
                        timestamp: Date.now(),
                    },
                ],
            };

            // Import data
            act(() => {
                result.current.importDrawingData(testData);
            });

            // Verify data exists
            expect(result.current.exportDrawingData().strokes).toHaveLength(1);
            expect(result.current.exportDrawingData().shapes).toHaveLength(1);

            // Clear drawing
            act(() => {
                result.current.clearDrawing();
            });

            // Verify data is cleared
            const clearedData = result.current.exportDrawingData();
            expect(clearedData.strokes).toHaveLength(0);
            expect(clearedData.shapes).toHaveLength(0);
        });
    });
});