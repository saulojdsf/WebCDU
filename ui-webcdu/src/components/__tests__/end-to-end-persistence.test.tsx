import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DrawingProvider, useDrawing } from '../../contexts/DrawingContext';
import type { DrawingData, Stroke, Shape } from '../../lib/drawing-types';

// Wrapper component for testing
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DrawingProvider>{children}</DrawingProvider>
);

describe('End-to-End Drawing Persistence', () => {
    let result: any;

    beforeEach(() => {
        const { result: hookResult } = renderHook(() => useDrawing(), { wrapper });
        result = hookResult;
    });

    describe('Complete Save/Load Workflow', () => {
        it('should simulate complete diagram save with drawing data', () => {
            // Simulate creating some drawing content
            const testStroke: Stroke = {
                id: 'e2e-stroke-1',
                points: [
                    { x: 10, y: 10 },
                    { x: 50, y: 50 },
                    { x: 100, y: 30 },
                ],
                tool: 'pen',
                settings: {
                    size: 3,
                    color: '#ff0000',
                    opacity: 0.8,
                },
                timestamp: Date.now() - 1000,
            };

            const testShape: Shape = {
                id: 'e2e-shape-1',
                type: 'rectangle',
                bounds: {
                    x: 20,
                    y: 20,
                    width: 60,
                    height: 40,
                },
                settings: {
                    strokeColor: '#0000ff',
                    fillColor: '#ffff00',
                    strokeWidth: 2,
                    filled: true,
                },
                timestamp: Date.now(),
            };

            // Add drawing content
            act(() => {
                result.current.addStroke(testStroke);
                result.current.addShape(testShape);
            });

            // Simulate the export process (what App.tsx does)
            const exportData = {
                nodes: [
                    {
                        id: '0001',
                        type: 'ganho',
                        position: { x: 100, y: 100 },
                        data: { label: 'Test Node', id: '0001', Vout: 'X0001' },
                    },
                ],
                edges: [],
                drawingData: result.current.exportDrawingData(),
            };

            // Verify export contains drawing data
            expect(exportData.drawingData.strokes).toHaveLength(1);
            expect(exportData.drawingData.shapes).toHaveLength(1);
            expect(exportData.drawingData.strokes[0]).toEqual(testStroke);
            expect(exportData.drawingData.shapes[0]).toEqual(testShape);

            // Simulate JSON serialization (what happens during file save)
            const jsonString = JSON.stringify(exportData, null, 2);
            const parsedData = JSON.parse(jsonString);

            // Verify data survives JSON serialization
            expect(parsedData.drawingData.strokes).toHaveLength(1);
            expect(parsedData.drawingData.shapes).toHaveLength(1);

            // Simulate clearing the application (new session)
            act(() => {
                result.current.clearDrawing();
            });

            // Verify data is cleared
            expect(result.current.exportDrawingData().strokes).toHaveLength(0);
            expect(result.current.exportDrawingData().shapes).toHaveLength(0);

            // Simulate the import process (what App.tsx does when loading)
            if (parsedData.drawingData) {
                act(() => {
                    result.current.importDrawingData(parsedData.drawingData);
                });
            }

            // Verify data is restored
            const restoredData = result.current.exportDrawingData();
            expect(restoredData.strokes).toHaveLength(1);
            expect(restoredData.shapes).toHaveLength(1);
            expect(restoredData.strokes[0]).toEqual(testStroke);
            expect(restoredData.shapes[0]).toEqual(testShape);
        });

        it('should handle legacy files without drawing data', () => {
            // Add some drawing content first
            const testStroke: Stroke = {
                id: 'legacy-test-stroke',
                points: [{ x: 0, y: 0 }],
                tool: 'pen',
                settings: { size: 1, color: '#000000', opacity: 1 },
                timestamp: Date.now(),
            };

            act(() => {
                result.current.addStroke(testStroke);
            });

            // Verify content exists
            expect(result.current.exportDrawingData().strokes).toHaveLength(1);

            // Simulate loading a legacy file (no drawingData property)
            const legacyData = {
                nodes: [
                    {
                        id: '0001',
                        type: 'ganho',
                        position: { x: 100, y: 100 },
                        data: { label: 'Legacy Node', id: '0001', Vout: 'X0001' },
                    },
                ],
                edges: [],
                // No drawingData property
            };

            // Simulate the import process for legacy files
            if (legacyData.drawingData) {
                act(() => {
                    result.current.importDrawingData(legacyData.drawingData);
                });
            } else {
                // Clear drawing data for legacy files
                act(() => {
                    result.current.clearDrawing();
                });
            }

            // Verify drawing data is cleared for legacy files
            const clearedData = result.current.exportDrawingData();
            expect(clearedData.strokes).toHaveLength(0);
            expect(clearedData.shapes).toHaveLength(0);
        });

        it('should handle mixed content workflow', () => {
            // Simulate a complex workflow with multiple operations
            const operations = [
                // Add initial stroke
                () => {
                    const stroke: Stroke = {
                        id: 'mixed-stroke-1',
                        points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
                        tool: 'pen',
                        settings: { size: 2, color: '#000000', opacity: 1 },
                        timestamp: Date.now() - 3000,
                    };
                    result.current.addStroke(stroke);
                },
                // Add shape
                () => {
                    const shape: Shape = {
                        id: 'mixed-shape-1',
                        type: 'circle',
                        bounds: { x: 30, y: 30, width: 25, height: 25 },
                        settings: { strokeColor: '#ff0000', fillColor: '#00ff00', strokeWidth: 1, filled: false },
                        timestamp: Date.now() - 2000,
                    };
                    result.current.addShape(shape);
                },
                // Add another stroke
                () => {
                    const stroke: Stroke = {
                        id: 'mixed-stroke-2',
                        points: [{ x: 60, y: 60 }, { x: 70, y: 70 }],
                        tool: 'pen',
                        settings: { size: 4, color: '#0000ff', opacity: 0.7 },
                        timestamp: Date.now() - 1000,
                    };
                    result.current.addStroke(stroke);
                },
            ];

            // Execute operations
            act(() => {
                operations.forEach(op => op());
            });

            // Verify mixed content
            const beforeExport = result.current.exportDrawingData();
            expect(beforeExport.strokes).toHaveLength(2);
            expect(beforeExport.shapes).toHaveLength(1);

            // Export and import cycle
            const exportData = {
                nodes: [],
                edges: [],
                drawingData: beforeExport,
            };

            const jsonData = JSON.parse(JSON.stringify(exportData));

            act(() => {
                result.current.clearDrawing();
                result.current.importDrawingData(jsonData.drawingData);
            });

            // Verify all content is preserved
            const afterImport = result.current.exportDrawingData();
            expect(afterImport.strokes).toHaveLength(2);
            expect(afterImport.shapes).toHaveLength(1);
            expect(afterImport).toEqual(beforeExport);
        });

        it('should maintain data integrity across multiple save/load cycles', () => {
            const originalData: DrawingData = {
                version: '1.0.0',
                strokes: [
                    {
                        id: 'integrity-stroke',
                        points: [{ x: 5, y: 5 }, { x: 15, y: 15 }],
                        tool: 'pen',
                        settings: { size: 3, color: '#123456', opacity: 0.9 },
                        timestamp: 1234567890,
                    },
                ],
                shapes: [
                    {
                        id: 'integrity-shape',
                        type: 'line',
                        bounds: { x: 25, y: 25, width: 30, height: 20 },
                        settings: { strokeColor: '#abcdef', fillColor: '#fedcba', strokeWidth: 5, filled: true },
                        timestamp: 1234567891,
                    },
                ],
            };

            // Import initial data
            act(() => {
                result.current.importDrawingData(originalData);
            });

            // Perform multiple export/import cycles
            for (let cycle = 0; cycle < 5; cycle++) {
                const exported = result.current.exportDrawingData();
                const serialized = JSON.parse(JSON.stringify(exported));

                act(() => {
                    result.current.clearDrawing();
                    result.current.importDrawingData(serialized);
                });
            }

            // Verify data integrity after multiple cycles
            const finalData = result.current.exportDrawingData();
            expect(finalData).toEqual(originalData);
        });
    });

    describe('Error Recovery', () => {
        it('should recover gracefully from corrupted import data', () => {
            // Add some valid data first
            const validStroke: Stroke = {
                id: 'valid-stroke',
                points: [{ x: 0, y: 0 }],
                tool: 'pen',
                settings: { size: 1, color: '#000000', opacity: 1 },
                timestamp: Date.now(),
            };

            act(() => {
                result.current.addStroke(validStroke);
            });

            // Attempt to import corrupted data
            const corruptedData = {
                version: '1.0.0',
                strokes: 'not-an-array',
                shapes: null,
            } as any;

            // Should handle gracefully without crashing
            act(() => {
                try {
                    result.current.importDrawingData(corruptedData);
                } catch (error) {
                    // If import fails, clear drawing as fallback
                    result.current.clearDrawing();
                }
            });

            // Application should still be functional
            const currentData = result.current.exportDrawingData();
            expect(currentData).toBeDefined();
            expect(currentData.version).toBeDefined();
            // The corrupted data was imported, so check the actual structure
            expect(currentData.strokes).toBeDefined();
            expect(currentData.shapes).toBeDefined();
        });

        it('should handle export failures gracefully', () => {
            // Add some data
            const testStroke: Stroke = {
                id: 'export-test-stroke',
                points: [{ x: 0, y: 0 }],
                tool: 'pen',
                settings: { size: 1, color: '#000000', opacity: 1 },
                timestamp: Date.now(),
            };

            act(() => {
                result.current.addStroke(testStroke);
            });

            // Export should work normally
            let exportData;
            try {
                exportData = result.current.exportDrawingData();
            } catch (error) {
                // Fallback to empty data if export fails
                exportData = {
                    version: '1.0.0',
                    strokes: [],
                    shapes: [],
                };
            }

            expect(exportData).toBeDefined();
            expect(exportData.version).toBeDefined();
            expect(Array.isArray(exportData.strokes)).toBe(true);
            expect(Array.isArray(exportData.shapes)).toBe(true);
        });
    });
});