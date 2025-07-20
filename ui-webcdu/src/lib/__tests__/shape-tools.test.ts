import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrawingEngine } from '../DrawingEngine';
import type { Point, ToolSettings } from '../drawing-types';

// Mock canvas and context
const mockContext = {
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
};

const mockCanvas = {
  getContext: vi.fn(() => mockContext),
  getBoundingClientRect: vi.fn(() => ({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
  })),
  width: 800,
  height: 600,
  style: {},
} as unknown as HTMLCanvasElement;

describe('Shape Tools', () => {
  let drawingEngine: DrawingEngine;
  let toolSettings: ToolSettings;

  beforeEach(() => {
    vi.clearAllMocks();
    drawingEngine = new DrawingEngine(mockCanvas);
    
    toolSettings = {
      pen: { size: 2, color: '#000000', opacity: 1 },
      eraser: { size: 10 },
      shapes: {
        strokeColor: '#000000',
        fillColor: '#ffffff',
        strokeWidth: 2,
        filled: false,
      },
    };
  });

  describe('Rectangle Tool', () => {
    it('should draw rectangle shape', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      drawingEngine.drawShape(start, end, 'rectangle', toolSettings.shapes);

      const data = drawingEngine.exportData();
      expect(data.shapes).toHaveLength(1);
      
      const shape = data.shapes[0];
      expect(shape.type).toBe('rectangle');
      expect(shape.bounds).toEqual({
        x: 10,
        y: 10,
        width: 40,
        height: 30,
      });
    });

    it('should preview rectangle without saving to data', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      drawingEngine.previewShape(start, end, 'rectangle', toolSettings.shapes);

      const data = drawingEngine.exportData();
      expect(data.shapes).toHaveLength(0);
      expect(mockContext.strokeRect).toHaveBeenCalled();
    });

    it('should handle filled rectangle', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };
      const filledSettings = { ...toolSettings.shapes, filled: true };

      drawingEngine.previewShape(start, end, 'rectangle', filledSettings);

      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.strokeRect).toHaveBeenCalled();
    });

    it('should handle negative dimensions correctly', () => {
      const start: Point = { x: 50, y: 40 };
      const end: Point = { x: 10, y: 10 };

      drawingEngine.drawShape(start, end, 'rectangle', toolSettings.shapes);

      const data = drawingEngine.exportData();
      const shape = data.shapes[0];
      expect(shape.bounds).toEqual({
        x: 10,
        y: 10,
        width: 40,
        height: 30,
      });
    });
  });

  describe('Circle Tool', () => {
    it('should draw circle shape', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      drawingEngine.drawShape(start, end, 'circle', toolSettings.shapes);

      const data = drawingEngine.exportData();
      expect(data.shapes).toHaveLength(1);
      
      const shape = data.shapes[0];
      expect(shape.type).toBe('circle');
      expect(shape.bounds).toEqual({
        x: 10,
        y: 10,
        width: 40,
        height: 30,
      });
    });

    it('should preview circle without saving to data', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      drawingEngine.previewShape(start, end, 'circle', toolSettings.shapes);

      const data = drawingEngine.exportData();
      expect(data.shapes).toHaveLength(0);
      expect(mockContext.ellipse).toHaveBeenCalled();
    });

    it('should handle filled circle', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };
      const filledSettings = { ...toolSettings.shapes, filled: true };

      drawingEngine.previewShape(start, end, 'circle', filledSettings);

      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });
  });

  describe('Line Tool', () => {
    it('should draw line shape', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      drawingEngine.drawShape(start, end, 'line', toolSettings.shapes);

      const data = drawingEngine.exportData();
      expect(data.shapes).toHaveLength(1);
      
      const shape = data.shapes[0];
      expect(shape.type).toBe('line');
      expect(shape.bounds).toEqual({
        x: 10,
        y: 10,
        width: 40,
        height: 30,
      });
    });

    it('should preview line without saving to data', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      drawingEngine.previewShape(start, end, 'line', toolSettings.shapes);

      const data = drawingEngine.exportData();
      expect(data.shapes).toHaveLength(0);
      expect(mockContext.moveTo).toHaveBeenCalledWith(10, 10);
      expect(mockContext.lineTo).toHaveBeenCalledWith(50, 40);
    });
  });

  describe('Shape Settings', () => {
    it('should apply custom stroke color', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };
      const customSettings = { ...toolSettings.shapes, strokeColor: '#ff0000' };

      drawingEngine.drawShape(start, end, 'rectangle', customSettings);

      const data = drawingEngine.exportData();
      const shape = data.shapes[0];
      expect(shape.settings.strokeColor).toBe('#ff0000');
    });

    it('should apply custom fill color', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };
      const customSettings = { 
        ...toolSettings.shapes, 
        fillColor: '#00ff00',
        filled: true 
      };

      drawingEngine.drawShape(start, end, 'rectangle', customSettings);

      const data = drawingEngine.exportData();
      const shape = data.shapes[0];
      expect(shape.settings.fillColor).toBe('#00ff00');
      expect(shape.settings.filled).toBe(true);
    });

    it('should apply custom stroke width', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };
      const customSettings = { ...toolSettings.shapes, strokeWidth: 5 };

      drawingEngine.drawShape(start, end, 'rectangle', customSettings);

      const data = drawingEngine.exportData();
      const shape = data.shapes[0];
      expect(shape.settings.strokeWidth).toBe(5);
    });
  });

  describe('Shape Data Management', () => {
    it('should generate unique IDs for shapes', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      drawingEngine.drawShape(start, end, 'rectangle', toolSettings.shapes);
      drawingEngine.drawShape(start, end, 'circle', toolSettings.shapes);

      const data = drawingEngine.exportData();
      expect(data.shapes).toHaveLength(2);
      expect(data.shapes[0].id).not.toBe(data.shapes[1].id);
    });

    it('should include timestamp in shape data', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };
      const beforeTime = Date.now();

      drawingEngine.drawShape(start, end, 'rectangle', toolSettings.shapes);

      const data = drawingEngine.exportData();
      const shape = data.shapes[0];
      expect(shape.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(shape.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should preserve shapes when importing/exporting data', () => {
      const start: Point = { x: 10, y: 10 };
      const end: Point = { x: 50, y: 40 };

      drawingEngine.drawShape(start, end, 'rectangle', toolSettings.shapes);
      drawingEngine.drawShape(start, end, 'circle', toolSettings.shapes);

      const exportedData = drawingEngine.exportData();
      const newEngine = new DrawingEngine(mockCanvas);
      newEngine.importData(exportedData);

      const importedData = newEngine.exportData();
      expect(importedData.shapes).toHaveLength(2);
      expect(importedData.shapes[0].type).toBe('rectangle');
      expect(importedData.shapes[1].type).toBe('circle');
    });
  });
});