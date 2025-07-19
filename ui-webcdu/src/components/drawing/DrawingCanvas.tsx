import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useDrawing } from '../../contexts/DrawingContext';
import { DrawingEngine } from '../../lib/DrawingEngine';
import type { Point } from '../../lib/drawing-types';

interface DrawingCanvasProps {
    width: number;
    height: number;
    scale?: number;
    offset?: Point;
    className?: string;
}

export function DrawingCanvas({
    width,
    height,
    scale = 1,
    offset = { x: 0, y: 0 },
    className = ''
}: DrawingCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingEngineRef = useRef<DrawingEngine | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState<Point | null>(null);
    const [isShiftPressed, setIsShiftPressed] = useState(false);

    const {
        isDrawingMode,
        currentTool,
        toolSettings,
        isVisible,
        layerState,
        setCanvasRef,
        addStroke,
        exportDrawingData,
        importDrawingData
    } = useDrawing();

    // Initialize drawing engine
    useEffect(() => {
        if (canvasRef.current && !drawingEngineRef.current) {
            try {
                drawingEngineRef.current = new DrawingEngine(canvasRef.current);
                setCanvasRef(canvasRef as React.RefObject<HTMLCanvasElement>);
            } catch (error) {
                console.error('Failed to initialize DrawingEngine:', error);
            }
        }
    }, [setCanvasRef]);

    // Update viewport transformation when scale or offset changes
    useEffect(() => {
        if (drawingEngineRef.current) {
            drawingEngineRef.current.setViewportTransform(scale, offset);
        }
    }, [scale, offset]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (drawingEngineRef.current) {
                drawingEngineRef.current.destroy();
            }
        };
    }, []);

    // Handle canvas resize
    useEffect(() => {
        if (drawingEngineRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            drawingEngineRef.current.resize();
        }
    }, [width, height]);

    // Sync drawing data with context
    useEffect(() => {
        if (drawingEngineRef.current) {
            const currentData = exportDrawingData();
            drawingEngineRef.current.importData(currentData);
        }
    }, [exportDrawingData]);

    // Handle keyboard events for shape constraints
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Shift') {
                setIsShiftPressed(true);
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.key === 'Shift') {
                setIsShiftPressed(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Get mouse position relative to canvas
    const getMousePosition = useCallback((event: React.MouseEvent<HTMLCanvasElement>): Point => {
        if (!canvasRef.current) return { x: 0, y: 0 };

        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }, []);

    // Apply shape constraints when Shift is pressed
    const applyShapeConstraints = useCallback((start: Point, end: Point): Point => {
        if (!isShiftPressed) return end;

        const dx = end.x - start.x;
        const dy = end.y - start.y;

        if (currentTool === 'rectangle') {
            // Make perfect square
            const size = Math.min(Math.abs(dx), Math.abs(dy));
            return {
                x: start.x + (dx >= 0 ? size : -size),
                y: start.y + (dy >= 0 ? size : -size),
            };
        } else if (currentTool === 'circle') {
            // Make perfect circle
            const size = Math.min(Math.abs(dx), Math.abs(dy));
            return {
                x: start.x + (dx >= 0 ? size : -size),
                y: start.y + (dy >= 0 ? size : -size),
            };
        } else if (currentTool === 'line') {
            // Snap to 45-degree angles
            const angle = Math.atan2(dy, dx);
            const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
            const distance = Math.sqrt(dx * dx + dy * dy);
            return {
                x: start.x + Math.cos(snapAngle) * distance,
                y: start.y + Math.sin(snapAngle) * distance,
            };
        }

        return end;
    }, [isShiftPressed, currentTool]);

    // Handle mouse down - start drawing
    const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawingMode || !drawingEngineRef.current || layerState.locked) {
            return;
        }

        event.preventDefault();
        const point = getMousePosition(event);

        setIsDrawing(true);

        if (currentTool === 'pen' || currentTool === 'eraser') {
            // For pen and eraser, start drawing immediately
            drawingEngineRef.current.startDrawing(point, currentTool, toolSettings);
        } else if (['rectangle', 'circle', 'line'].includes(currentTool)) {
            // For shapes, just store the start point
            setStartPoint(point);
        }
    }, [isDrawingMode, currentTool, toolSettings, getMousePosition]);

    // Handle mouse move - continue drawing or show shape preview
    const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !drawingEngineRef.current || layerState.locked) {
            return;
        }

        event.preventDefault();
        const point = getMousePosition(event);

        if (currentTool === 'pen' || currentTool === 'eraser') {
            // For pen and eraser, continue drawing
            drawingEngineRef.current.continueDrawing(point);
        } else if (['rectangle', 'circle', 'line'].includes(currentTool) && startPoint) {
            // For shapes, show preview
            const constrainedPoint = applyShapeConstraints(startPoint, point);

            // Clear canvas and redraw everything with preview
            drawingEngineRef.current.redraw();
            drawingEngineRef.current.previewShape(
                startPoint,
                constrainedPoint,
                currentTool as 'rectangle' | 'circle' | 'line',
                toolSettings.shapes
            );
        }
    }, [isDrawing, currentTool, getMousePosition, startPoint, applyShapeConstraints, toolSettings.shapes]);

    // Handle mouse up - end drawing
    const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !drawingEngineRef.current || layerState.locked) {
            return;
        }

        event.preventDefault();
        const point = getMousePosition(event);

        if (currentTool === 'pen' || currentTool === 'eraser') {
            // For pen and eraser, end drawing normally
            drawingEngineRef.current.endDrawing();
        } else if (['rectangle', 'circle', 'line'].includes(currentTool) && startPoint) {
            // For shapes, finalize the shape
            const constrainedPoint = applyShapeConstraints(startPoint, point);
            drawingEngineRef.current.drawShape(
                startPoint,
                constrainedPoint,
                currentTool as 'rectangle' | 'circle' | 'line',
                toolSettings.shapes
            );
        }

        setIsDrawing(false);
        setStartPoint(null);

        // Export the updated drawing data and sync with context
        const updatedData = drawingEngineRef.current.exportData();
        importDrawingData(updatedData);
    }, [isDrawing, currentTool, startPoint, applyShapeConstraints, toolSettings.shapes, getMousePosition, importDrawingData]);

    // Handle mouse leave - end drawing if in progress
    const handleMouseLeave = useCallback(() => {
        if (isDrawing && drawingEngineRef.current) {
            if (currentTool === 'pen' || currentTool === 'eraser') {
                drawingEngineRef.current.endDrawing();
            }

            setIsDrawing(false);
            setStartPoint(null);

            // For shapes, just clear the preview by redrawing
            if (['rectangle', 'circle', 'line'].includes(currentTool)) {
                drawingEngineRef.current.redraw();
            } else {
                // Export the updated drawing data and sync with context
                const updatedData = drawingEngineRef.current.exportData();
                importDrawingData(updatedData);
            }
        }
    }, [isDrawing, currentTool, importDrawingData]);

    // Update cursor based on current tool and drawing mode
    const getCursor = useCallback(() => {
        if (!isDrawingMode || layerState.locked) return 'default';

        switch (currentTool) {
            case 'pen':
                return 'crosshair';
            case 'eraser':
                return 'grab';
            case 'rectangle':
            case 'circle':
            case 'line':
                return 'crosshair';
            default:
                return 'crosshair';
        }
    }, [isDrawingMode, currentTool, layerState.locked]);

    // Prevent context menu on right click
    const handleContextMenu = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        event.preventDefault();
    }, []);

    if (!isVisible) {
        return null;
    }

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`absolute top-0 left-0 pointer-events-auto ${className}`}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                cursor: getCursor(),
                zIndex: layerState.zIndex,
                opacity: layerState.opacity,
                pointerEvents: layerState.locked ? 'none' : 'auto',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
        />
    );
}