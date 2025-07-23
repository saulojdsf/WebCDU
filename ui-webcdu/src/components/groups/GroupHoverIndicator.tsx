import React from 'react';
import { useTheme } from 'next-themes';

interface GroupHoverIndicatorProps {
    isHovered: boolean;
    isSelected: boolean;
    isDragging: boolean;
    isResizing: boolean;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    borderRadius: number;
    interactionType: 'none' | 'selectable' | 'draggable' | 'resizable' | 'dragging' | 'resizing';
}

export const GroupHoverIndicator: React.FC<GroupHoverIndicatorProps> = ({
    isHovered,
    isSelected,
    isDragging,
    isResizing,
    bounds,
    borderRadius,
    interactionType,
}) => {
    const { theme } = useTheme();

    if (!isHovered && !isSelected) {
        return null;
    }

    const isDark = theme === 'dark';

    // Define hover indicator colors based on interaction type
    const getIndicatorColors = () => {
        switch (interactionType) {
            case 'selectable':
                return {
                    border: isDark ? 'rgba(96, 165, 250, 0.6)' : 'rgba(59, 130, 246, 0.6)',
                    glow: isDark ? '0 0 8px rgba(96, 165, 250, 0.4)' : '0 0 8px rgba(59, 130, 246, 0.4)',
                    background: isDark ? 'rgba(96, 165, 250, 0.05)' : 'rgba(59, 130, 246, 0.05)',
                };
            case 'draggable':
                return {
                    border: isDark ? 'rgba(34, 197, 94, 0.6)' : 'rgba(22, 163, 74, 0.6)',
                    glow: isDark ? '0 0 8px rgba(34, 197, 94, 0.4)' : '0 0 8px rgba(22, 163, 74, 0.4)',
                    background: isDark ? 'rgba(34, 197, 94, 0.05)' : 'rgba(22, 163, 74, 0.05)',
                };
            case 'resizable':
                return {
                    border: isDark ? 'rgba(168, 85, 247, 0.6)' : 'rgba(147, 51, 234, 0.6)',
                    glow: isDark ? '0 0 8px rgba(168, 85, 247, 0.4)' : '0 0 8px rgba(147, 51, 234, 0.4)',
                    background: isDark ? 'rgba(168, 85, 247, 0.05)' : 'rgba(147, 51, 234, 0.05)',
                };
            default:
                return {
                    border: isDark ? 'rgba(96, 165, 250, 0.6)' : 'rgba(59, 130, 246, 0.6)',
                    glow: isDark ? '0 0 8px rgba(96, 165, 250, 0.4)' : '0 0 8px rgba(59, 130, 246, 0.4)',
                    background: isDark ? 'rgba(96, 165, 250, 0.05)' : 'rgba(59, 130, 246, 0.05)',
                };
        }
    };

    const colors = getIndicatorColors();

    // Hover indicator style - positioned relative to the group
    const indicatorStyle: React.CSSProperties = {
        position: 'absolute',
        left: -2,
        top: -2,
        width: bounds.width + 4,
        height: bounds.height + 4,
        border: `2px dashed ${colors.border}`,
        borderRadius: `${borderRadius + 2}px`,
        backgroundColor: colors.background,
        boxShadow: colors.glow,
        pointerEvents: 'none',
        zIndex: -1,
        opacity: isHovered ? (isDragging || isResizing ? 0.8 : 1) : 0,
        transition: 'opacity 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        animation: isHovered && !isSelected ? 'groupHoverPulse 2s ease-in-out infinite' : 'none',
    };

    // Corner indicators for interaction hints - positioned relative to the group
    const cornerIndicators = isHovered && interactionType !== 'none' && (
        <>
            {/* Top-left corner indicator */}
            <div
                style={{
                    position: 'absolute',
                    left: -6,
                    top: -6,
                    width: 4,
                    height: 4,
                    backgroundColor: colors.border,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 1,
                    opacity: 0.8,
                    animation: 'groupCornerPulse 1.5s ease-in-out infinite',
                }}
            />
            {/* Top-right corner indicator */}
            <div
                style={{
                    position: 'absolute',
                    right: -6,
                    top: -6,
                    width: 4,
                    height: 4,
                    backgroundColor: colors.border,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 1,
                    opacity: 0.8,
                    animation: 'groupCornerPulse 1.5s ease-in-out infinite 0.2s',
                }}
            />
            {/* Bottom-left corner indicator */}
            <div
                style={{
                    position: 'absolute',
                    left: -6,
                    bottom: -6,
                    width: 4,
                    height: 4,
                    backgroundColor: colors.border,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 1,
                    opacity: 0.8,
                    animation: 'groupCornerPulse 1.5s ease-in-out infinite 0.4s',
                }}
            />
            {/* Bottom-right corner indicator */}
            <div
                style={{
                    position: 'absolute',
                    right: -6,
                    bottom: -6,
                    width: 4,
                    height: 4,
                    backgroundColor: colors.border,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 1,
                    opacity: 0.8,
                    animation: 'groupCornerPulse 1.5s ease-in-out infinite 0.6s',
                }}
            />
        </>
    );

    return (
        <>
            <div style={indicatorStyle} aria-hidden="true" />
            {cornerIndicators}
        </>
    );
};

export default GroupHoverIndicator;