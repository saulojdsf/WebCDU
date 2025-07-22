/**
 * Custom hook for providing visual feedback when nodes reach group boundaries
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NodeGroup } from '@/lib/group-types';
import '../components/groups/group-constraints.css';

export type ConstraintDirection = 'top' | 'right' | 'bottom' | 'left' | null;

interface ConstraintFeedbackState {
    active: boolean;
    direction: ConstraintDirection;
    groupId: string | null;
    pulsing: boolean;
}

export function useGroupConstraintFeedback() {
    const [feedback, setFeedback] = useState<ConstraintFeedbackState>({
        active: false,
        direction: null,
        groupId: null,
        pulsing: false,
    });

    const timeoutRef = useRef<number | null>(null);
    const pulseTimeoutRef = useRef<number | null>(null);

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            if (pulseTimeoutRef.current) {
                window.clearTimeout(pulseTimeoutRef.current);
            }
        };
    }, []);

    /**
     * Show constraint feedback in a specific direction
     */
    const showConstraintFeedback = useCallback((
        direction: ConstraintDirection,
        groupId: string,
        duration: number = 1000,
        pulsing: boolean = false
    ) => {
        // Clear any existing timeouts
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }
        if (pulseTimeoutRef.current) {
            window.clearTimeout(pulseTimeoutRef.current);
        }

        // Set the feedback state
        setFeedback({
            active: true,
            direction,
            groupId,
            pulsing,
        });

        // Start pulsing after a short delay if requested
        if (pulsing) {
            pulseTimeoutRef.current = window.setTimeout(() => {
                setFeedback(prev => ({ ...prev, pulsing: true }));
            }, 200);
        }

        // Hide the feedback after the specified duration
        timeoutRef.current = window.setTimeout(() => {
            setFeedback({
                active: false,
                direction: null,
                groupId: null,
                pulsing: false,
            });
        }, duration);
    }, []);

    /**
     * Hide constraint feedback immediately
     */
    const hideConstraintFeedback = useCallback(() => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (pulseTimeoutRef.current) {
            window.clearTimeout(pulseTimeoutRef.current);
            pulseTimeoutRef.current = null;
        }

        setFeedback({
            active: false,
            direction: null,
            groupId: null,
            pulsing: false,
        });
    }, []);

    return {
        showConstraintFeedback,
        hideConstraintFeedback,
        constraintFeedback: feedback,
    };
}

export type UseGroupConstraintFeedbackReturn = ReturnType<typeof useGroupConstraintFeedback>;