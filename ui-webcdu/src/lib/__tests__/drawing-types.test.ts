import { describe, it, expect } from 'vitest';
import { 
  validateDrawingData, 
  calculateDistance, 
  calculateBounds,
  getDrawingStats,
  cloneDrawingData 
} from '../drawing-utils';
import { DrawingData, Point, Stroke, Shape } from '../drawing-types';

describe('Drawing Types and Utils', () => {
  const mockPoints: Point[] = [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
    { x: 20, y: 0 },
  ];

  const mockStroke: Stroke = {
    id: 'test-stroke-1',
    points: mockPoints,
    tool: 'pen',
    settings: {
      size: 2,
      color: '#000000',
      opacity: 1,
    },
    timestamp: Date.now(),
  };

  const mockShape: Shape = {
    id: 'test-shape-1',
    type: 'rectangle',
    bounds: { x: 0, y: 0, width: 100, height: 50 },
    settings: {
      strokeColor: '#000000',
      fillColor: '#ffffff',
      strokeWidth: 2,
      filled: false,
    },
    timestamp: Date.now(),
  };

  const mockDrawingData: DrawingData = {
    version: '1.0.0',
    strokes: [mockStroke],
    shapes: [mockShape],
  };

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const point1: Point = { x: 0, y: 0 };
      const point2: Point = { x: 3, y: 4 };
      const distance = calculateDistance(point1, point2);
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should return 0 for identical points', () => {
      const point: Point = { x: 5, y: 5 };
      const distance = calculateDistance(point, point);
      expect(distance).toBe(0);
    });
  });

  describe('calculateBounds', () => {
    it('should calculate correct bounds for points', () => {
      const bounds = calculateBounds(mockPoints);
      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 20,
        height: 10,
      });
    });

    it('should return zero bounds for empty points array', () => {
      const bounds = calculateBounds([]);
      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });
    });
  });

  describe('validateDrawingData', () => {
    it('should validate correct drawing data', () => {
      expect(validateDrawingData(mockDrawingData)).toBe(true);
    });

    it('should reject invalid drawing data', () => {
      expect(validateDrawingData(null)).toBe(false);
      expect(validateDrawingData({})).toBe(false);
      expect(validateDrawingData({ version: '1.0.0' })).toBe(false);
    });

    it('should reject drawing data with invalid strokes', () => {
      const invalidData = {
        ...mockDrawingData,
        strokes: [{ id: 'invalid' }],
      };
      expect(validateDrawingData(invalidData)).toBe(false);
    });
  });

  describe('getDrawingStats', () => {
    it('should calculate correct statistics', () => {
      const stats = getDrawingStats(mockDrawingData);
      expect(stats.totalStrokes).toBe(1);
      expect(stats.totalShapes).toBe(1);
      expect(stats.totalPoints).toBe(3);
      expect(stats.isEmpty).toBe(false);
    });

    it('should detect empty drawing', () => {
      const emptyData: DrawingData = {
        version: '1.0.0',
        strokes: [],
        shapes: [],
      };
      const stats = getDrawingStats(emptyData);
      expect(stats.isEmpty).toBe(true);
    });
  });

  describe('cloneDrawingData', () => {
    it('should create a deep copy of drawing data', () => {
      const cloned = cloneDrawingData(mockDrawingData);
      
      // Should be equal but not the same reference
      expect(cloned).toEqual(mockDrawingData);
      expect(cloned).not.toBe(mockDrawingData);
      expect(cloned.strokes).not.toBe(mockDrawingData.strokes);
      expect(cloned.shapes).not.toBe(mockDrawingData.shapes);
    });

    it('should allow independent modification of cloned data', () => {
      const cloned = cloneDrawingData(mockDrawingData);
      cloned.strokes[0].settings.color = '#ff0000';
      
      expect(cloned.strokes[0].settings.color).toBe('#ff0000');
      expect(mockDrawingData.strokes[0].settings.color).toBe('#000000');
    });
  });
});