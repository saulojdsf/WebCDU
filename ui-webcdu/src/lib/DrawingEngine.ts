import type { Point, DrawingTool, DrawingData, Stroke, Shape, ToolSettings } from './drawing-types';
import { calculateDistance, smoothPath } from './drawing-utils';

/**
 * Core drawing engine that handles canvas operations and drawing logic
 */
export class DrawingEngine {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private currentPath: Path2D | null = null;
  private currentStroke: Point[] = [];
  private isDrawing = false;
  private drawingData: DrawingData;
  private scale = 1;
  private offset: Point = { x: 0, y: 0 };
  private lastViewportUpdate = 0;
  private viewportUpdateThrottle = 16; // ~60fps
  private isDirty = false;
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D rendering context from canvas');
    }
    this.context = context;
    this.drawingData = {
      version: '1.0.0',
      strokes: [],
      shapes: [],
    };
    this.setupCanvas();
  }

  /**
   * Initialize canvas settings
   */
  private setupCanvas(): void {
    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    
    this.context.scale(dpr, dpr);
    
    // Set default drawing properties
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
    this.context.imageSmoothingEnabled = true;
  }

  /**
   * Set viewport transformation parameters for React Flow integration
   * Includes throttling for performance optimization
   */
  public setViewportTransform(scale: number, offset: Point): void {
    const now = performance.now();
    
    // Check if viewport actually changed
    const scaleChanged = Math.abs(this.scale - scale) > 0.001;
    const offsetChanged = Math.abs(this.offset.x - offset.x) > 0.1 || Math.abs(this.offset.y - offset.y) > 0.1;
    
    if (!scaleChanged && !offsetChanged) {
      return; // No significant change
    }
    
    this.scale = scale;
    this.offset = offset;
    
    // Throttle viewport updates for performance
    if (now - this.lastViewportUpdate < this.viewportUpdateThrottle) {
      this.isDirty = true;
      return;
    }
    
    this.lastViewportUpdate = now;
    this.isDirty = false;
    
    // Schedule redraw using requestAnimationFrame for smooth updates
    this.scheduleRedraw();
  }

  /**
   * Schedule a redraw using requestAnimationFrame for optimal performance
   */
  private scheduleRedraw(): void {
    if (this.animationFrameId !== null) {
      return; // Already scheduled
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      
      // Check if we need to handle any pending viewport updates
      if (this.isDirty) {
        this.isDirty = false;
        this.scheduleRedraw();
        return;
      }
      
      this.redraw();
    });
  }

  /**
   * Force immediate viewport synchronization (for critical updates)
   */
  public forceViewportSync(scale: number, offset: Point): void {
    this.scale = scale;
    this.offset = offset;
    this.lastViewportUpdate = performance.now();
    this.isDirty = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.redraw();
  }

  /**
   * Transform screen coordinates to canvas coordinates
   */
  public screenToCanvas(screenPoint: Point): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (screenPoint.x - rect.left - this.offset.x) / this.scale,
      y: (screenPoint.y - rect.top - this.offset.y) / this.scale,
      pressure: screenPoint.pressure,
    };
  }

  /**
   * Transform canvas coordinates to screen coordinates
   */
  public canvasToScreen(canvasPoint: Point): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: canvasPoint.x * this.scale + rect.left + this.offset.x,
      y: canvasPoint.y * this.scale + rect.top + this.offset.y,
      pressure: canvasPoint.pressure,
    };
  }

  private currentTool: DrawingTool = 'pen';
  private currentSettings: ToolSettings | null = null;

  /**
   * Start a new drawing operation
   */
  public startDrawing(point: Point, tool: DrawingTool, settings: ToolSettings): void {
    if (this.isDrawing) {
      this.endDrawing();
    }

    const canvasPoint = this.screenToCanvas(point);
    this.isDrawing = true;
    this.currentTool = tool;
    this.currentSettings = settings;
    this.currentStroke = [canvasPoint];

    if (tool === 'pen') {
      this.currentPath = new Path2D();
      this.setupPenDrawing(settings.pen);
      this.currentPath.moveTo(canvasPoint.x, canvasPoint.y);
    } else if (tool === 'eraser') {
      this.currentPath = null; // Eraser doesn't use path
      this.setupEraserDrawing(settings.eraser);
      // Start erasing immediately at the initial point
      this.erase(point, settings.eraser.size);
    }
  }

  /**
   * Continue the current drawing operation
   */
  public continueDrawing(point: Point): void {
    if (!this.isDrawing) {
      return;
    }

    const canvasPoint = this.screenToCanvas(point);
    this.currentStroke.push(canvasPoint);

    if (this.currentTool === 'eraser') {
      // For eraser, perform continuous erasing
      if (this.currentSettings) {
        this.erase(point, this.currentSettings.eraser.size);
      }
    } else if (this.currentPath) {
      // For pen tool, continue drawing the path
      this.currentPath.lineTo(canvasPoint.x, canvasPoint.y);

      // Draw the current segment
      this.context.save();
      this.applyViewportTransform();
      this.context.stroke(this.currentPath);
      this.context.restore();
    }
  }

  /**
   * End the current drawing operation
   */
  public endDrawing(): void {
    if (!this.isDrawing) {
      return;
    }

    this.isDrawing = false;

    if (this.currentStroke.length > 0 && this.currentTool === 'pen') {
      // Only save pen strokes to drawing data, eraser operations are destructive
      const smoothedPoints = smoothPath(this.currentStroke, 0.3);
      
      // Create stroke data
      const stroke: Stroke = {
        id: this.generateId(),
        points: smoothedPoints,
        tool: 'pen',
        settings: {
          size: this.currentSettings?.pen.size || 2,
          color: this.currentSettings?.pen.color || '#000000',
          opacity: this.currentSettings?.pen.opacity || 1,
        },
        timestamp: Date.now(),
      };

      this.drawingData.strokes.push(stroke);
    }

    this.currentPath = null;
    this.currentStroke = [];
    this.currentSettings = null;
  }

  /**
   * Erase drawing content at the specified point
   */
  public erase(point: Point, size: number): void {
    const canvasPoint = this.screenToCanvas(point);
    const eraseRadius = size / 2;

    // Find strokes that intersect with the eraser
    const strokesToRemove: string[] = [];
    const shapesToRemove: string[] = [];
    
    // Check strokes for intersection
    for (const stroke of this.drawingData.strokes) {
      if (this.strokeIntersectsWithEraser(stroke, canvasPoint, eraseRadius)) {
        strokesToRemove.push(stroke.id);
      }
    }

    // Check shapes for intersection
    for (const shape of this.drawingData.shapes) {
      if (this.shapeIntersectsWithEraser(shape, canvasPoint, eraseRadius)) {
        shapesToRemove.push(shape.id);
      }
    }

    // Remove intersecting strokes and shapes
    this.drawingData.strokes = this.drawingData.strokes.filter(
      stroke => !strokesToRemove.includes(stroke.id)
    );
    
    this.drawingData.shapes = this.drawingData.shapes.filter(
      shape => !shapesToRemove.includes(shape.id)
    );

    // Redraw the canvas
    this.redraw();
  }

  /**
   * Check if a stroke intersects with the eraser circle
   */
  private strokeIntersectsWithEraser(stroke: Stroke, eraserCenter: Point, eraserRadius: number): boolean {
    // Check if any point in the stroke is within the eraser radius
    for (const point of stroke.points) {
      const distance = calculateDistance(eraserCenter, point);
      if (distance <= eraserRadius) {
        return true;
      }
    }

    // Check if the eraser intersects with any line segment in the stroke
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i];
      const p2 = stroke.points[i + 1];
      
      if (this.lineSegmentIntersectsCircle(p1, p2, eraserCenter, eraserRadius)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if a shape intersects with the eraser circle
   */
  private shapeIntersectsWithEraser(shape: Shape, eraserCenter: Point, eraserRadius: number): boolean {
    const { bounds } = shape;
    
    switch (shape.type) {
      case 'rectangle':
        return this.rectangleIntersectsCircle(bounds, eraserCenter, eraserRadius);
      
      case 'circle':
        const shapeCenterX = bounds.x + bounds.width / 2;
        const shapeCenterY = bounds.y + bounds.height / 2;
        const shapeRadiusX = bounds.width / 2;
        const shapeRadiusY = bounds.height / 2;
        
        // For ellipses, use a simplified approach - check if eraser center is within the ellipse bounds
        const dx = Math.abs(eraserCenter.x - shapeCenterX);
        const dy = Math.abs(eraserCenter.y - shapeCenterY);
        
        return (dx <= shapeRadiusX + eraserRadius) && (dy <= shapeRadiusY + eraserRadius);
      
      case 'line':
        const lineStart = { x: bounds.x, y: bounds.y };
        const lineEnd = { x: bounds.x + bounds.width, y: bounds.y + bounds.height };
        
        return this.lineSegmentIntersectsCircle(lineStart, lineEnd, eraserCenter, eraserRadius);
      
      default:
        return false;
    }
  }

  /**
   * Check if a line segment intersects with a circle
   */
  private lineSegmentIntersectsCircle(p1: Point, p2: Point, center: Point, radius: number): boolean {
    // Vector from p1 to p2
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    
    // Vector from p1 to circle center
    const fx = center.x - p1.x;
    const fy = center.y - p1.y;
    
    // Project circle center onto line segment
    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = (fx * fx + fy * fy) - radius * radius;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      return false; // No intersection
    }
    
    const discriminantSqrt = Math.sqrt(discriminant);
    const t1 = (-b - discriminantSqrt) / (2 * a);
    const t2 = (-b + discriminantSqrt) / (2 * a);
    
    // Check if intersection points are within the line segment (t between 0 and 1)
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
  }

  /**
   * Check if a rectangle intersects with a circle
   */
  private rectangleIntersectsCircle(rect: { x: number; y: number; width: number; height: number }, center: Point, radius: number): boolean {
    // Find the closest point on the rectangle to the circle center
    const closestX = Math.max(rect.x, Math.min(center.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(center.y, rect.y + rect.height));
    
    // Calculate distance from circle center to closest point
    const dx = center.x - closestX;
    const dy = center.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= radius;
  }

  /**
   * Draw a geometric shape
   */
  public drawShape(start: Point, end: Point, shapeType: 'rectangle' | 'circle' | 'line', settings: ToolSettings['shapes']): void {
    const startCanvas = this.screenToCanvas(start);
    const endCanvas = this.screenToCanvas(end);

    const bounds = {
      x: Math.min(startCanvas.x, endCanvas.x),
      y: Math.min(startCanvas.y, endCanvas.y),
      width: Math.abs(endCanvas.x - startCanvas.x),
      height: Math.abs(endCanvas.y - startCanvas.y),
    };

    const shape: Shape = {
      id: this.generateId(),
      type: shapeType,
      bounds,
      settings: { ...settings },
      timestamp: Date.now(),
    };

    this.drawingData.shapes.push(shape);
    this.redraw();
  }

  /**
   * Preview a shape while drawing (doesn't save to data)
   */
  public previewShape(start: Point, end: Point, shapeType: 'rectangle' | 'circle' | 'line', settings: ToolSettings['shapes']): void {
    const startCanvas = this.screenToCanvas(start);
    const endCanvas = this.screenToCanvas(end);

    this.context.save();
    this.applyViewportTransform();
    this.setupShapeDrawing(settings);

    switch (shapeType) {
      case 'rectangle':
        this.drawRectanglePreview(startCanvas, endCanvas, settings);
        break;
      case 'circle':
        this.drawCirclePreview(startCanvas, endCanvas, settings);
        break;
      case 'line':
        this.drawLinePreview(startCanvas, endCanvas);
        break;
    }

    this.context.restore();
  }

  /**
   * Clear all drawing content
   */
  public clear(): void {
    this.drawingData.strokes = [];
    this.drawingData.shapes = [];
    this.clearCanvas();
  }

  /**
   * Export current drawing data
   */
  public exportData(): DrawingData {
    return {
      version: this.drawingData.version,
      strokes: [...this.drawingData.strokes],
      shapes: [...this.drawingData.shapes],
    };
  }

  /**
   * Import drawing data and redraw
   */
  public importData(data: DrawingData): void {
    this.drawingData = {
      version: data.version,
      strokes: [...data.strokes],
      shapes: [...data.shapes],
    };
    this.redraw();
  }

  /**
   * Redraw all drawing content with performance optimizations
   */
  public redraw(): void {
    this.clearCanvas();
    
    // Skip drawing if scale is too small (performance optimization)
    if (this.scale < 0.1) {
      return;
    }
    
    this.context.save();
    this.applyViewportTransform();

    // Calculate visible bounds for culling
    const visibleBounds = this.getVisibleBounds();

    // Draw all strokes with culling
    for (const stroke of this.drawingData.strokes) {
      if (this.isStrokeVisible(stroke, visibleBounds)) {
        this.drawStroke(stroke);
      }
    }

    // Draw all shapes with culling
    for (const shape of this.drawingData.shapes) {
      if (this.isShapeVisible(shape, visibleBounds)) {
        this.drawShape2D(shape);
      }
    }

    this.context.restore();
  }

  /**
   * Get the visible bounds in canvas coordinates for culling
   */
  private getVisibleBounds(): { x: number; y: number; width: number; height: number } {
    const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
    
    return {
      x: -this.offset.x / this.scale,
      y: -this.offset.y / this.scale,
      width: canvasWidth / this.scale,
      height: canvasHeight / this.scale,
    };
  }

  /**
   * Check if a stroke is visible within the current viewport
   */
  private isStrokeVisible(stroke: Stroke, bounds: { x: number; y: number; width: number; height: number }): boolean {
    if (stroke.points.length === 0) return false;
    
    // Get stroke bounding box
    let minX = stroke.points[0].x;
    let maxX = stroke.points[0].x;
    let minY = stroke.points[0].y;
    let maxY = stroke.points[0].y;
    
    for (const point of stroke.points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    // Add stroke width padding
    const padding = stroke.settings.size / 2;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;
    
    // Check intersection with visible bounds
    return !(maxX < bounds.x || minX > bounds.x + bounds.width ||
             maxY < bounds.y || minY > bounds.y + bounds.height);
  }

  /**
   * Check if a shape is visible within the current viewport
   */
  private isShapeVisible(shape: Shape, bounds: { x: number; y: number; width: number; height: number }): boolean {
    const shapeBounds = shape.bounds;
    
    // Add stroke width padding
    const padding = shape.settings.strokeWidth / 2;
    const minX = shapeBounds.x - padding;
    const maxX = shapeBounds.x + shapeBounds.width + padding;
    const minY = shapeBounds.y - padding;
    const maxY = shapeBounds.y + shapeBounds.height + padding;
    
    // Check intersection with visible bounds
    return !(maxX < bounds.x || minX > bounds.x + bounds.width ||
             maxY < bounds.y || minY > bounds.y + bounds.height);
  }

  /**
   * Resize canvas and redraw
   */
  public resize(): void {
    this.setupCanvas();
    this.redraw();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Private helper methods

  private applyViewportTransform(): void {
    this.context.translate(this.offset.x, this.offset.y);
    this.context.scale(this.scale, this.scale);
  }

  private setupPenDrawing(settings: ToolSettings['pen']): void {
    this.context.strokeStyle = settings.color;
    this.context.lineWidth = settings.size;
    this.context.globalAlpha = settings.opacity;
    this.context.globalCompositeOperation = 'source-over';
  }

  private setupEraserDrawing(settings: ToolSettings['eraser']): void {
    this.context.lineWidth = settings.size;
    this.context.globalCompositeOperation = 'destination-out';
  }

  private setupShapeDrawing(settings: ToolSettings['shapes']): void {
    this.context.strokeStyle = settings.strokeColor;
    this.context.fillStyle = settings.fillColor;
    this.context.lineWidth = settings.strokeWidth;
    this.context.globalAlpha = 1;
    this.context.globalCompositeOperation = 'source-over';
  }

  private drawStroke(stroke: Stroke): void {
    if (stroke.points.length === 0) return;

    this.context.save();
    
    // Apply stroke settings
    this.context.strokeStyle = stroke.settings.color || '#000000';
    this.context.lineWidth = stroke.settings.size;
    this.context.globalAlpha = stroke.settings.opacity || 1;
    
    if (stroke.tool === 'eraser') {
      this.context.globalCompositeOperation = 'destination-out';
    }

    // Draw the stroke
    const path = new Path2D();
    path.moveTo(stroke.points[0].x, stroke.points[0].y);
    
    for (let i = 1; i < stroke.points.length; i++) {
      path.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    
    this.context.stroke(path);
    this.context.restore();
  }

  private drawShape2D(shape: Shape): void {
    this.context.save();
    this.setupShapeDrawing(shape.settings);

    const { bounds } = shape;

    switch (shape.type) {
      case 'rectangle':
        if (shape.settings.filled) {
          this.context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }
        this.context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        break;

      case 'circle':
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const radiusX = bounds.width / 2;
        const radiusY = bounds.height / 2;
        
        this.context.beginPath();
        this.context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        
        if (shape.settings.filled) {
          this.context.fill();
        }
        this.context.stroke();
        break;

      case 'line':
        this.context.beginPath();
        this.context.moveTo(bounds.x, bounds.y);
        this.context.lineTo(bounds.x + bounds.width, bounds.y + bounds.height);
        this.context.stroke();
        break;
    }

    this.context.restore();
  }

  private drawRectanglePreview(start: Point, end: Point, settings: ToolSettings['shapes']): void {
    const width = end.x - start.x;
    const height = end.y - start.y;
    
    if (settings.filled) {
      this.context.fillRect(start.x, start.y, width, height);
    }
    this.context.strokeRect(start.x, start.y, width, height);
  }

  private drawCirclePreview(start: Point, end: Point, settings: ToolSettings['shapes']): void {
    const centerX = (start.x + end.x) / 2;
    const centerY = (start.y + end.y) / 2;
    const radiusX = Math.abs(end.x - start.x) / 2;
    const radiusY = Math.abs(end.y - start.y) / 2;
    
    this.context.beginPath();
    this.context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    
    if (settings.filled) {
      this.context.fill();
    }
    this.context.stroke();
  }

  private drawLinePreview(start: Point, end: Point): void {
    this.context.beginPath();
    this.context.moveTo(start.x, start.y);
    this.context.lineTo(end.x, end.y);
    this.context.stroke();
  }

  private clearCanvas(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}