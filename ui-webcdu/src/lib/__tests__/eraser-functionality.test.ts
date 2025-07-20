import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DrawingEngine } from '../DrawingEngine';
import { ToolSettings } from '../drawing-types';

// Mock canvas setup (reusing from main test file)
class MockCanvasRenderingContext2D {
  public lineCap = 'butt';
  public lineJoin = 'miter';
  public lineWidth = 1;
  public strokeStyle = '#000000';
  public fillStyle = '#000000';
  public globalAlpha = 1;
  public globalCompositeOperation = 'source-over';
  public imageSmoothingEnabled = true;

  scale = vi.fn();
  translate = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
  fill = vi.fn();
  beginPath = vi.fn();
  closePath = vi.fn();
  clearRect = vi.fn();
  strokeRect = vi.fn();
  fillRect = vi.fn();
  ellipse = vi.fn();
  save = vi.fn();
  restore = vi.fn();
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
}

// Mock window.devicePixelRatio
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 1,
});

// Mock Path2D
class MockPath2D {
  moveTo = vi.fn();
  lineTo = vi.fn();
}

// @ts-ignore
global.Path2D = MockPath2D;

describe('Eraser Functionality Integration Tests', () => {
  let canvas: MockHTMLCanvasElement;
  let engine: DrawingEngine;

  const defaultToolSettings: ToolSettings = {
    pen: {
      size: 2,
      color: '#000000',
      opacity: 1,
    },
    eraser: {
      size: 20,
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
    engine = new DrawingEngine(canvas as any);
  });

  describe('Requirement 2.1: Eraser tool selection', () => {
    it('should enable erasing mode when eraser tool is selected', () => {
      // Start drawing with eraser tool
      engine.startDrawing({ x: 100, y: 100 }, 'eraser', defaultToolSettings);
      
      // Verify that eraser mode is active by checking that no stroke is added
      engine.endDrawing();
      
      const drawingData = engine.exportData();
      expect(drawingData.strokes).toHaveLength(0); // Eraser doesn't create strokes
    });
  });

  describe('Requirement 2.2: Eraser path removal', () => {
    it('should remove drawing content in the eraser path', () => {
      // Create a stroke to erase
      engine.startDrawing({ x: 100, y: 100 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 150, y: 150 });
      engine.endDrawing();
      
      expect(engine.exportData().strokes).toHaveLength(1);
      
      // Get the actual stroke point to ensure we hit it
      const stroke = engine.exportData().strokes[0];
      const firstPoint = stroke.points[0];
      const screenPoint = engine.canvasToScreen(firstPoint);
      
      // Erase at the exact location of the stroke
      engine.erase(screenPoint, defaultToolSettings.eraser.size);
      
      // Stroke should be removed
      expect(engine.exportData().strokes).toHaveLength(0);
    });
  });

  describe('Requirement 2.3: Eraser size configuration', () => {
    it('should apply new eraser size to subsequent erasing actions', () => {
      // Create multiple strokes at different distances
      engine.startDrawing({ x: 100, y: 100 }, 'pen', defaultToolSettings);
      engine.endDrawing();
      
      engine.startDrawing({ x: 150, y: 100 }, 'pen', defaultToolSettings);
      engine.endDrawing();
      
      engine.startDrawing({ x: 200, y: 100 }, 'pen', defaultToolSettings);
      engine.endDrawing();
      
      expect(engine.exportData().strokes).toHaveLength(3);
      
      // Get actual stroke positions
      const strokes = engine.exportData().strokes;
      const firstStrokePoint = engine.canvasToScreen(strokes[0].points[0]);
      
      // Use small eraser - should only remove one stroke
      engine.erase(firstStrokePoint, 10);
      expect(engine.exportData().strokes).toHaveLength(2);
      
      // Use large eraser - should remove remaining strokes
      const secondStrokePoint = engine.canvasToScreen(engine.exportData().strokes[0].points[0]);
      engine.erase(secondStrokePoint, 200);
      expect(engine.exportData().strokes).toHaveLength(0);
    });
  });

  describe('Requirement 2.4: Selective stroke removal', () => {
    it('should remove only overlapping portions when erasing overlaps with existing strokes', () => {
      // Create two separate strokes
      engine.startDrawing({ x: 50, y: 100 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 100, y: 100 });
      engine.endDrawing();
      
      engine.startDrawing({ x: 200, y: 100 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 250, y: 100 });
      engine.endDrawing();
      
      expect(engine.exportData().strokes).toHaveLength(2);
      
      // Get the actual position of the first stroke
      const firstStroke = engine.exportData().strokes[0];
      const firstStrokePoint = firstStroke.points[0];
      const screenPoint = engine.canvasToScreen(firstStrokePoint);
      
      // Erase only the first stroke with a small radius
      engine.erase(screenPoint, 30);
      
      const remainingStrokes = engine.exportData().strokes;
      expect(remainingStrokes).toHaveLength(1);
      
      // Verify the remaining stroke is the second one (around x=225)
      const remainingStroke = remainingStrokes[0];
      const avgX = remainingStroke.points.reduce((sum, p) => sum + p.x, 0) / remainingStroke.points.length;
      expect(avgX).toBeGreaterThan(150); // Should be the second stroke
    });
  });

  describe('Requirement 2.5: No action when no content exists', () => {
    it('should perform no action if no drawing content exists in the eraser path', () => {
      // Start with empty canvas
      expect(engine.exportData().strokes).toHaveLength(0);
      expect(engine.exportData().shapes).toHaveLength(0);
      
      // Try to erase on empty canvas
      engine.erase({ x: 100, y: 100 }, 50);
      
      // Should still be empty
      expect(engine.exportData().strokes).toHaveLength(0);
      expect(engine.exportData().shapes).toHaveLength(0);
    });

    it('should not affect strokes outside eraser radius', () => {
      // Create a stroke far from eraser
      engine.startDrawing({ x: 500, y: 500 }, 'pen', defaultToolSettings);
      engine.continueDrawing({ x: 550, y: 550 });
      engine.endDrawing();
      
      expect(engine.exportData().strokes).toHaveLength(1);
      
      // Erase far away from the stroke
      engine.erase({ x: 100, y: 100 }, 50);
      
      // Stroke should remain
      expect(engine.exportData().strokes).toHaveLength(1);
    });
  });

  describe('Shape erasing functionality', () => {
    it('should remove shapes within eraser radius', () => {
      // Create shapes
      engine.drawShape({ x: 100, y: 100 }, { x: 150, y: 150 }, 'rectangle', defaultToolSettings.shapes);
      engine.drawShape({ x: 200, y: 200 }, { x: 250, y: 250 }, 'circle', defaultToolSettings.shapes);
      
      expect(engine.exportData().shapes).toHaveLength(2);
      
      // Erase the first shape
      engine.erase({ x: 125, y: 125 }, 50);
      
      const remainingShapes = engine.exportData().shapes;
      expect(remainingShapes).toHaveLength(1);
      expect(remainingShapes[0].type).toBe('circle');
    });
  });

  describe('Continuous erasing', () => {
    it('should support continuous erasing during drag operations', () => {
      // Create multiple strokes in a line
      for (let i = 0; i < 5; i++) {
        engine.startDrawing({ x: 100 + i * 20, y: 100 }, 'pen', defaultToolSettings);
        engine.endDrawing();
      }
      
      expect(engine.exportData().strokes).toHaveLength(5);
      
      // Perform continuous erasing across multiple strokes
      engine.startDrawing({ x: 90, y: 100 }, 'eraser', defaultToolSettings);
      engine.continueDrawing({ x: 110, y: 100 });
      engine.continueDrawing({ x: 130, y: 100 });
      engine.continueDrawing({ x: 150, y: 100 });
      engine.endDrawing();
      
      // Should have removed strokes along the eraser path
      expect(engine.exportData().strokes.length).toBeLessThan(5);
    });
  });
});