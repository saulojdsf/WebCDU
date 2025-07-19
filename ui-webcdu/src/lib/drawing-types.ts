/**
 * Core types and interfaces for the drawing system
 */

export type DrawingTool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface ToolSettings {
  pen: {
    size: number;
    color: string;
    opacity: number;
  };
  eraser: {
    size: number;
  };
  shapes: {
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    filled: boolean;
  };
}

export interface Stroke {
  id: string;
  points: Point[];
  tool: 'pen' | 'eraser';
  settings: {
    size: number;
    color?: string;
    opacity?: number;
  };
  timestamp: number;
}

export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'line';
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings: {
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    filled: boolean;
  };
  timestamp: number;
}

export interface DrawingData {
  version: string;
  strokes: Stroke[];
  shapes: Shape[];
}

export interface LayerState {
  isVisible: boolean;
  opacity: number;
  zIndex: number;
  locked: boolean;
}

export interface DrawingContextState {
  isDrawingMode: boolean;
  currentTool: DrawingTool;
  toolSettings: ToolSettings;
  drawingData: DrawingData;
  isVisible: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement> | null;
  layerState: LayerState;
}

export interface DrawingContextActions {
  setDrawingMode: (enabled: boolean) => void;
  setCurrentTool: (tool: DrawingTool) => void;
  updateToolSettings: (tool: DrawingTool, settings: any) => void;
  addStroke: (stroke: Stroke) => void;
  addShape: (shape: Shape) => void;
  clearDrawing: () => void;
  setVisibility: (visible: boolean) => void;
  setCanvasRef: (ref: React.RefObject<HTMLCanvasElement>) => void;
  exportDrawingData: () => DrawingData;
  importDrawingData: (data: DrawingData) => void;
  // Layer management actions
  setLayerOpacity: (opacity: number) => void;
  setLayerZIndex: (zIndex: number) => void;
  setLayerLocked: (locked: boolean) => void;
  toggleLayerVisibility: () => void;
  resetLayer: () => void;
}

export type DrawingContextType = DrawingContextState & DrawingContextActions;