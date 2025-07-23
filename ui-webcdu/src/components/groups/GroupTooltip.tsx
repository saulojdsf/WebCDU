import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface GroupTooltipProps {
    isVisible: boolean;
    content: string | React.ReactNode;
    position: { x: number; y: number };
    delay?: number;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    type?: 'info' | 'help' | 'error' | 'warning' | 'success';
    showArrow?: boolean;
    maxWidth?: number;
}

export const GroupTooltip: React.FC<GroupTooltipProps> = ({
    isVisible,
    content,
    position,
    delay = 500,
    placement = 'auto',
    type = 'info',
    showArrow = true,
    maxWidth = 250,
}) => {
    const { theme } = useTheme();
    const [show, setShow] = useState(false);
    const [actualPlacement, setActualPlacement] = useState(placement);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Show/hide tooltip with delay
    useEffect(() => {
        if (isVisible) {
            timeoutRef.current = setTimeout(() => {
                setShow(true);
            }, delay);
        } else {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            setShow(false);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [isVisible, delay]);

    // Calculate optimal placement
    useEffect(() => {
        if (show && tooltipRef.current && placement === 'auto') {
            const tooltip = tooltipRef.current;
            const rect = tooltip.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let optimalPlacement = 'top';

            // Check if tooltip fits above
            if (position.y - rect.height - 10 < 0) {
                optimalPlacement = 'bottom';
            }

            // Check if tooltip fits to the right
            if (position.x + rect.width + 10 > viewportWidth) {
                optimalPlacement = position.y - rect.height - 10 < 0 ? 'left' : 'top';
            }

            // Check if tooltip fits to the left
            if (position.x - rect.width - 10 < 0) {
                optimalPlacement = position.y - rect.height - 10 < 0 ? 'right' : 'top';
            }

            setActualPlacement(optimalPlacement as typeof placement);
        } else if (placement !== 'auto') {
            setActualPlacement(placement);
        }
    }, [show, position, placement]);

    if (!show) {
        return null;
    }

    const isDark = theme === 'dark';

    // Get colors based on type
    const getTypeColors = () => {
        switch (type) {
            case 'error':
                return {
                    background: isDark ? 'rgba(239, 68, 68, 0.95)' : 'rgba(220, 38, 38, 0.95)',
                    border: isDark ? 'rgb(248, 113, 113)' : 'rgb(239, 68, 68)',
                    text: 'white',
                };
            case 'warning':
                return {
                    background: isDark ? 'rgba(245, 158, 11, 0.95)' : 'rgba(217, 119, 6, 0.95)',
                    border: isDark ? 'rgb(251, 191, 36)' : 'rgb(245, 158, 11)',
                    text: isDark ? 'black' : 'white',
                };
            case 'success':
                return {
                    background: isDark ? 'rgba(34, 197, 94, 0.95)' : 'rgba(22, 163, 74, 0.95)',
                    border: isDark ? 'rgb(74, 222, 128)' : 'rgb(34, 197, 94)',
                    text: 'white',
                };
            case 'help':
                return {
                    background: isDark ? 'rgba(168, 85, 247, 0.95)' : 'rgba(147, 51, 234, 0.95)',
                    border: isDark ? 'rgb(196, 181, 253)' : 'rgb(168, 85, 247)',
                    text: 'white',
                };
            default: // info
                return {
                    background: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    border: isDark ? 'rgb(71, 85, 105)' : 'rgb(203, 213, 225)',
                    text: isDark ? 'rgb(226, 232, 240)' : 'rgb(30, 41, 59)',
                };
        }
    };

    const colors = getTypeColors();

    // Calculate position based on placement
    const getTooltipPosition = () => {
        const offset = 10;
        const arrowSize = 6;

        switch (actualPlacement) {
            case 'top':
                return {
                    left: position.x,
                    top: position.y - offset - arrowSize,
                    transform: 'translate(-50%, -100%)',
                };
            case 'bottom':
                return {
                    left: position.x,
                    top: position.y + offset + arrowSize,
                    transform: 'translate(-50%, 0%)',
                };
            case 'left':
                return {
                    left: position.x - offset - arrowSize,
                    top: position.y,
                    transform: 'translate(-100%, -50%)',
                };
            case 'right':
                return {
                    left: position.x + offset + arrowSize,
                    top: position.y,
                    transform: 'translate(0%, -50%)',
                };
            default:
                return {
                    left: position.x,
                    top: position.y - offset - arrowSize,
                    transform: 'translate(-50%, -100%)',
                };
        }
    };

    const tooltipPosition = getTooltipPosition();

    // Arrow styles
    const getArrowStyles = () => {
        const arrowSize = 6;
        const baseStyle = {
            position: 'absolute' as const,
            width: 0,
            height: 0,
        };

        switch (actualPlacement) {
            case 'top':
                return {
                    ...baseStyle,
                    left: '50%',
                    bottom: -arrowSize,
                    transform: 'translateX(-50%)',
                    borderLeft: `${arrowSize}px solid transparent`,
                    borderRight: `${arrowSize}px solid transparent`,
                    borderTop: `${arrowSize}px solid ${colors.background}`,
                };
            case 'bottom':
                return {
                    ...baseStyle,
                    left: '50%',
                    top: -arrowSize,
                    transform: 'translateX(-50%)',
                    borderLeft: `${arrowSize}px solid transparent`,
                    borderRight: `${arrowSize}px solid transparent`,
                    borderBottom: `${arrowSize}px solid ${colors.background}`,
                };
            case 'left':
                return {
                    ...baseStyle,
                    right: -arrowSize,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderTop: `${arrowSize}px solid transparent`,
                    borderBottom: `${arrowSize}px solid transparent`,
                    borderLeft: `${arrowSize}px solid ${colors.background}`,
                };
            case 'right':
                return {
                    ...baseStyle,
                    left: -arrowSize,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    borderTop: `${arrowSize}px solid transparent`,
                    borderBottom: `${arrowSize}px solid transparent`,
                    borderRight: `${arrowSize}px solid ${colors.background}`,
                };
            default:
                return baseStyle;
        }
    };

    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        left: tooltipPosition.left,
        top: tooltipPosition.top,
        transform: tooltipPosition.transform,
        backgroundColor: colors.background,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '12px',
        lineHeight: '1.4',
        maxWidth: `${maxWidth}px`,
        wordWrap: 'break-word',
        zIndex: 10000,
        pointerEvents: 'none',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(8px)',
        animation: 'tooltipFadeIn 0.2s ease-out',
    };

    return (
        <div ref={tooltipRef} style={tooltipStyle} role="tooltip" aria-hidden="true">
            {content}
            {showArrow && <div style={getArrowStyles()} />}
        </div>
    );
};

export default GroupTooltip;