import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrawingEngine } from '../DrawingEngine';
import { Point, ToolSettings, DrawingData } from '../drawing-types';

// Mock canvas and context
class MockCanvasRenderingContext2D {
  public lineCap = 'butt';
  public lineJoin = 'miter';
  public lineWidth = 1;
  public strokeStyle = '#000000';
  public fillStyle = '#000000';
  public globalAlpha = 1;
  public globalCompositeOperation = 'source-over';
  public imageSmoothingEnabled = true;

  private operations: string[] = [];

  scale = vi.fn((x: number, y: number) => {
    this.operations.push(`scale(${x}, ${y})`);
  });

  translate = vi.fn((x: number, y: number) => {
    this.operations.push(`translate(${x}, ${y})`);
  });

  moveTo = vi.fn((x: number, y: number) => {
    this.operations.push(`moveTo(${x}, ${y})`);
  });

  lineTo = vi.fn((x: number, y: number) => {
    this.operations.push(`lineTo(${x}, ${y})`);
  });

  stroke = vi.fn((path?: Path2D) => {
    this.operations.push('stroke');
  });

  fill = vi.fn(() => {
    this.operations.push('fill');
  });

  beginPath = vi.fn(() => {
    this.operations.push('beginPath');
  });

  closePath = vi.fn(() => {
    this.operations.push('closePath');
  });

  clearRect = vi.fn((x: number, y: number, width: number, height: number) => {
    this.operations.push(`clearRect(${x}, ${y}, ${width}, ${height})`);
  });

  strokeRect = vi.fn((x: number, y: number, width: number, height: number) => {
    this.operations.push(`strokeRect(${x}, ${y}, ${width}, ${height})`);
  });

  fillRect = vi.fn((x: number, y: number, width: number, height: number) => {
    this.operations.push(`fillRect(${x}, ${y}, ${width}, ${height})`);
  });

  ellipse = vi.fn((x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number) => {
    this.operations.push(`ellipse(${x}, ${y}, ${radiusX}, ${radiusY}, ${rotation}, ${startAngle}, ${endAngle})`);
  });

  save = vi.fn(() => {
    this.operations.push('save');
  });

  restore = vi.fn(() => {
    this.operations.push('restore');
  });

  getOperations(): string[] {
    return [...this.operations];
  }

  clearOperations(): void {
    this.operations = [];
  }
}

class MockHTMLCanvasElement {
  public width = 800;
  public height = 600;
  private context = new MockCanvasRenderingContext2D();

  getContext(contextId: string): MockCanvasRenderingContext2D | null {
    if (contextId === '2d') {
      return this.context;
    }
    return null;
  }

  getBoundingClientRect(): DOMRect {
    return {
      left: 0,
      top: 0,
      right: this.width,
      bottom: this.height,
      width: this.width,
      height: this.height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  }

  getContext2D(): MockCanvasRenderingContext2D {
    return this.context;
  }
}

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1,
});

// Mock Path2D
class MockPath2D {
  private operations: string[] = [];

  moveTo = vi.fn((x: number, y: number) => {
    this.operations.push(`moveTo(${x}, ${y})`);
  });

  lineTo = vi.fn((x: number, y: number) => {
    this.operations.push(`lineTo(${x}, ${y})`);
  });

  getOperations(): string[] {
    return [...this.operations];
  }
}

// @ts-ignore
global.Path2D = MockPath2D;

describe('DrawingEngine', () => {
  let canvas: MockHTMLCanvasElement;
  let engine: DrawingEngine;
  let mockContext: MockCanvasRenderingContext2D;

  const defaultToolSettings: ToolSettings = {
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

  beforeEach(() => {
    canvas = new MockHTMLCanvasElement();
    mockContext = canvas.getContext2D();
    engine = new DrawingEngine(canvas as any);
    mockContext.clearOperations();
  });

  describe('constructor', () => {
    it('should initialize with canvas and context', () => {
      expect(engine).toBeInstanceOf(DrawingEngine);
    });

    it('should throw error if canvas context is not available', () => {
      const badCanvas = {
        getContext: () => null,
        getBoundingClientRect: () => ({ width: 800, height: 600 }),
      };
      
      expect(() => new DrawingEngine(badCanvas as any)).toThrow('Failed to get 2D rendering context from canvas');
    });

    it('should set up canvas with proper scaling', () => {
      // Create a new engine to capture the setup operations
      const newCanvas = new MockHTMLCanvasElement();
      const newMockContext = newCanvas.getContext2D();
      new DrawingEngine(newCanvas as any);
      
      const operations = newMockContext.getOperations();
      expect(operations).toContain('scale(1, 1)');
    });
  });

  describe('viewport transformation', () => {
    it('should set viewport transform parameters', () => {
      const scale = 2;
      const offset = { x: 100, y: 50 };
      
      engine.setViewportTransform(scale, offset);
      
      // Test coordinate transformation
      const screenPoint = { x: 200, y: 150 };
      const canvasPoint = engine.screenToCanvas(screenPoint);
      
      expect(canvasPoint.x).toBe((200 - 0 - 100) / 2); // (screenX - canvasLeft - offsetX) / scale
      expect(canvasPoint.y).toBe((150 - 0 - 50) / 2);  // (screenY - canvasTop - offsetY) / scale
    });

    it('should transform screen coordinates to canvas coordinates', () => {
      engine.setViewportTransform(1, { x: 0, y: 0 });
      
      const screenPoint = { x: 100, y: 200 };
      const canvasPoint = engine.screenToCanvas(screenPoint);
      
      expect(canvasPoint.x).toBe(100);
      expect(canvasPoint.y).toBe(200);
    });

    it('should transform canvas coordinates to screen coordinates', () => {
      engine.setViewportTransform(1, { x: 0, y: 0 });
      
      const canvasPoint = { x: 100, y: 200 };
      const screenPoint = engine.canvasToScreen(canvasPoint);
      
      expect(screenPoint.x).toBe(100);
      expect(screenPoint.y).toBe(200);
    });

    it('should handle pressure in coordinate transformations', () => {
      const pointWithPressure = { x: 100, y: 200, pressure: 0.5 };
      const transformed = engine.screenToCanvas(pointWithPressure);
      
      expect(transformed.pressure).toBe(0.5);
    });
  });

  describe('drawing operations', () => {
    it('should start drawing with pen tool', () => {
      const startPoint = { x: 100, y: 100 };
      
      engine.startDrawing(startPoint, 'pen', defaultToolSettings);
      
      expect(mockContext.strokeStyle).toBe('#000000');
      expect(mockContext.lineWidth).toBe(2);
      expect(mockContext.globalAlpha).toBe(1);
    });

    it('should continue drawing and add points', () => {
      const startPoint = { x: 100, y: 100 };
      const continuePoint = { x: 150, y: 150 };
      
      engine.startDrawing(startPoint, 'pen', defaultToolSettings);
      engine.continueDrawing(continuePoint);
      
      const operations = mockContext.getOperations();
      expect(operations).toContain('stroke');
    });

    it('should end drawing and create stroke data', () => {
      const startPoint = { x: 100, y: 100 };
      const continuePoint = { x: 150, y: 150 };
      
      engine.startDrawing(startPoint, 'pen', defaultToolSettings);
      engine.continueDrawing(continuePoint);
      engine.endDrawing();
      
      const drawingData = engine.exportData();
      expect(drawingData.strokes).toHaveLength(1);
      expect(drawingData.strokes[0].points).toHaveLength(2);
    });

    it('should handle multiple drawing sessions', () => {
      // First stroke
      engine.startDrawing({ x: 0, y: 0 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 10, y: 10 });
      engine.endDrawing();
      
      // Second stroke
      engine.startDrawing({ x: 20, y: 20 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 30, y: 30 });
      engine.endDrawing();
      
      const drawingData = engine.exportData();
      expect(drawingData.strokes).toHaveLength(2);
    });

    it('should end previous drawing when starting new one', () => {
      engine.startDrawing({ x: 0, y: 0 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 10, y: 10 });
      
      // Start new drawing without ending previous
      engine.startDrawing({ x: 20, y: 20 }, 'pen', defaultToolSettings);
      
      const drawingData = engine.exportData();
      expect(drawingData.strokes).toHaveLength(1); // Previous stroke should be saved
    });
  });

  describe('eraser functionality', () => {
    beforeEach(() => {
      // Create some strokes to erase
      // These are screen coordinates that will be transformed to canvas coordinates
      engine.startDrawing({ x: 100, y: 100 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 150, y: 150 });
      engine.endDrawing();
      
      engine.startDrawing({ x: 200, y: 200 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 250, y: 250 });
      engine.endDrawing();

      // Add some shapes to test shape erasing
      engine.drawShape({ x: 300, y: 300 }, { x: 350, y: 350 }, 'rectangle', defaultToolSettings.shapes);
      engine.drawShape({ x: 400, y: 400 }, { x: 450, y: 450 }, 'circle', defaultToolSettings.shapes);
    });

    it('should remove strokes within eraser radius', () => {
      const initialStrokes = engine.exportData().strokes.length;
      expect(initialStrokes).toBe(2);
      
      // Get the actual stroke points to ensure we're erasing correctly
      const firstStroke = engine.exportData().strokes[0];
      const firstPoint = firstStroke.points[0];
      
      // Erase at the exact location of the first point (in screen coordinates)
      const screenPoint = engine.canvasToScreen(firstPoint);
      engine.erase(screenPoint, 50);
      
      const remainingStrokes = engine.exportData().strokes.length;
      expect(remainingStrokes).toBeLessThan(initialStrokes);
    });

    it('should not remove strokes outside eraser radius', () => {
      const initialStrokes = engine.exportData().strokes.length;
      
      // Erase far from any strokes
      engine.erase({ x: 500, y: 500 }, 10);
      
      const remainingStrokes = engine.exportData().strokes.length;
      expect(remainingStrokes).toBe(initialStrokes);
    });

    it('should remove shapes within eraser radius', () => {
      const initialShapes = engine.exportData().shapes.length;
      expect(initialShapes).toBe(2);
      
      // Erase at the center of the first shape (rectangle at 300,300 to 350,350)
      engine.erase({ x: 325, y: 325 }, 50);
      
      const remainingShapes = engine.exportData().shapes.length;
      expect(remainingShapes).toBeLessThan(initialShapes);
    });

    it('should not remove shapes outside eraser radius', () => {
      const initialShapes = engine.exportData().shapes.length;
      
      // Erase far from any shapes
      engine.erase({ x: 600, y: 600 }, 10);
      
      const remainingShapes = engine.exportData().shapes.length;
      expect(remainingShapes).toBe(initialShapes);
    });

    it('should handle eraser tool in drawing operations', () => {
      const initialStrokes = engine.exportData().strokes.length;
      
      // Get the actual position of the first stroke to ensure we hit it
      const firstStroke = engine.exportData().strokes[0];
      const firstPoint = firstStroke.points[0];
      const screenPoint = engine.canvasToScreen(firstPoint);
      
      // Start erasing operation at the exact location of a stroke
      engine.startDrawing(screenPoint, 'eraser', defaultToolSettings);
      engine.continueDrawing({ x: screenPoint.x + 5, y: screenPoint.y + 5 });
      engine.endDrawing();
      
      // Should have removed strokes but not added new ones
      const finalStrokes = engine.exportData().strokes.length;
      expect(finalStrokes).toBeLessThan(initialStrokes);
    });

    it('should configure eraser size', () => {
      const customSettings: ToolSettings = {
        ...defaultToolSettings,
        eraser: { size: 100 }
      };
      
      const initialStrokes = engine.exportData().strokes.length;
      
      // Large eraser should remove more content
      engine.erase({ x: 175, y: 175 }, customSettings.eraser.size);
      
      const remainingStrokes = engine.exportData().strokes.length;
      expect(remainingStrokes).toBeLessThan(initialStrokes);
    });

    it('should handle selective stroke removal based on eraser path', () => {
      // Create strokes at different distances
      engine.startDrawing({ x: 50, y: 50 }, 'pen', defaultToolSettings);
      engine.endDrawing();
      
      engine.startDrawing({ x: 500, y: 500 }, 'pen', defaultToolSettings);
      engine.endDrawing();
      
      const totalStrokes = engine.exportData().strokes.length;
      expect(totalStrokes).toBe(4); // 2 original + 2 new
      
      // Erase only near the first group of strokes
      engine.erase({ x: 100, y: 100 }, 80);
      
      const remainingStrokes = engine.exportData().strokes;
      // Should have removed strokes near (100,100) but kept the one at (500,500)
      expect(remainingStrokes.length).toBeLessThan(totalStrokes);
      expect(remainingStrokes.length).toBeGreaterThan(0);
    });

    it('should handle eraser intersection with line segments', () => {
      // Create a long stroke that passes through the eraser area
      engine.startDrawing({ x: 0, y: 100 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 200, y: 100 }); // Horizontal line
      engine.endDrawing();
      
      const initialStrokes = engine.exportData().strokes.length;
      
      // Erase in the middle of the line
      engine.erase({ x: 100, y: 100 }, 20);
      
      const remainingStrokes = engine.exportData().strokes.length;
      expect(remainingStrokes).toBeLessThan(initialStrokes);
    });

    it('should handle multiple eraser operations', () => {
      const initialCount = engine.exportData().strokes.length + engine.exportData().shapes.length;
      
      // Multiple erase operations
      engine.erase({ x: 125, y: 125 }, 30); // Should hit first stroke
      engine.erase({ x: 225, y: 225 }, 30); // Should hit second stroke
      engine.erase({ x: 325, y: 325 }, 30); // Should hit rectangle
      
      const finalCount = engine.exportData().strokes.length + engine.exportData().shapes.length;
      expect(finalCount).toBeLessThan(initialCount);
    });

    it('should redraw canvas after erasing', () => {
      mockContext.clearOperations();
      
      engine.erase({ x: 125, y: 125 }, 50);
      
      const operations = mockContext.getOperations();
      expect(operations).toContain('clearRect(0, 0, 800, 600)');
    });
  });

  describe('shape drawing', () => {
    it('should draw rectangle shape', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 200, y: 150 };
      
      engine.drawShape(start, end, 'rectangle', defaultToolSettings.shapes);
      
      const drawingData = engine.exportData();
      expect(drawingData.shapes).toHaveLength(1);
      expect(drawingData.shapes[0].type).toBe('rectangle');
      expect(drawingData.shapes[0].bounds.width).toBe(100);
      expect(drawingData.shapes[0].bounds.height).toBe(50);
    });

    it('should draw circle shape', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 200, y: 200 };
      
      engine.drawShape(start, end, 'circle', defaultToolSettings.shapes);
      
      const drawingData = engine.exportData();
      expect(drawingData.shapes).toHaveLength(1);
      expect(drawingData.shapes[0].type).toBe('circle');
    });

    it('should draw line shape', () => {
      const start = { x: 100, y: 100 };
      const end = { x: 200, y: 200 };
      
      engine.drawShape(start, end, 'line', defaultToolSettings.shapes);
      
      const drawingData = engine.exportData();
      expect(drawingData.shapes).toHaveLength(1);
      expect(drawingData.shapes[0].type).toBe('line');
    });

    it('should preview shapes without saving to data', () => {
      const initialShapes = engine.exportData().shapes.length;
      
      engine.previewShape({ x: 0, y: 0 }, { x: 100, y: 100 }, 'rectangle', defaultToolSettings.shapes);
      
      const currentShapes = engine.exportData().shapes.length;
      expect(currentShapes).toBe(initialShapes);
      
      // Should have drawn on canvas
      const operations = mockContext.getOperations();
      expect(operations).toContain('strokeRect(0, 0, 100, 100)');
    });
  });

  describe('data management', () => {
    it('should export drawing data', () => {
      engine.startDrawing({ x: 0, y: 0 }, 'pen', defaultToolSettings);
      engine.endDrawing();
      
      const data = engine.exportData();
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('strokes');
      expect(data).toHaveProperty('shapes');
      expect(data.strokes).toHaveLength(1);
    });

    it('should import drawing data', () => {
      const testData: DrawingData = {
        version: '1.0.0',
        strokes: [{
          id: 'test-stroke',
          points: [{ x: 0, y: 0 }, { x: 10, y: 10 }],
          tool: 'pen',
          settings: { size: 2, color: '#ff0000', opacity: 1 },
          timestamp: Date.now(),
        }],
        shapes: [{
          id: 'test-shape',
          type: 'rectangle',
          bounds: { x: 0, y: 0, width: 100, height: 50 },
          settings: { strokeColor: '#000000', fillColor: '#ffffff', strokeWidth: 2, filled: false },
          timestamp: Date.now(),
        }],
      };
      
      engine.importData(testData);
      
      const exportedData = engine.exportData();
      expect(exportedData.strokes).toHaveLength(1);
      expect(exportedData.shapes).toHaveLength(1);
      expect(exportedData.strokes[0].id).toBe('test-stroke');
      expect(exportedData.shapes[0].id).toBe('test-shape');
    });

    it('should clear all drawing data', () => {
      engine.startDrawing({ x: 0, y: 0 }, 'pen', defaultToolSettings);
      engine.endDrawing();
      engine.drawShape({ x: 0, y: 0 }, { x: 100, y: 100 }, 'rectangle', defaultToolSettings.shapes);
      
      expect(engine.exportData().strokes).toHaveLength(1);
      expect(engine.exportData().shapes).toHaveLength(1);
      
      engine.clear();
      
      expect(engine.exportData().strokes).toHaveLength(0);
      expect(engine.exportData().shapes).toHaveLength(0);
    });
  });

  describe('canvas operations', () => {
    it('should redraw all content', () => {
      engine.startDrawing({ x: 0, y: 0 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 10, y: 10 });
      engine.endDrawing();
      
      mockContext.clearOperations();
      engine.redraw();
      
      const operations = mockContext.getOperations();
      expect(operations).toContain('clearRect(0, 0, 800, 600)');
      expect(operations).toContain('stroke');
    });

    it('should handle canvas resize', () => {
      engine.resize();
      
      const operations = mockContext.getOperations();
      expect(operations).toContain('scale(1, 1)');
    });
  });

  describe('error handling', () => {
    it('should handle continue drawing without start', () => {
      expect(() => {
        engine.continueDrawing({ x: 100, y: 100 });
      }).not.toThrow();
    });

    it('should handle end drawing without start', () => {
      expect(() => {
        engine.endDrawing();
      }).not.toThrow();
    });

    it('should handle empty stroke data', () => {
      engine.startDrawing({ x: 100, y: 100 }, 'pen', defaultToolSettings);
      engine.endDrawing(); // End immediately without continuing
      
      const data = engine.exportData();
      expect(data.strokes).toHaveLength(1);
      expect(data.strokes[0].points).toHaveLength(1);
    });
  });
});