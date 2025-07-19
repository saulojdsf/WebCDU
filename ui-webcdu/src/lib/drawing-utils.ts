import type { Point, DrawingData, Stroke, Shape } from './drawing-types';

/**
 * Utility functions for drawing operations
 */

// Calculate distance between two points
export function calculateDistance(point1: Point, point2: Point): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Smooth a path using simple averaging
export function smoothPath(points: Point[], smoothingFactor: number = 0.5): Point[] {
  if (points.length < 3) return points;

  const smoothed: Point[] = [points[0]]; // Keep first point

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];

    const smoothedX = current.x + (prev.x + next.x - 2 * current.x) * smoothingFactor;
    const smoothedY = current.y + (prev.y + next.y - 2 * current.y) * smoothingFactor;

    smoothed.push({
      x: smoothedX,
      y: smoothedY,
      pressure: current.pressure,
    });
  }

  smoothed.push(points[points.length - 1]); // Keep last point
  return smoothed;
}

// Convert screen coordinates to canvas coordinates
export function screenToCanvas(
  screenPoint: Point,
  canvasRect: DOMRect,
  scale: number = 1,
  offset: Point = { x: 0, y: 0 }
): Point {
  return {
    x: (screenPoint.x - canvasRect.left - offset.x) / scale,
    y: (screenPoint.y - canvasRect.top - offset.y) / scale,
  };
}

// Convert canvas coordinates to screen coordinates
export function canvasToScreen(
  canvasPoint: Point,
  canvasRect: DOMRect,
  scale: number = 1,
  offset: Point = { x: 0, y: 0 }
): Point {
  return {
    x: canvasPoint.x * scale + canvasRect.left + offset.x,
    y: canvasPoint.y * scale + canvasRect.top + offset.y,
  };
}

// Calculate bounding box for a set of points
export function calculateBounds(points: Point[]): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// Check if a point is within a rectangular bounds
export function isPointInBounds(
  point: Point,
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

// Validate drawing data structure
export function validateDrawingData(data: any): data is DrawingData {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.version !== 'string') return false;
  if (!Array.isArray(data.strokes)) return false;
  if (!Array.isArray(data.shapes)) return false;

  // Validate strokes
  for (const stroke of data.strokes) {
    if (!validateStroke(stroke)) return false;
  }

  // Validate shapes
  for (const shape of data.shapes) {
    if (!validateShape(shape)) return false;
  }

  return true;
}

// Validate stroke structure
function validateStroke(stroke: any): stroke is Stroke {
  if (!stroke || typeof stroke !== 'object') return false;
  if (typeof stroke.id !== 'string') return false;
  if (!Array.isArray(stroke.points)) return false;
  if (!['pen', 'eraser'].includes(stroke.tool)) return false;
  if (!stroke.settings || typeof stroke.settings !== 'object') return false;
  if (typeof stroke.timestamp !== 'number') return false;

  // Validate points
  for (const point of stroke.points) {
    if (!point || typeof point !== 'object') return false;
    if (typeof point.x !== 'number' || typeof point.y !== 'number') return false;
  }

  return true;
}

// Validate shape structure
function validateShape(shape: any): shape is Shape {
  if (!shape || typeof shape !== 'object') return false;
  if (typeof shape.id !== 'string') return false;
  if (!['rectangle', 'circle', 'line'].includes(shape.type)) return false;
  if (!shape.bounds || typeof shape.bounds !== 'object') return false;
  if (!shape.settings || typeof shape.settings !== 'object') return false;
  if (typeof shape.timestamp !== 'number') return false;

  // Validate bounds
  const { bounds } = shape;
  if (
    typeof bounds.x !== 'number' ||
    typeof bounds.y !== 'number' ||
    typeof bounds.width !== 'number' ||
    typeof bounds.height !== 'number'
  ) {
    return false;
  }

  return true;
}

// Create a deep copy of drawing data
export function cloneDrawingData(data: DrawingData): DrawingData {
  return {
    version: data.version,
    strokes: data.strokes.map(stroke => ({
      ...stroke,
      points: stroke.points.map(point => ({ ...point })),
      settings: { ...stroke.settings },
    })),
    shapes: data.shapes.map(shape => ({
      ...shape,
      bounds: { ...shape.bounds },
      settings: { ...shape.settings },
    })),
  };
}

// Get drawing data statistics
export function getDrawingStats(data: DrawingData) {
  const totalStrokes = data.strokes.length;
  const totalShapes = data.shapes.length;
  const totalPoints = data.strokes.reduce((sum, stroke) => sum + stroke.points.length, 0);
  
  const bounds = calculateDrawingBounds(data);
  
  return {
    totalStrokes,
    totalShapes,
    totalPoints,
    bounds,
    isEmpty: totalStrokes === 0 && totalShapes === 0,
  };
}

// Calculate overall bounds of all drawing elements
function calculateDrawingBounds(data: DrawingData): { x: number; y: number; width: number; height: number } {
  const allBounds: Array<{ x: number; y: number; width: number; height: number }> = [];

  // Add stroke bounds
  for (const stroke of data.strokes) {
    if (stroke.points.length > 0) {
      allBounds.push(calculateBounds(stroke.points));
    }
  }

  // Add shape bounds
  for (const shape of data.shapes) {
    allBounds.push(shape.bounds);
  }

  if (allBounds.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = allBounds[0].x;
  let maxX = allBounds[0].x + allBounds[0].width;
  let minY = allBounds[0].y;
  let maxY = allBounds[0].y + allBounds[0].height;

  for (const bounds of allBounds) {
    minX = Math.min(minX, bounds.x);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    minY = Math.min(minY, bounds.y);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}