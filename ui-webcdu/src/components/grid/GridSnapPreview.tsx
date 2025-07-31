import React from 'react';
import { useReactFlow } from 'reactflow';

interface GridSnapPreviewProps {
    dragPreview: {
        nodeId: string;
        originalPosition: { x: number; y: number };
        snapPosition: { x: number; y: number };
        isSnapping: boolean;
    } | null;
    gridSize: number;
}

/**
 * Component that shows a visual preview of where a node will snap during drag operations
 */
export function GridSnapPreview({ dragPreview, gridSize }: GridSnapPreviewProps) {
    const { getViewport } = useReactFlow();

    if (!dragPreview || !dragPreview.isSnapping) {
        return null;
    }

    const viewport = getViewport();

    // Convert flow coordinates to screen coordinates
    const screenX = dragPreview.snapPosition.x * viewport.zoom + viewport.x;
    const screenY = dragPreview.snapPosition.y * viewport.zoom + viewport.y;

    return (
        <div
            className="pointer-events-none absolute z-50"
            style={{
                left: screenX,
                top: screenY,
                transform: 'translate(-50%, -50%)',
            }}
        >
            {/* Snap target indicator */}
            <div
                className="border-2 border-blue-500 border-dashed bg-blue-100/20 rounded"
                style={{
                    width: 150 * viewport.zoom, // Default node width
                    height: 40 * viewport.zoom,  // Default node height
                }}
            />

            {/* Grid intersection indicator */}
            <div
                className="absolute bg-blue-500 rounded-full"
                style={{
                    width: 8 * viewport.zoom,
                    height: 8 * viewport.zoom,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                }}
            />
        </div>
    );
}