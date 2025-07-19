import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DrawingEngine } from '../DrawingEngine';
import type { Point } from '../drawing-types';

// Mock window object and its properties
const mockRequestAnimationFrame = vi.fn();
const mockCancelAnimationFrame = vi.fn();

Object.defineProperty(global, 'window', {
  value: {
    requestAnimationFrame: mockRequestAnimationFrame,
    cancelAnimationFrame: mockCancelAnimationFrame,
    devicePixelRatio: 1,
    performance: {
      now: vi.fn(() => Date.now()),
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
});

// Also set these directly for compatibility
Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRequestAnimationFrame,
  writable: true,
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCancelAnimationFrame,
  writable: true,
});

Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
  },
  writable: true,
});

describe('DrawingEngine Viewport Synchronization', () => {
  let canvas: HTMLCanvasElement;
  let engine: DrawingEngine;
  let mockContext: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockRequestAnimationFrame.mockImplementation((callback) => {
      setTimeout(callback, 16);
      return 1;
    });

    // Create mock canvas and context
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    mockContext = {
      scale: vi.fn(),
      translate: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      strokeRect: vi.fn(),
      fillRect: vi.fn(),
      ellipse: vi.fn(),
      set lineCap(value: string) {},
      set lineJoin(value: string) {},
      set imageSmoothingEnabled(value: boolean) {},
      set strokeStyle(value: string) {},
      set fillStyle(value: string) {},
      set lineWidth(value: number) {},
      set globalAlpha(value: number) {},
      set globalCompositeOperation(value: string) {},
    };

    vi.spyOn(canvas, 'getContext').mockReturnValue(mockContext);
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
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

    engine = new DrawingEngine(canvas);
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('setViewportTransform', () => {
    it('should update viewport parameters', () => {
      const scale = 2;
      const offset: Point = { x: 100, y: 50 };

      engine.setViewportTransform(scale, offset);

      // Test coordinate transformation
      const screenPoint: Point = { x: 200, y: 150 };
      const canvasPoint = engine.screenToCanvas(screenPoint);

      expect(canvasPoint.x).toBe((200 - 100) / 2); // (screenX - offsetX) / scale
      expect(canvasPoint.y).toBe((150 - 50) / 2);  // (screenY - offsetY) / scale
    });

    it('should throttle viewport updates for performance', () => {
      const scale1 = 1;
      const offset1: Point = { x: 0, y: 0 };
      const scale2 = 2; // Significant change
      const offset2: Point = { x: 100, y: 100 }; // Significant change

      // First significant update should trigger requestAnimationFrame
      engine.setViewportTransform(scale1, offset1);
      const initialCallCount = mockRequestAnimationFrame.mock.calls.length;

      // Second significant update should also trigger requestAnimationFrame
      engine.setViewportTransform(scale2, offset2);
      expect(mockRequestAnimationFrame.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('should skip updates for insignificant changes', () => {
      const scale = 1;
      const offset: Point = { x: 0, y: 0 };

      engine.setViewportTransform(scale, offset);
      mockRequestAnimationFrame.mockClear();

      // Very small change should be ignored
      engine.setViewportTransform(1.0001, { x: 0.01, y: 0.01 });
      expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
    });

    it('should detect significant zoom changes', () => {
      engine.setViewportTransform(1, { x: 0, y: 0 });
      mockRequestAnimationFrame.mockClear();

      // Significant zoom change should trigger update
      engine.setViewportTransform(1.1, { x: 0, y: 0 });
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('should detect significant position changes', () => {
      engine.setViewportTransform(1, { x: 0, y: 0 });
      mockRequestAnimationFrame.mockClear();

      // Significant position change should trigger update
      engine.setViewportTransform(1, { x: 10, y: 10 });
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('forceViewportSync', () => {
    it('should immediately update viewport without throttling', () => {
      // First set up a pending animation frame
      engine.setViewportTransform(1, { x: 0, y: 0 });
      mockCancelAnimationFrame.mockClear();

      const scale = 2;
      const offset: Point = { x: 100, y: 50 };

      engine.forceViewportSync(scale, offset);

      // Should clear any pending animation frame if there was one
      // Note: cancelAnimationFrame might be called even if there's no pending frame
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('coordinate transformations', () => {
    beforeEach(() => {
      engine.setViewportTransform(2, { x: 100, y: 50 });
    });

    it('should transform screen coordinates to canvas coordinates', () => {
      const screenPoint: Point = { x: 300, y: 200 };
      const canvasPoint = engine.screenToCanvas(screenPoint);

      expect(canvasPoint.x).toBe(100); // (300 - 100) / 2
      expect(canvasPoint.y).toBe(75);  // (200 - 50) / 2
    });

    it('should transform canvas coordinates to screen coordinates', () => {
      const canvasPoint: Point = { x: 100, y: 75 };
      const screenPoint = engine.canvasToScreen(canvasPoint);

      expect(screenPoint.x).toBe(300); // 100 * 2 + 0 + 100
      expect(screenPoint.y).toBe(200); // 75 * 2 + 0 + 50
    });

    it('should preserve pressure information in transformations', () => {
      const pointWithPressure: Point = { x: 200, y: 150, pressure: 0.8 };
      
      const canvasPoint = engine.screenToCanvas(pointWithPressure);
      expect(canvasPoint.pressure).toBe(0.8);

      const screenPoint = engine.canvasToScreen(canvasPoint);
      expect(screenPoint.pressure).toBe(0.8);
    });
  });

  describe('performance optimizations', () => {
    it('should skip drawing when scale is too small', () => {
      engine.setViewportTransform(0.05, { x: 0, y: 0 }); // Very small scale
      
      engine.redraw();
      
      // Should clear canvas but not draw anything
      expect(mockContext.clearRect).toHaveBeenCalled();
      expect(mockContext.save).not.toHaveBeenCalled();
    });

    it('should implement viewport culling for strokes', () => {
      // Add a stroke that's outside the visible area
      const strokeData = {
        version: '1.0.0',
        strokes: [{
          id: 'test-stroke',
          points: [
            { x: -1000, y: -1000 },
            { x: -900, y: -900 }
          ],
          tool: 'pen' as const,
          settings: { size: 2, color: '#000000', opacity: 1 },
          timestamp: Date.now()
        }],
        shapes: []
      };

      engine.importData(strokeData);
      engine.setViewportTransform(1, { x: 0, y: 0 });
      
      engine.redraw();
      
      // Stroke should be culled (not drawn) because it's outside visible area
      expect(mockContext.stroke).not.toHaveBeenCalled();
    });

    it('should implement viewport culling for shapes', () => {
      // Add a shape that's outside the visible area
      const shapeData = {
        version: '1.0.0',
        strokes: [],
        shapes: [{
          id: 'test-shape',
          type: 'rectangle' as const,
          bounds: { x: -1000, y: -1000, width: 50, height: 50 },
          settings: {
            strokeColor: '#000000',
            fillColor: '#ffffff',
            strokeWidth: 2,
            filled: false
          },
          timestamp: Date.now()
        }]
      };

      engine.importData(shapeData);
      engine.setViewportTransform(1, { x: 0, y: 0 });
      
      engine.redraw();
      
      // Shape should be culled (not drawn) because it's outside visible area
      expect(mockContext.strokeRect).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cancel pending animation frames on destroy', () => {
      engine.setViewportTransform(2, { x: 100, y: 50 });
      
      engine.destroy();
      
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });
});