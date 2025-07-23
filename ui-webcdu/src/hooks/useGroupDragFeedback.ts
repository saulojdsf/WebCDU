import { useState, useCallback, useEffect } from 'react';

interface DragFeedbackState {
    isDragging: boolean;
    dragOffset: { x: number; y: number };
    isValidDrop: boolean;
    dragStartTime: number | null;
    dragDistance: number;
}

interface UseGroupDragFeedbackOptions {
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onValidDropChange?: (isValid: boolean) => void;
    validateDrop?: (offset: { x: number; y: number }) => boolean;
}

export const useGroupDragFeedback = ({
    onDragStart,
    onDragEnd,
    onValidDropChange,
    validateDrop,
}: UseGroupDragFeedbackOptions = {}) => {
    const [feedbackState, setFeedbackState] = useState<DragFeedbackState>({
        isDragging: false,
        dragOffset: { x: 0, y: 0 },
        isValidDrop: true,
        dragStartTime: null,
        dragDistance: 0,
    });

    // Start drag feedback
    const startDragFeedback = useCallback(() => {
        setFeedbackState(prev => ({
            ...prev,
            isDragging: true,
            dragStartTime: Date.now(),
            dragOffset: { x: 0, y: 0 },
            dragDistance: 0,
            isValidDrop: true,
        }));
        onDragStart?.();
    }, [onDragStart]);

    // Update drag feedback
    const updateDragFeedback = useCallback((offset: { x: number; y: number }) => {
        const distance = Math.sqrt(offset.x * offset.x + offset.y * offset.y);
        const isValid = validateDrop ? validateDrop(offset) : true;

        setFeedbackState(prev => {
            const newState = {
                ...prev,
                dragOffset: offset,
                dragDistance: distance,
                isValidDrop: isValid,
            };

            // Notify if validity changed
            if (prev.isValidDrop !== isValid) {
                onValidDropChange?.(isValid);
            }

            return newState;
        });
    }, [validateDrop, onValidDropChange]);

    // End drag feedback
    const endDragFeedback = useCallback(() => {
        setFeedbackState(prev => ({
            ...prev,
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            dragStartTime: null,
            dragDistance: 0,
            isValidDrop: true,
        }));
        onDragEnd?.();
    }, [onDragEnd]);

    // Reset drag feedback
    const resetDragFeedback = useCallback(() => {
        setFeedbackState({
            isDragging: false,
            dragOffset: { x: 0, y: 0 },
            isValidDrop: true,
            dragStartTime: null,
            dragDistance: 0,
        });
    }, []);

    // Get drag duration
    const getDragDuration = useCallback(() => {
        if (!feedbackState.dragStartTime) return 0;
        return Date.now() - feedbackState.dragStartTime;
    }, [feedbackState.dragStartTime]);

    // Check if drag is significant (moved enough distance)
    const isSignificantDrag = useCallback((threshold: number = 5) => {
        return feedbackState.dragDistance > threshold;
    }, [feedbackState.dragDistance]);

    // Get drag velocity (pixels per second)
    const getDragVelocity = useCallback(() => {
        const duration = getDragDuration();
        if (duration === 0) return 0;
        return (feedbackState.dragDistance / duration) * 1000;
    }, [feedbackState.dragDistance, getDragDuration]);

    return {
        // State
        isDragging: feedbackState.isDragging,
        dragOffset: feedbackState.dragOffset,
        isValidDrop: feedbackState.isValidDrop,
        dragDistance: feedbackState.dragDistance,

        // Actions
        startDragFeedback,
        updateDragFeedback,
        endDragFeedback,
        resetDragFeedback,

        // Computed values
        getDragDuration,
        isSignificantDrag,
        getDragVelocity,
    };
};

export default useGroupDragFeedback;