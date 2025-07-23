import { useCallback, useEffect, useState } from 'react';

export type GroupInteractionType = 'none' | 'selectable' | 'draggable' | 'resizable' | 'dragging' | 'resizing';

interface UseGroupCursorOptions {
    isHovered: boolean;
    isSelected: boolean;
    isDragging: boolean;
    isResizing: boolean;
    canDrag: boolean;
    canResize: boolean;
    canSelect: boolean;
}

export const useGroupCursor = ({
    isHovered,
    isSelected,
    isDragging,
    isResizing,
    canDrag,
    canResize,
    canSelect,
}: UseGroupCursorOptions) => {
    const [cursorType, setCursorType] = useState<GroupInteractionType>('none');

    // Determine the appropriate cursor type based on current state
    const determineCursorType = useCallback((): GroupInteractionType => {
        if (isDragging) return 'dragging';
        if (isResizing) return 'resizing';

        if (isHovered || isSelected) {
            if (canResize && isSelected) return 'resizable';
            if (canDrag) return 'draggable';
            if (canSelect) return 'selectable';
        }

        return 'none';
    }, [isHovered, isSelected, isDragging, isResizing, canDrag, canResize, canSelect]);

    // Update cursor type when dependencies change
    useEffect(() => {
        const newCursorType = determineCursorType();
        setCursorType(newCursorType);
    }, [determineCursorType]);

    // Get CSS cursor value
    const getCursorValue = useCallback((type: GroupInteractionType): string => {
        switch (type) {
            case 'selectable':
                return 'pointer';
            case 'draggable':
                return 'grab';
            case 'resizable':
                return 'nw-resize';
            case 'dragging':
                return 'grabbing';
            case 'resizing':
                return 'nw-resize';
            default:
                return 'default';
        }
    }, []);

    // Get CSS class name for cursor state
    const getCursorClassName = useCallback((type: GroupInteractionType): string => {
        switch (type) {
            case 'selectable':
                return 'group-hover-selectable';
            case 'draggable':
                return 'group-hover-draggable';
            case 'resizable':
                return 'group-hover-resizable';
            default:
                return '';
        }
    }, []);

    return {
        cursorType,
        cursorValue: getCursorValue(cursorType),
        cursorClassName: getCursorClassName(cursorType),
        isDraggingCursor: cursorType === 'dragging',
        isResizingCursor: cursorType === 'resizing',
    };
};

export default useGroupCursor;