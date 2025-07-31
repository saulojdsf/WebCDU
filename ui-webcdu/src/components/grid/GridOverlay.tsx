import React from 'react';
import { useReactFlow } from 'reactflow';
import type { GridConfiguration } from '@/lib/grid-types';

interface GridOverlayProps {
    /** Grid configuration */
    config: GridConfiguration;
    /** Current zoom level for responsive visibility */
    zoom?: number;
}

/**
 * GridOverlay component renders a visual grid overlay on the canvas
 * Uses CSS-based rendering for performance with configurable grid size and styling
 * Implements dynamic grid density adjustment based on zoom level:
 * - Very low zoom (< 0.5): Shows major grid lines only (4x spacing)
 * - Low zoom (0.5-1.0): Shows every 2nd grid line (2x spacing)
 * - Normal zoom (1.0-3.0): Shows standard grid lines
 * - High zoom (> 3.0): Shows sub-grid lines (0.5x spacing)
 */
export const GridOverlay: React.FC<GridOverlayProps> = ({ config, zoom = 1 }) => {
    const { getViewport } = useReactFlow();

    // Don't render if overlay is disabled
    if (!config.showOverlay) {
        return null;
    }

    // Dynamic grid visibility thresholds based on zoom level
    const minZoomForVisibility = 0.25;
    const maxZoomForFullOpacity = 1.5;
    const highZoomThreshold = 3.0;

    // Hide grid when zoomed out too far to prevent visual clutter
    if (zoom < minZoomForVisibility) {
        return null;
    }

    // Calculate dynamic grid density based on zoom level
    let gridMultiplier = 1;
    let baseOpacity = 0.3;

    if (zoom < 0.5) {
        // At very low zoom, show only major grid lines (every 4th line)
        gridMultiplier = 4;
        baseOpacity = 0.2;
    } else if (zoom < 1.0) {
        // At low zoom, show every 2nd grid line
        gridMultiplier = 2;
        baseOpacity = 0.25;
    } else if (zoom > highZoomThreshold) {
        // At very high zoom, show sub-grid lines (half spacing)
        gridMultiplier = 0.5;
        baseOpacity = 0.4;
    }

    // Adjust grid opacity based on zoom level for smooth transitions
    const zoomOpacityFactor = Math.min(1, zoom / maxZoomForFullOpacity);
    const finalOpacity = baseOpacity * zoomOpacityFactor;

    // Calculate grid line spacing based on zoom and grid size with dynamic density
    const baseGridSize = config.size;
    const adjustedGridSize = baseGridSize * gridMultiplier;

    // Get viewport to calculate grid bounds
    const viewport = getViewport();
    const { x: viewportX, y: viewportY } = viewport;

    // Calculate visible area bounds
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    // Convert screen coordinates to flow coordinates
    const startX = -viewportX / zoom;
    const startY = -viewportY / zoom;
    const endX = startX + containerWidth / zoom;
    const endY = startY + containerHeight / zoom;

    // Calculate grid line positions using adjusted grid size
    const gridStartX = Math.floor(startX / adjustedGridSize) * adjustedGridSize;
    const gridStartY = Math.floor(startY / adjustedGridSize) * adjustedGridSize;
    const gridEndX = Math.ceil(endX / adjustedGridSize) * adjustedGridSize;
    const gridEndY = Math.ceil(endY / adjustedGridSize) * adjustedGridSize;

    // Generate vertical lines
    const verticalLines = [];
    for (let x = gridStartX; x <= gridEndX; x += adjustedGridSize) {
        verticalLines.push(
            <line
                key={`v-${x}`}
                x1={x}
                y1={gridStartY}
                x2={x}
                y2={gridEndY}
                stroke="currentColor"
                strokeWidth={1 / zoom}
                opacity={finalOpacity}
            />
        );
    }

    // Generate horizontal lines
    const horizontalLines = [];
    for (let y = gridStartY; y <= gridEndY; y += adjustedGridSize) {
        horizontalLines.push(
            <line
                key={`h-${y}`}
                x1={gridStartX}
                y1={y}
                x2={gridEndX}
                y2={y}
                stroke="currentColor"
                strokeWidth={1 / zoom}
                opacity={finalOpacity}
            />
        );
    }

    return (
        <svg
            className="grid-overlay"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                color: 'rgb(156, 163, 175)', // gray-400 for subtle appearance
            }}
            viewBox={`${gridStartX} ${gridStartY} ${gridEndX - gridStartX} ${gridEndY - gridStartY}`}
        >
            {verticalLines}
            {horizontalLines}
        </svg>
    );
};

export default GridOverlay;