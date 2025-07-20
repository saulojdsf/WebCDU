import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrawingEngine } from '../DrawingEngine';
import type { DrawingData, Point, ToolSettings } from '../drawing-types';

// Mock Path2D
global.Path2D = vi.fn(() => ({
  moveTo: vi.fn(),
  lineTo: vi.fn(),
}));

// Mock canvas and context
const mockContext = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  strokeRect: vi.fn(),
  fillRect: vi.fn(),
  ellipse: vi.fn(),
  set strokeStyle(value: string) {},
  set fillStyle(value: string) {},
  set lineWidth(value: number) {},
  set globalAlpha(value: number) {},
  set globalCompositeOperation(value: string) {},
  set lineCap(value: string) {},
  set lineJoin(value: string) {},
  set imageSmoothingEnabled(value: boolean) {},
};

const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 800, height: 600 })),
  width: 800,
  height: 600,
} as unknown as HTMLCanvasElement;

describe('Drawing Data Persistence', () => {
  let drawingEngine: DrawingEngine;
  let toolSettings: ToolSettings;

  beforeEach(() => {
    vi.clearAllMocks();
    drawingEngine = new DrawingEngine(mockCanvas);
    toolSettings = {
      pen: {
        size: 2,
        color: '#000000',
        opacity: 1,
      },
      eraser: {
        size: 10,
      },
      shapes: {
        strokeColor: '#000000',
        fillColor: '#ffffff',
        strokeWidth: 2,
        filled: false,
      },
    };
  });

  describe('Data Serialization', () => {
    it('should export empty drawing data by default', () => {
      const data = drawingEngine.exportData();
      
      expect(data).toEqual({
        version: '1.0.0',
        strokes: [],
        shapes: [],
      });
    });

    it('should export drawing data with strokes', () => {
      const start: Point = { x: 10, y: 10 };
      const middle: Point = { x: 20, y: 20 };
      const end: Point = { x: 30, y: 30 };

      // Draw a stroke
      drawingEngine.startDrawing(start, 'pen', toolSettings);
      drawingEngine.continueDrawing(middle);
      drawingEngine.continueDrawing(end);
      drawingEngine.endDrawing();

      const data = drawingEngine.exportData();
      
      expect(data.version).toBe('1.0.0');
      expect(data.strokes).toHaveLength(1);
      expect(data.shapes).toHaveLength(0);
      
      const stroke = data.strokes[0];
      expect(stroke.tool).toBe('pen');
      expect(stroke.settings.size).toBe(2);
      expect(stroke.settings.color).toBe('#000000');
      expect(stroke.settings.opacity).toBe(1);
      expect(stroke.points.length).toBeGreaterThan(0);
      expect(stroke.timestamp).toBeGreaterThan(0);
      expect(stroke.id).toBeDefined();
    });

    it('should export drawing data with shapes', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      // Draw a rectangle
      drawingEngine.drawShape(start, end, 'rectangle', toolSettings.shapes);

      const data = drawingEngine.exportData();
      
      expect(data.strokes).toHaveLength(0);
      expect(data.shapes).toHaveLength(1);
      
      const shape = data.shapes[0];
      expect(shape.type).toBe('rectangle');
      expect(shape.settings.strokeColor).toBe('#000000');
      expect(shape.settings.fillColor).toBe('#ffffff');
      expect(shape.settings.strokeWidth).toBe(2);
      expect(shape.settings.filled).toBe(false);
      expect(shape.bounds).toBeDefined();
      expect(shape.timestamp).toBeGreaterThan(0);
      expect(shape.id).toBeDefined();
    });

    it('should export complex drawing data with multiple strokes and shapes', () => {
      // Add multiple strokes
      for (let i = 0; i < 3; i++) {
        const start: Point = { x: i * 10, y: i * 10 };
        const end: Point = { x: i * 10 + 20, y: i * 10 + 20 };
        
        drawingEngine.startDrawing(start, 'pen', toolSettings);
        drawingEngine.continueDrawing(end);
        drawingEngine.endDrawing();
      }

      // Add multiple shapes
      const shapeTypes: ('rectangle' | 'circle' | 'line')[] = ['rectangle', 'circle', 'line'];
      for (let i = 0; i < shapeTypes.length; i++) {
        const start: Point = { x: i * 50, y: i * 50 };
        const end: Point = { x: i * 50 + 30, y: i * 50 + 30 };
        
        drawingEngine.drawShape(start, end, shapeTypes[i], toolSettings.shapes);
      }

      const data = drawingEngine.exportData();
      
      expect(data.strokes).toHaveLength(3);
      expect(data.shapes).toHaveLength(3);
      
      // Verify shape types
      expect(data.shapes.map(s => s.type)).toEqual(['rectangle', 'circle', 'line']);
    });
  });

  describe('Data Deserialization', () => {
    it('should import empty drawing data', () => {
      const emptyData: DrawingData = {
        version: '1.0.0',
        strokes: [],
        shapes: [],
      };

      drawingEngine.importData(emptyData);
      const exportedData = drawingEngine.exportData();
      
      expect(exportedData).toEqual(emptyData);
    });

    it('should import drawing data with strokes', () => {
      const strokeData: DrawingData = {
        version: '1.0.0',
        strokes: [
          {
            id: 'test-stroke-1',
            points: [
              { x: 10, y: 10 },
              { x: 20, y: 20 },
              { x: 30, y: 30 },
            ],
            tool: 'pen',
            settings: {
              size: 3,
              color: '#ff0000',
              opacity: 0.8,
            },
            timestamp: Date.now(),
          },
        ],
        shapes: [],
      };

      drawingEngine.importData(strokeData);
      const exportedData = drawingEngine.exportData();
      
      expect(exportedData.strokes).toHaveLength(1);
      expect(exportedData.strokes[0]).toEqual(strokeData.strokes[0]);
    });

    it('should import drawing data with shapes', () => {
      const shapeData: DrawingData = {
        version: '1.0.0',
        strokes: [],
        shapes: [
          {
            id: 'test-shape-1',
            type: 'rectangle',
            bounds: {
              x: 10,
              y: 10,
              width: 40,
              height: 30,
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

      drawingEngine.importData(shapeData);
      const exportedData = drawingEngine.exportData();
      
      expect(exportedData.shapes).toHaveLength(1);
      expect(exportedData.shapes[0]).toEqual(shapeData.shapes[0]);
    });

    it('should import complex drawing data', () => {
      const complexData: DrawingData = {
        version: '1.0.0',
        strokes: [
          {
            id: 'stroke-1',
            points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
            tool: 'pen',
            settings: { size: 2, color: '#000000', opacity: 1 },
            timestamp: Date.now() - 1000,
          },
          {
            id: 'stroke-2',
            points: [{ x: 20, y: 20 }, { x: 30, y: 30 }],
            tool: 'pen',
            settings: { size: 4, color: '#ff0000', opacity: 0.5 },
            timestamp: Date.now() - 500,
          },
        ],
        shapes: [
          {
            id: 'shape-1',
            type: 'rectangle',
            bounds: { x: 50, y: 50, width: 20, height: 15 },
            settings: { strokeColor: '#0000ff', fillColor: '#ffffff', strokeWidth: 1, filled: false },
            timestamp: Date.now() - 200,
          },
          {
            id: 'shape-2',
            type: 'circle',
            bounds: { x: 100, y: 100, width: 30, height: 30 },
            settings: { strokeColor: '#00ff00', fillColor: '#ffff00', strokeWidth: 2, filled: true },
            timestamp: Date.now(),
          },
        ],
      };

      drawingEngine.importData(complexData);
      const exportedData = drawingEngine.exportData();
      
      expect(exportedData.strokes).toHaveLength(2);
      expect(exportedData.shapes).toHaveLength(2);
      expect(exportedData).toEqual(complexData);
    });

    it('should handle version compatibility', () => {
      const futureVersionData: DrawingData = {
        version: '2.0.0',
        strokes: [],
        shapes: [],
      };

      // Should still import successfully
      drawingEngine.importData(futureVersionData);
      const exportedData = drawingEngine.exportData();
      
      expect(exportedData.version).toBe('2.0.0');
    });
  });

  describe('Data Integrity', () => {
    it('should preserve data through export/import cycle', () => {
      // Create some drawing data
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      drawingEngine.startDrawing(start, 'pen', toolSettings);
      drawingEngine.continueDrawing(end);
      drawingEngine.endDrawing();

      drawingEngine.drawShape(start, end, 'rectangle', toolSettings.shapes);
      drawingEngine.drawShape(start, end, 'circle', toolSettings.shapes);

      // Export data
      const originalData = drawingEngine.exportData();

      // Create new engine and import data
      const newEngine = new DrawingEngine(mockCanvas);
      newEngine.importData(originalData);

      // Export again and compare
      const roundTripData = newEngine.exportData();

      expect(roundTripData).toEqual(originalData);
    });

    it('should maintain unique IDs across export/import', () => {
      // Create drawing data
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      drawingEngine.startDrawing(start, 'pen', toolSettings);
      drawingEngine.continueDrawing(end);
      drawingEngine.endDrawing();

      drawingEngine.drawShape(start, end, 'rectangle', toolSettings.shapes);

      const originalData = drawingEngine.exportData();
      const originalStrokeId = originalData.strokes[0].id;
      const originalShapeId = originalData.shapes[0].id;

      // Import into new engine
      const newEngine = new DrawingEngine(mockCanvas);
      newEngine.importData(originalData);

      const importedData = newEngine.exportData();

      expect(importedData.strokes[0].id).toBe(originalStrokeId);
      expect(importedData.shapes[0].id).toBe(originalShapeId);
    });

    it('should handle corrupted data gracefully', () => {
      const corruptedData = {
        version: '1.0.0',
        strokes: [
          {
            // Missing required fields
            id: 'corrupt-stroke',
            points: [],
            tool: 'pen',
            settings: { size: 2 },
            timestamp: Date.now(),
          },
        ],
        shapes: [
          {
            // Missing required fields
            id: 'corrupt-shape',
            type: 'rectangle',
            bounds: { x: 0, y: 0, width: 10, height: 10 },
            settings: { strokeColor: '#000000', fillColor: '#ffffff', strokeWidth: 1, filled: false },
            timestamp: Date.now(),
          },
        ],
      } as DrawingData;

      // Should not throw an error
      expect(() => {
        drawingEngine.importData(corruptedData);
      }).not.toThrow();

      // Should still be able to export
      const exportedData = drawingEngine.exportData();
      expect(exportedData).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeData: DrawingData = {
        version: '1.0.0',
        strokes: [],
        shapes: [],
      };

      // Create 1000 strokes
      for (let i = 0; i < 1000; i++) {
        largeData.strokes.push({
          id: `stroke-${i}`,
          points: [
            { x: i, y: i },
            { x: i + 10, y: i + 10 },
          ],
          tool: 'pen',
          settings: { size: 2, color: '#000000', opacity: 1 },
          timestamp: Date.now() + i,
        });
      }

      // Create 1000 shapes
      for (let i = 0; i < 1000; i++) {
        largeData.shapes.push({
          id: `shape-${i}`,
          type: 'rectangle',
          bounds: { x: i, y: i, width: 10, height: 10 },
          settings: { strokeColor: '#000000', fillColor: '#ffffff', strokeWidth: 1, filled: false },
          timestamp: Date.now() + i,
        });
      }

      const startTime = performance.now();
      drawingEngine.importData(largeData);
      const importTime = performance.now() - startTime;

      const exportStartTime = performance.now();
      const exportedData = drawingEngine.exportData();
      const exportTime = performance.now() - exportStartTime;

      // Should complete within reasonable time (less than 100ms each)
      expect(importTime).toBeLessThan(100);
      expect(exportTime).toBeLessThan(100);

      // Data should be preserved
      expect(exportedData.strokes).toHaveLength(1000);
      expect(exportedData.shapes).toHaveLength(1000);
    });
  });
});