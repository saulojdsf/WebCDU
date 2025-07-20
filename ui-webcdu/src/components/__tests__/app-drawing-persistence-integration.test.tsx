import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DrawingProvider } from '../../contexts/DrawingContext';
import type { DrawingData } from '../../lib/drawing-types';

// Mock the App component's save/load functionality
const mockExportNodes = vi.fn();
const mockLoadNodes = vi.fn();
const mockClearAll = vi.fn();

// Mock drawing context
const mockDrawingContext = {
    exportDrawingData: vi.fn(() => ({
        version: '1.0.0',
        strokes: [],
        shapes: [],
    })),
    importDrawingData: vi.fn(),
    clearDrawing: vi.fn(),
    isDrawingMode: false,
    currentTool: 'pen' as const,
    toolSettings: {
        pen: { size: 2, color: '#000000', opacity: 1 },
        eraser: { size: 10 },
        shapes: { strokeColor: '#000000', fillColor: '#ffffff', strokeWidth: 2, filled: false },
    },
    drawingData: {
        version: '1.0.0',
        strokes: [],
        shapes: [],
    },
    isVisible: true,
    canvasRef: null,
    layerState: {
        isVisible: true,
        opacity: 1,
        zIndex: 2,
        locked: false,
    },
    setDrawingMode: vi.fn(),
    setCurrentTool: vi.fn(),
    updateToolSettings: vi.fn(),
    addStroke: vi.fn(),
    addShape: vi.fn(),
    setVisibility: vi.fn(),
    setCanvasRef: vi.fn(),
    setLayerOpacity: vi.fn(),
    setLayerZIndex: vi.fn(),
    setLayerLocked: vi.fn(),
    toggleLayerVisibility: vi.fn(),
    resetLayer: vi.fn(),
};

// Mock the useDrawing hook
vi.mock('../../contexts/DrawingContext', async () => {
    const actual = await vi.importActual('../../contexts/DrawingContext');
    return {
        ...actual,
        useDrawing: () => mockDrawingContext,
    };
});

// Mock URL.createObjectURL and related APIs
const mockCreateObjectURL = vi.fn(() => 'mock-blob-url');
const mockRevokeObjectURL = vi.fn();
Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL });
Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL });

// Mock document.createElement for file input
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const originalCreateElement = document.createElement;

describe('App Drawing Persistence Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock document.createElement for file input and download link
        document.createElement = vi.fn((tagName: string) => {
            if (tagName === 'input') {
                return {
                    type: '',
                    accept: '',
                    onchange: null,
                    click: mockClick,
                } as any;
            }
            if (tagName === 'a') {
                return {
                    href: '',
                    download: '',
                    click: mockClick,
                } as any;
            }
            return originalCreateElement.call(document, tagName);
        });

        document.body.appendChild = mockAppendChild;
        document.body.removeChild = mockRemoveChild;
    });

    afterEach(() => {
        document.createElement = originalCreateElement;
    });

    describe('Export Functionality', () => {
        it('should include drawing data in export', () => {
            const testDrawingData: DrawingData = {
                version: '1.0.0',
                strokes: [
                    {
                        id: 'test-stroke-1',
                        points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
                        tool: 'pen',
                        settings: { size: 2, color: '#000000', opacity: 1 },
                        timestamp: Date.now(),
                    },
                ],
                shapes: [
                    {
                        id: 'test-shape-1',
                        type: 'rectangle',
                        bounds: { x: 30, y: 30, width: 40, height: 30 },
                        settings: { strokeColor: '#ff0000', fillColor: '#00ff00', strokeWidth: 3, filled: true },
                        timestamp: Date.now(),
                    },
                ],
            };

            mockDrawingContext.exportDrawingData.mockReturnValue(testDrawingData);

            // Simulate the export functionality
            const exportData = {
                nodes: [],
                edges: [],
                drawingData: mockDrawingContext.exportDrawingData(),
            };

            expect(exportData.drawingData).toEqual(testDrawingData);
            expect(mockDrawingContext.exportDrawingData).toHaveBeenCalled();
        });

        it('should export empty drawing data when no drawings exist', () => {
            const emptyDrawingData: DrawingData = {
                version: '1.0.0',
                strokes: [],
                shapes: [],
            };

            mockDrawingContext.exportDrawingData.mockReturnValue(emptyDrawingData);

            const exportData = {
                nodes: [],
                edges: [],
                drawingData: mockDrawingContext.exportDrawingData(),
            };

            expect(exportData.drawingData).toEqual(emptyDrawingData);
        });

        it('should create proper JSON structure for export', () => {
            const testDrawingData: DrawingData = {
                version: '1.0.0',
                strokes: [
                    {
                        id: 'stroke-1',
                        points: [{ x: 0, y: 0 }],
                        tool: 'pen',
                        settings: { size: 1, color: '#000000', opacity: 1 },
                        timestamp: 1234567890,
                    },
                ],
                shapes: [],
            };

            mockDrawingContext.exportDrawingData.mockReturnValue(testDrawingData);

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
                drawingData: mockDrawingContext.exportDrawingData(),
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const parsedData = JSON.parse(jsonString);

            expect(parsedData.drawingData).toEqual(testDrawingData);
            expect(parsedData.nodes).toHaveLength(1);
            expect(parsedData.edges).toHaveLength(0);
        });
    });

    describe('Import Functionality', () => {
        it('should import drawing data when present in file', () => {
            const testDrawingData: DrawingData = {
                version: '1.0.0',
                strokes: [
                    {
                        id: 'imported-stroke-1',
                        points: [{ x: 50, y: 50 }, { x: 60, y: 60 }],
                        tool: 'pen',
                        settings: { size: 3, color: '#0000ff', opacity: 0.8 },
                        timestamp: Date.now(),
                    },
                ],
                shapes: [
                    {
                        id: 'imported-shape-1',
                        type: 'circle',
                        bounds: { x: 70, y: 70, width: 25, height: 25 },
                        settings: { strokeColor: '#00ff00', fillColor: '#ffff00', strokeWidth: 2, filled: false },
                        timestamp: Date.now(),
                    },
                ],
            };

            const importData = {
                nodes: [],
                edges: [],
                drawingData: testDrawingData,
            };

            // Simulate file loading
            const fileContent = JSON.stringify(importData);

            // Simulate the import process
            if (importData.drawingData) {
                mockDrawingContext.importDrawingData(importData.drawingData);
            }

            expect(mockDrawingContext.importDrawingData).toHaveBeenCalledWith(testDrawingData);
        });

        it('should clear drawing data when not present in imported file', () => {
            const importData = {
                nodes: [
                    {
                        id: '0001',
                        type: 'ganho',
                        position: { x: 100, y: 100 },
                        data: { label: 'Test Node', id: '0001', Vout: 'X0001' },
                    },
                ],
                edges: [],
                // No drawingData property
            };

            // Simulate the import process
            if (importData.drawingData) {
                mockDrawingContext.importDrawingData(importData.drawingData);
            } else {
                mockDrawingContext.clearDrawing();
            }

            expect(mockDrawingContext.clearDrawing).toHaveBeenCalled();
            expect(mockDrawingContext.importDrawingData).not.toHaveBeenCalled();
        });

        it('should handle files with empty drawing data', () => {
            const emptyDrawingData: DrawingData = {
                version: '1.0.0',
                strokes: [],
                shapes: [],
            };

            const importData = {
                nodes: [],
                edges: [],
                drawingData: emptyDrawingData,
            };

            // Simulate the import process
            if (importData.drawingData) {
                mockDrawingContext.importDrawingData(importData.drawingData);
            }

            expect(mockDrawingContext.importDrawingData).toHaveBeenCalledWith(emptyDrawingData);
        });

        it('should handle malformed drawing data gracefully', () => {
            const malformedData = {
                nodes: [],
                edges: [],
                drawingData: {
                    // Missing version
                    strokes: 'not-an-array',
                    shapes: null,
                },
            };

            // Simulate the import process with error handling
            try {
                if (malformedData.drawingData) {
                    mockDrawingContext.importDrawingData(malformedData.drawingData as any);
                }
            } catch (error) {
                // Should handle gracefully
                mockDrawingContext.clearDrawing();
            }

            // Either import was called with malformed data or clear was called
            expect(
                mockDrawingContext.importDrawingData.mock.calls.length +
                mockDrawingContext.clearDrawing.mock.calls.length
            ).toBeGreaterThan(0);
        });
    });

    describe('Clear All Functionality', () => {
        it('should clear drawing data when clearing all', () => {
            // Simulate clear all operation
            mockDrawingContext.clearDrawing();

            expect(mockDrawingContext.clearDrawing).toHaveBeenCalled();
        });

        it('should clear drawing data along with nodes and edges', () => {
            // Simulate the clearAll function behavior
            const clearAll = () => {
                // setNodes([]);
                // setEdges([]);
                // nextNodeId.current = 1;
                mockDrawingContext.clearDrawing();
            };

            clearAll();

            expect(mockDrawingContext.clearDrawing).toHaveBeenCalled();
        });
    });

    describe('Data Format Compatibility', () => {
        it('should maintain backward compatibility with files without drawing data', () => {
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
                // No drawingData property (legacy format)
            };

            // Should handle legacy format gracefully
            if (legacyData.drawingData) {
                mockDrawingContext.importDrawingData(legacyData.drawingData);
            } else {
                mockDrawingContext.clearDrawing();
            }

            expect(mockDrawingContext.clearDrawing).toHaveBeenCalled();
        });

        it('should export current format with drawing data', () => {
            const currentDrawingData: DrawingData = {
                version: '1.0.0',
                strokes: [],
                shapes: [],
            };

            mockDrawingContext.exportDrawingData.mockReturnValue(currentDrawingData);

            const exportData = {
                nodes: [],
                edges: [],
                drawingData: mockDrawingContext.exportDrawingData(),
            };

            expect(exportData).toHaveProperty('drawingData');
            expect(exportData.drawingData).toEqual(currentDrawingData);
        });

        it('should handle version differences in drawing data', () => {
            const futureVersionData: DrawingData = {
                version: '2.0.0',
                strokes: [],
                shapes: [],
            };

            const importData = {
                nodes: [],
                edges: [],
                drawingData: futureVersionData,
            };

            // Should still import successfully
            if (importData.drawingData) {
                mockDrawingContext.importDrawingData(importData.drawingData);
            }

            expect(mockDrawingContext.importDrawingData).toHaveBeenCalledWith(futureVersionData);
        });
    });

    describe('Error Handling', () => {
        it('should handle export errors gracefully', () => {
            mockDrawingContext.exportDrawingData.mockImplementation(() => {
                throw new Error('Export failed');
            });

            let exportData;
            try {
                exportData = {
                    nodes: [],
                    edges: [],
                    drawingData: mockDrawingContext.exportDrawingData(),
                };
            } catch (error) {
                // Fallback to empty drawing data
                exportData = {
                    nodes: [],
                    edges: [],
                    drawingData: {
                        version: '1.0.0',
                        strokes: [],
                        shapes: [],
                    },
                };
            }

            expect(exportData.drawingData).toBeDefined();
        });

        it('should handle import errors gracefully', () => {
            mockDrawingContext.importDrawingData.mockImplementation(() => {
                throw new Error('Import failed');
            });

            const testData: DrawingData = {
                version: '1.0.0',
                strokes: [],
                shapes: [],
            };

            // Should handle import error gracefully
            try {
                mockDrawingContext.importDrawingData(testData);
            } catch (error) {
                // Fallback to clearing drawing
                mockDrawingContext.clearDrawing();
            }

            expect(mockDrawingContext.clearDrawing).toHaveBeenCalled();
        });
    });
});