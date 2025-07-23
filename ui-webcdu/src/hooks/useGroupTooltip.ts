import { useState, useCallback, useRef, useEffect } from 'react';

interface TooltipState {
    isVisible: boolean;
    content: string | React.ReactNode;
    position: { x: number; y: number };
    type: 'info' | 'help' | 'error' | 'warning' | 'success';
}

interface UseGroupTooltipOptions {
    delay?: number;
    hideDelay?: number;
    disabled?: boolean;
}

export const useGroupTooltip = ({
    delay = 500,
    hideDelay = 100,
    disabled = false,
}: UseGroupTooltipOptions = {}) => {
    const [tooltipState, setTooltipState] = useState<TooltipState>({
        isVisible: false,
        content: '',
        position: { x: 0, y: 0 },
        type: 'info',
    });

    const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Show tooltip
    const showTooltip = useCallback((
        content: string | React.ReactNode,
        position: { x: number; y: number },
        type: 'info' | 'help' | 'error' | 'warning' | 'success' = 'info'
    ) => {
        if (disabled) return;

        // Clear any existing timeouts
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }

        showTimeoutRef.current = setTimeout(() => {
            setTooltipState({
                isVisible: true,
                content,
                position,
                type,
            });
        }, delay);
    }, [delay, disabled]);

    // Hide tooltip
    const hideTooltip = useCallback(() => {
        if (showTimeoutRef.current) {
            clearTimeout(showTimeoutRef.current);
        }

        hideTimeoutRef.current = setTimeout(() => {
            setTooltipState(prev => ({
                ...prev,
                isVisible: false,
            }));
        }, hideDelay);
    }, [hideDelay]);

    // Show tooltip immediately (for errors or important messages)
    const showTooltipImmediate = useCallback((
        content: string | React.ReactNode,
        position: { x: number; y: number },
        type: 'info' | 'help' | 'error' | 'warning' | 'success' = 'info'
    ) => {
        if (disabled) return;

        // Clear any existing timeouts
        if (showTimeoutRef.current) {
            clearTimeout(showTimeoutRef.current);
        }
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }

        setTooltipState({
            isVisible: true,
            content,
            position,
            type,
        });
    }, [disabled]);

    // Hide tooltip immediately
    const hideTooltipImmediate = useCallback(() => {
        if (showTimeoutRef.current) {
            clearTimeout(showTimeoutRef.current);
        }
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }

        setTooltipState(prev => ({
            ...prev,
            isVisible: false,
        }));
    }, []);

    // Update tooltip position
    const updateTooltipPosition = useCallback((position: { x: number; y: number }) => {
        setTooltipState(prev => ({
            ...prev,
            position,
        }));
    }, []);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (showTimeoutRef.current) {
                clearTimeout(showTimeoutRef.current);
            }
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);

    return {
        tooltipState,
        showTooltip,
        hideTooltip,
        showTooltipImmediate,
        hideTooltipImmediate,
        updateTooltipPosition,
    };
};

export default useGroupTooltip;