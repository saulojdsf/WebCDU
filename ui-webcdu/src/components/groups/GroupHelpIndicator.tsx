import React from 'react';
import { useTheme } from 'next-themes';

interface GroupHelpIndicatorProps {
    isVisible: boolean;
    shortcuts: Array<{
        key: string;
        description: string;
        icon?: React.ReactNode;
    }>;
    position: { x: number; y: number };
    groupId: string;
}

export const GroupHelpIndicator: React.FC<GroupHelpIndicatorProps> = ({
    isVisible,
    shortcuts,
    position,
    groupId,
}) => {
    const { theme } = useTheme();

    if (!isVisible || shortcuts.length === 0) {
        return null;
    }

    const isDark = theme === 'dark';

    const helpStyle: React.CSSProperties = {
        position: 'fixed',
        left: position.x + 10,
        top: position.y - 10,
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        color: isDark ? 'rgb(226, 232, 240)' : 'rgb(30, 41, 59)',
        border: `1px solid ${isDark ? 'rgb(71, 85, 105)' : 'rgb(203, 213, 225)'}`,
        borderRadius: '8px',
        padding: '12px',
        fontSize: '11px',
        lineHeight: '1.4',
        minWidth: '200px',
        maxWidth: '300px',
        zIndex: 10001,
        pointerEvents: 'none',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(12px)',
        animation: 'tooltipFadeIn 0.3s ease-out',
    };

    const headerStyle: React.CSSProperties = {
        fontSize: '12px',
        fontWeight: 'bold',
        marginBottom: '8px',
        color: isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)',
        borderBottom: `1px solid ${isDark ? 'rgb(71, 85, 105)' : 'rgb(203, 213, 225)'}`,
        paddingBottom: '4px',
    };

    const shortcutStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
        padding: '2px 0',
    };

    const keyStyle: React.CSSProperties = {
        backgroundColor: isDark ? 'rgb(51, 65, 85)' : 'rgb(241, 245, 249)',
        color: isDark ? 'rgb(203, 213, 225)' : 'rgb(51, 65, 85)',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '10px',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        border: `1px solid ${isDark ? 'rgb(71, 85, 105)' : 'rgb(203, 213, 225)'}`,
        minWidth: '20px',
        textAlign: 'center',
    };

    const descriptionStyle: React.CSSProperties = {
        flex: 1,
        marginLeft: '8px',
        opacity: 0.9,
    };

    return (
        <div style={helpStyle} role="tooltip" aria-label={`Keyboard shortcuts for group ${groupId}`}>
            <div style={headerStyle}>
                Group Shortcuts
            </div>
            {shortcuts.map((shortcut, index) => (
                <div key={index} style={shortcutStyle}>
                    <div style={keyStyle}>
                        {shortcut.key}
                    </div>
                    <div style={descriptionStyle}>
                        {shortcut.icon && (
                            <span style={{ marginRight: '4px' }}>
                                {shortcut.icon}
                            </span>
                        )}
                        {shortcut.description}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GroupHelpIndicator;