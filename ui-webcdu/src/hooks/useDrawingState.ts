import { useCallback } from 'react';
import { useDrawing } from '../contexts/DrawingContext';
import type { DrawingTool, Point, Stroke, Shape } from '../lib/drawing-types';

/**
 * Custom hook for managing drawing state and operations
 * Provides higher-level drawing operations built on top of the DrawingContext
 */
export function useDrawingState() {
  const drawing = useDrawing();

  // Helper function to generate unique IDs
  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Create a new stroke with current tool settings
  const createStroke = useCallback((points: Point[]): Stroke => {
    const { currentTool, toolSettings } = drawing;
    
    if (currentTool !== 'pen' && currentTool !== 'eraser') {
      throw new Error('createStroke can only be used with pen or eraser tools');
    }

    const settings = currentTool === 'pen' 
      ? {
          size: toolSettings.pen.size,
          color: toolSettings.pen.color,
          opacity: toolSettings.pen.opacity,
        }
      : {
          size: toolSettings.eraser.size,
        };

    return {
      id: generateId(),
      points,
      tool: currentTool,
      settings,
      timestamp: Date.now(),
    };
  }, [drawing, generateId]);

  // Create a new shape with current tool settings
  const createShape = useCallback((
    type: 'rectangle' | 'circle' | 'line',
    bounds: { x: number; y: number; width: number; height: number }
  ): Shape => {
    const { toolSettings } = drawing;

    return {
      id: generateId(),
      type,
      bounds,
      settings: {
        strokeColor: toolSettings.shapes.strokeColor,
        fillColor: toolSettings.shapes.fillColor,
        strokeWidth: toolSettings.shapes.strokeWidth,
        filled: toolSettings.shapes.filled,
      },
      timestamp: Date.now(),
    };
  }, [drawing, generateId]);

  // Start a new drawing stroke
  const startStroke = useCallback((startPoint: Point) => {
    // This will be used by the DrawingCanvas component
    // For now, we just return the starting point
    return [startPoint];
  }, []);

  // Continue a drawing stroke
  const continueStroke = useCallback((currentPoints: Point[], newPoint: Point) => {
    return [...currentPoints, newPoint];
  }, []);

  // Finish a drawing stroke and add it to the drawing data
  const finishStroke = useCallback((points: Point[]) => {
    if (points.length > 0) {
      const stroke = createStroke(points);
      drawing.addStroke(stroke);
      return stroke;
    }
    return null;
  }, [createStroke, drawing]);

  // Add a shape to the drawing data
  const addShape = useCallback((
    type: 'rectangle' | 'circle' | 'line',
    bounds: { x: number; y: number; width: number; height: number }
  ) => {
    const shape = createShape(type, bounds);
    drawing.addShape(shape);
    return shape;
  }, [createShape, drawing]);

  // Toggle drawing mode
  const toggleDrawingMode = useCallback(() => {
    drawing.setDrawingMode(!drawing.isDrawingMode);
  }, [drawing]);

  // Get current tool cursor style
  const getCursorStyle = useCallback(() => {
    const { currentTool, toolSettings } = drawing;
    
    switch (currentTool) {
      case 'pen':
        return `crosshair`;
      case 'eraser':
        return `crosshair`;
      case 'rectangle':
      case 'circle':
      case 'line':
        return `crosshair`;
      default:
        return 'default';
    }
  }, [drawing]);

  // Check if current tool is a shape tool
  const isShapeTool = useCallback(() => {
    return ['rectangle', 'circle', 'line'].includes(drawing.currentTool);
  }, [drawing.currentTool]);

  // Check if current tool is a drawing tool (pen/eraser)
  const isDrawingTool = useCallback(() => {
    return ['pen', 'eraser'].includes(drawing.currentTool);
  }, [drawing.currentTool]);

  return {
    // State from context
    ...drawing,
    
    // Helper functions
    createStroke,
    createShape,
    startStroke,
    continueStroke,
    finishStroke,
    addShape,
    toggleDrawingMode,
    getCursorStyle,
    isShapeTool,
    isDrawingTool,
  };
}