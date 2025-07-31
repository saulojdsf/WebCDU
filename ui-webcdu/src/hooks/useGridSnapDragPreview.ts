import { useState, useCallback, useRef } from 'react';
import type { Node } from 'reactflow';
import { NodePositionManager } from '@/lib/NodePositionManager';

/**
 * Hook for providing real-time grid snap preview during drag operations
 */
export function useGridSnapDragPreview(
    positionManager: NodePositionManager,
    isGridSnapEnabled: boolean
) {
    const [dragPreview, setDragPreview] = useState<{
        nodeId: string;
        originalPosition: { x: number; y: number };
        snapPosition: { x: number; y: number };
        isSnapping: boolean;
    } | null>(null);

    const dragStartPositionRef = useRef<{ x: number; y: number } | null>(null);

    const onDragStart = useCallback((event: React.MouseEvent, node: Node) => {
        if (!isGridSnapEnabled) return;

        dragStartPositionRef.current = { ...node.position };
        setDragPreview(null);
    }, [isGridSnapEnabled]);

    const onDrag = useCallback((event: React.MouseEvent, node: Node) => {
        if (!isGridSnapEnabled || !dragStartPositionRef.current) return;

        // Calculate where the node would snap to
        const snapPosition = positionManager.snapToGrid(node.position);
        const isSnapping = positionManager.shouldSnapToGrid(node.position);

        setDragPreview({
            nodeId: node.id,
            originalPosition: dragStartPositionRef.current,
            snapPosition: { x: snapPosition.x, y: snapPosition.y },
            isSnapping,
        });
    }, [isGridSnapEnabled, positionManager]);

    const onDragStop = useCallback((event: React.MouseEvent, node: Node) => {
        setDragPreview(null);
        dragStartPositionRef.current = null;
    }, []);

    const clearPreview = useCallback(() => {
        setDragPreview(null);
        dragStartPositionRef.current = null;
    }, []);

    return {
        dragPreview,
        onDragStart,
        onDrag,
        onDragStop,
        clearPreview,
    };
}