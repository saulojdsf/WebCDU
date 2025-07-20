import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useReactFlow } from 'reactflow';
import { DrawingCanvas } from './DrawingCanvas';
import { useDrawing } from '../../contexts/DrawingContext';
import { useViewportSync } from '../../hooks/useViewportSync';

interface DrawingCanvasOverlayProps {
    className?: string;
}

/**
 * DrawingCanvasOverlay integrates the DrawingCanvas with React Flow
 * It automatically syncs the canvas size and viewport transformations
 */
export function DrawingCanvasOverlay({ className }: DrawingCanvasOverlayProps) {
    const reactFlowInstance = useReactFlow();
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const drawingEngineRef = useRef<any>(null);
    const lastSyncTimeRef = useRef<number>(0);
    const pendingSyncRef = useRef<boolean>(false);

    const { isDrawingMode, isVisible, layerState, canvasRef } = useDrawing();

    // Get reference to the drawing engine from the canvas
    useEffect(() => {
        if (canvasRef?.current) {
            // Wait for the DrawingEngine to be initialized
            const checkForDrawingEngine = () => {
                // Access the DrawingEngine instance from the canvas element
                const engine = (canvasRef.current as any)._drawingEngine;
                if (engine) {
                    drawingEngineRef.current = engine;

                    // If we're in drawing mode, immediately sync the viewport
                    if (isDrawingMode) {
                        const currentViewport = reactFlowInstance.getViewport();
                        engine.forceViewportSync(currentViewport.zoom, {
                            x: currentViewport.x,
                            y: currentViewport.y
                        });
                    }
                } else {
                    // Try again in a moment
                    setTimeout(checkForDrawingEngine, 100);
                }
            };

            checkForDrawingEngine();
        }
    }, [canvasRef, isDrawingMode, reactFlowInstance]);

    // Use enhanced viewport synchronization with performance optimizations
    const { viewport, shouldSkipRender, forceSyncViewport, getVisibleBounds } = useViewportSync({
        throttleMs: 16, // Base throttle at 60fps
        significantChangeThreshold: {
            zoom: 0.01,
            position: 1
        },
        performanceMode: 'balanced', // Balance between quality and performance
        onViewportChange: (viewport) => {
            // Handle viewport changes with optimizations
            const now = performance.now();
            const timeSinceLastSync = now - lastSyncTimeRef.current;

            // Always force sync if we're in drawing mode to ensure accuracy
            if (isDrawingMode) {
                if (drawingEngineRef.current) {
                    drawingEngineRef.current.forceViewportSync(viewport.zoom, { x: viewport.x, y: viewport.y });
                }
                lastSyncTimeRef.current = now;
                pendingSyncRef.current = false;
                return;
            }

            // Force sync if it's been too long since the last sync
            if (timeSinceLastSync > 500) {
                lastSyncTimeRef.current = now;
                pendingSyncRef.current = false;

                // Force immediate redraw with the new viewport
                if (drawingEngineRef.current) {
                    drawingEngineRef.current.forceViewportSync(viewport.zoom, { x: viewport.x, y: viewport.y });
                }
            } else if (!pendingSyncRef.current) {
                // Schedule a sync for the next animation frame
                pendingSyncRef.current = true;
                requestAnimationFrame(() => {
                    if (pendingSyncRef.current) {
                        lastSyncTimeRef.current = performance.now();
                        pendingSyncRef.current = false;

                        // Apply the viewport update
                        if (drawingEngineRef.current) {
                            drawingEngineRef.current.setViewportTransform(viewport.zoom, { x: viewport.x, y: viewport.y });
                        }
                    }
                });
            }
        }
    });

    // Memoize viewport offset to prevent unnecessary re-renders
    const viewportOffset = useMemo(() => ({ x: viewport.x, y: viewport.y }), [viewport.x, viewport.y]);

    // Ensure viewport is always in sync when in drawing mode
    useEffect(() => {
        if (isDrawingMode && drawingEngineRef.current) {
            const currentViewport = reactFlowInstance.getViewport();
            // Only sync if there's a significant difference
            const currentScale = drawingEngineRef.current.getScale();
            const currentOffset = drawingEngineRef.current.getOffset();

            const scaleChanged = Math.abs(currentScale - currentViewport.zoom) > 0.001;
            const offsetChanged = Math.abs(currentOffset.x - currentViewport.x) > 0.1 ||
                Math.abs(currentOffset.y - currentViewport.y) > 0.1;

            if (scaleChanged || offsetChanged) {
                console.log('Viewport out of sync - forcing sync:', {
                    currentScale,
                    targetScale: currentViewport.zoom,
                    currentOffset,
                    targetOffset: { x: currentViewport.x, y: currentViewport.y }
                });
                drawingEngineRef.current.forceViewportSync(currentViewport.zoom, {
                    x: currentViewport.x,
                    y: currentViewport.y
                });
            }
        }
    });

    // Add a continuous sync check while in drawing mode to catch any drift
    useEffect(() => {
        if (!isDrawingMode) return;

        const syncInterval = setInterval(() => {
            if (drawingEngineRef.current) {
                const currentViewport = reactFlowInstance.getViewport();
                const currentScale = drawingEngineRef.current.getScale();
                const currentOffset = drawingEngineRef.current.getOffset();

                const scaleChanged = Math.abs(currentScale - currentViewport.zoom) > 0.01;
                const offsetChanged = Math.abs(currentOffset.x - currentViewport.x) > 1 ||
                    Math.abs(currentOffset.y - currentViewport.y) > 1;

                if (scaleChanged || offsetChanged) {
                    console.log('Periodic sync - viewport drift detected:', {
                        currentScale,
                        targetScale: currentViewport.zoom,
                        currentOffset,
                        targetOffset: { x: currentViewport.x, y: currentViewport.y }
                    });
                    drawingEngineRef.current.forceViewportSync(currentViewport.zoom, {
                        x: currentViewport.x,
                        y: currentViewport.y
                    });
                }
            }
        }, 100); // Check every 100ms while in drawing mode

        return () => clearInterval(syncInterval);
    }, [isDrawingMode, reactFlowInstance]);

    // Update canvas size based on container size
    const updateCanvasSize = useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCanvasSize({
                width: rect.width,
                height: rect.height,
            });

            // Force viewport sync after resize
            if (drawingEngineRef.current) {
                setTimeout(() => {
                    forceSyncViewport();
                }, 50);
            }
        }
    }, [forceSyncViewport]);

    // Update canvas size on mount and window resize
    useEffect(() => {
        updateCanvasSize();

        const handleResize = () => {
            updateCanvasSize();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [updateCanvasSize]);

    // Update canvas size when React Flow instance changes
    useEffect(() => {
        if (reactFlowInstance) {
            const resizeObserver = new ResizeObserver(() => {
                updateCanvasSize();
            });

            const reactFlowElement = document.querySelector('.react-flow');
            if (reactFlowElement) {
                resizeObserver.observe(reactFlowElement);
            }

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [reactFlowInstance, updateCanvasSize]);

    // Force sync viewport when switching to drawing mode
    useEffect(() => {
        if (isDrawingMode && drawingEngineRef.current) {
            // Force immediate viewport sync with current React Flow viewport
            const currentViewport = reactFlowInstance.getViewport();
            console.log('Drawing mode activated - syncing viewport:', currentViewport);

            // Add a small delay to ensure React Flow has finished any pending updates
            setTimeout(() => {
                if (drawingEngineRef.current) {
                    drawingEngineRef.current.forceViewportSync(currentViewport.zoom, {
                        x: currentViewport.x,
                        y: currentViewport.y
                    });
                }
            }, 10);
        }
    }, [isDrawingMode, reactFlowInstance]);

    // Handle React Flow panning end event for better synchronization
    useEffect(() => {
        const handlePanningEnd = () => {
            if (drawingEngineRef.current) {
                const currentViewport = reactFlowInstance.getViewport();
                drawingEngineRef.current.forceViewportSync(currentViewport.zoom, {
                    x: currentViewport.x,
                    y: currentViewport.y
                });
            }
        };

        const reactFlowPane = document.querySelector('.react-flow__pane');
        if (reactFlowPane) {
            reactFlowPane.addEventListener('mouseup', handlePanningEnd);
            reactFlowPane.addEventListener('touchend', handlePanningEnd);
        }

        return () => {
            if (reactFlowPane) {
                reactFlowPane.removeEventListener('mouseup', handlePanningEnd);
                reactFlowPane.removeEventListener('touchend', handlePanningEnd);
            }
        };
    }, [reactFlowInstance]);

    if (!isVisible || !layerState.isVisible) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 ${isDrawingMode && !layerState.locked ? 'pointer-events-auto' : 'pointer-events-none'} ${className || ''}`}
            style={{
                zIndex: isDrawingMode ? 1000 : layerState.zIndex,
                opacity: layerState.opacity,
            }}
        >
            <DrawingCanvas
                width={canvasSize.width}
                height={canvasSize.height}
                scale={viewport.zoom}
                offset={viewportOffset}
                className="pointer-events-auto"
                onViewportSync={() => {
                    if (drawingEngineRef.current) {
                        const currentViewport = reactFlowInstance.getViewport();
                        drawingEngineRef.current.forceViewportSync(currentViewport.zoom, {
                            x: currentViewport.x,
                            y: currentViewport.y
                        });
                    }
                }}
            />
        </div>
    );
}