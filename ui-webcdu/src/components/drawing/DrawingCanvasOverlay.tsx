import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useReactFlow, useViewport } from 'reactflow';
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

    const { isDrawingMode, isVisible, layerState } = useDrawing();

    // Use optimized viewport synchronization
    const { viewport } = useViewportSync({
        throttleMs: 16, // 60fps
        significantChangeThreshold: {
            zoom: 0.01,
            position: 1
        }
    });

    // Memoize viewport offset to prevent unnecessary re-renders
    const viewportOffset = useMemo(() => ({ x: viewport.x, y: viewport.y }), [viewport.x, viewport.y]);

    // Update canvas size based on container size
    const updateCanvasSize = useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setCanvasSize({
                width: rect.width,
                height: rect.height,
            });
        }
    }, []);

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

    if (!isVisible || !layerState.isVisible) {
        return null;
    }

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 pointer-events-none ${className || ''}`}
            style={{
                zIndex: layerState.zIndex,
                opacity: layerState.opacity,
            }}
        >
            <DrawingCanvas
                width={canvasSize.width}
                height={canvasSize.height}
                scale={viewport.zoom}
                offset={viewportOffset}
                className={isDrawingMode && !layerState.locked ? 'pointer-events-auto' : 'pointer-events-none'}
            />
        </div>
    );
}