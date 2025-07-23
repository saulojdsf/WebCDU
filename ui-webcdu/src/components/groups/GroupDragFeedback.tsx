import React from 'react';
import { useTheme } from 'next-themes';

interface GroupDragFeedbackProps {
    isDragging: boolean;
    isSelected: boolean;
    isMultiSelected: boolean;
    selectedGroupCount: number;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    borderRadius: number;
    dragOffset?: { x: number; y: number };
    isValidDrop?: boolean;
}

export const GroupDragFeedback: React.FC<GroupDragFeedbackProps> = ({
    isDragging,
    isSelected,
    isMultiSelected,
    selectedGroupCount,
    bounds,
    borderRadius,
    dragOffset = { x: 0, y: 0 },
    isValidDrop = true,
}) => {
    const { theme } = useTheme();

    if (!isDragging && !isSelected) {
        return null;
    }

    const isDark = theme === 'dark';

    // Define feedback colors based on state
    const getFeedbackColors = () => {
        if (isDragging) {
            if (!isValidDrop) {
                return {
                    border: isDark ? 'rgba(239, 68, 68, 0.8)' : 'rgba(220, 38, 38, 0.8)',
                    glow: isDark ? '0 0 16px rgba(239, 68, 68, 0.6)' : '0 0 16px rgba(220, 38, 38, 0.6)',
                    background: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                    shadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                };
            }

            if (isMultiSelected) {
                return {
                    border: isDark ? 'rgba(168, 85, 247, 0.9)' : 'rgba(147, 51, 234, 0.9)',
                    glow: isDark ? '0 0 20px rgba(168, 85, 247, 0.7)' : '0 0 20px rgba(147, 51, 234, 0.7)',
                    background: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(147, 51, 234, 0.15)',
                    shadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                };
            }

            return {
                border: isDark ? 'rgba(34, 197, 94, 0.8)' : 'rgba(22, 163, 74, 0.8)',
                glow: isDark ? '0 0 16px rgba(34, 197, 94, 0.6)' : '0 0 16px rgba(22, 163, 74, 0.6)',
                background: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                shadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
            };
        }

        if (isSelected) {
            if (isMultiSelected) {
                return {
                    border: isDark ? 'rgba(168, 85, 247, 0.7)' : 'rgba(147, 51, 234, 0.7)',
                    glow: isDark ? '0 0 12px rgba(168, 85, 247, 0.5)' : '0 0 12px rgba(147, 51, 234, 0.5)',
                    background: isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(147, 51, 234, 0.08)',
                    shadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                };
            }

            return {
                border: isDark ? 'rgba(96, 165, 250, 0.7)' : 'rgba(59, 130, 246, 0.7)',
                glow: isDark ? '0 0 12px rgba(96, 165, 250, 0.5)' : '0 0 12px rgba(59, 130, 246, 0.5)',
                background: isDark ? 'rgba(96, 165, 250, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                shadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            };
        }

        return {
            border: 'transparent',
            glow: 'none',
            background: 'transparent',
            shadow: 'none',
        };
    };

    const colors = getFeedbackColors();

    // Main feedback overlay
    const feedbackStyle: React.CSSProperties = {
        position: 'absolute',
        left: -4,
        top: -4,
        width: bounds.width + 8,
        height: bounds.height + 8,
        border: `3px solid ${colors.border}`,
        borderRadius: `${borderRadius + 4}px`,
        backgroundColor: colors.background,
        boxShadow: `${colors.glow}, ${colors.shadow}`,
        pointerEvents: 'none',
        zIndex: isDragging ? 1000 : 10,
        opacity: isDragging ? 0.9 : (isSelected ? 0.7 : 0),
        transition: isDragging ? 'none' : 'all 0.3s ease',
        transform: isDragging
            ? `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${isMultiSelected ? 1.02 : 1.01})`
            : isSelected
                ? 'scale(1.005)'
                : 'scale(1)',
        animation: isDragging
            ? (isValidDrop ? 'groupDragFeedback 0.8s ease-in-out infinite' : 'groupInvalidShake 0.3s ease-in-out infinite')
            : 'none',
    };

    // Selection count indicator for multi-selection
    const countIndicator = isDragging && isMultiSelected && selectedGroupCount > 1 && (
        <div
            style={{
                position: 'absolute',
                top: -12,
                right: -12,
                width: 24,
                height: 24,
                backgroundColor: colors.border,
                color: isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                pointerEvents: 'none',
                zIndex: 1001,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                animation: 'groupCornerPulse 1s ease-in-out infinite',
            }}
        >
            {selectedGroupCount}
        </div>
    );

    // Drag direction indicator
    const dragIndicator = isDragging && (Math.abs(dragOffset.x) > 5 || Math.abs(dragOffset.y) > 5) && (
        <div
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 32,
                height: 32,
                backgroundColor: colors.border,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 1001,
                opacity: 0.8,
                animation: 'groupCornerPulse 0.8s ease-in-out infinite',
            }}
        >
            <div
                style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: `8px solid ${isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)'}`,
                    transform: `rotate(${Math.atan2(dragOffset.y, dragOffset.x) * 180 / Math.PI + 90}deg)`,
                }}
            />
        </div>
    );

    // Invalid drop indicator
    const invalidIndicator = isDragging && !isValidDrop && (
        <div
            style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 40,
                height: 40,
                backgroundColor: colors.border,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 1001,
                opacity: 0.9,
            }}
        >
            <div
                style={{
                    width: 20,
                    height: 3,
                    backgroundColor: isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
                    borderRadius: '2px',
                    transform: 'rotate(45deg)',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    width: 20,
                    height: 3,
                    backgroundColor: isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
                    borderRadius: '2px',
                    transform: 'rotate(-45deg)',
                }}
            />
        </div>
    );

    return (
        <>
            <div style={feedbackStyle} aria-hidden="true" />
            {countIndicator}
            {dragIndicator}
            {invalidIndicator}
        </>
    );
};

export default GroupDragFeedback;