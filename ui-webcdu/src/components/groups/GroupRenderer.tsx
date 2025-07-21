import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import type { NodeGroup } from '@/lib/group-types';

interface GroupRendererProps {
    group: NodeGroup;
    isSelected: boolean;
    onSelect: (groupId: string, event?: React.MouseEvent) => void;
    onTitleEdit: (groupId: string, newTitle: string) => void;
    onTitleEditStart?: (groupId: string) => void;
    onTitleEditEnd?: (groupId: string) => void;
    onContextMenu?: (event: React.MouseEvent, groupId: string) => void;
    onGroupDrag?: (groupId: string, delta: { dx: number; dy: number }) => void;
}

export const GroupRenderer: React.FC<GroupRendererProps> = ({
    group,
    isSelected,
    onSelect,
    onTitleEdit,
    onTitleEditStart,
    onTitleEditEnd,
    onContextMenu,
    onGroupDrag,
}) => {
    const { theme } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(group.title);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Drag state for group
    const dragState = useRef<{
        startX: number;
        startY: number;
        dragging: boolean;
        dragType: 'group' | 'title' | null;
        hasMoved: boolean;
    }>({
        startX: 0,
        startY: 0,
        dragging: false,
        dragType: null,
        hasMoved: false
    });

    // Mouse down on title to start drag
    const handleTitleMouseDown = (e: React.MouseEvent) => {
        if (isEditing) return;


        e.stopPropagation();
        e.preventDefault();
        dragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            dragging: true,
            dragType: 'title',
            hasMoved: false
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Mouse down on group background to start drag
    const handleGroupMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        dragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            dragging: true,
            dragType: 'group',
            hasMoved: false
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
        if (!dragState.current.dragging) return;

        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;

        // Only start dragging if we've moved more than a threshold
        const threshold = 3;
        if (!dragState.current.hasMoved && (Math.abs(dx) > threshold || Math.abs(dy) > threshold)) {
            dragState.current.hasMoved = true;

        }

        if (dragState.current.hasMoved && onGroupDrag) {

            onGroupDrag(group.id, { dx, dy });
            dragState.current.startX = e.clientX;
            dragState.current.startY = e.clientY;
        }
    };

    // Mouse up handler
    const handleMouseUp = (e: MouseEvent) => {
        const wasDragging = dragState.current.dragging;
        const hasMoved = dragState.current.hasMoved;
        const dragType = dragState.current.dragType;

        dragState.current.dragging = false;
        dragState.current.hasMoved = false;
        dragState.current.dragType = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        // If we didn't move and it was a group drag, treat it as a selection click
        if (wasDragging && !hasMoved && dragType === 'group') {
            // Create a synthetic event for the selection
            const syntheticEvent = {
                ctrlKey: false,
                metaKey: false,
                stopPropagation: () => { },
                preventDefault: () => { }
            } as React.MouseEvent;
            onSelect(group.id, syntheticEvent);
        }
    };

    // Handle theme-aware styling
    const getThemeColors = useCallback(() => {
        const isDark = theme === 'dark';

        return {
            backgroundColor: isSelected
                ? (isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.15)')
                : (isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
            borderColor: isSelected
                ? (isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)')
                : (isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)'),
            titleColor: isSelected
                ? (isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)')
                : (isDark ? 'rgb(191, 219, 254)' : 'rgb(30, 58, 138)'),
            titleBackgroundColor: isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
        };
    }, [theme, isSelected]);

    const colors = getThemeColors();

    // Handle group background click
    const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
        // Only handle clicks if we're not in the middle of a drag operation
        if (dragState.current.dragging && dragState.current.hasMoved) {
            return;
        }

        event.stopPropagation();
        event.preventDefault();
        onSelect(group.id, event);
    }, [group.id, onSelect]);

    // Handle group background right-click (context menu)
    const handleContextMenu = useCallback((event: React.MouseEvent) => {
        if (onContextMenu) {
            event.preventDefault();
            event.stopPropagation();
            onContextMenu(event, group.id);
        }
    }, [onContextMenu, group.id]);

    // Handle title double-click to start editing
    const handleTitleDoubleClick = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        setIsEditing(true);
        setEditValue(group.title);
        onTitleEditStart?.(group.id);
    }, [group.id, group.title, onTitleEditStart]);

    // Handle title edit save
    const handleTitleSave = useCallback(() => {
        const trimmedValue = editValue.trim();
        if (trimmedValue && trimmedValue !== group.title) {
            onTitleEdit(group.id, trimmedValue);
        }
        setIsEditing(false);
        onTitleEditEnd?.(group.id);
    }, [editValue, group.id, group.title, onTitleEdit, onTitleEditEnd]);

    // Handle title edit cancel
    const handleTitleCancel = useCallback(() => {
        setEditValue(group.title);
        setIsEditing(false);
        onTitleEditEnd?.(group.id);
    }, [group.id, group.title, onTitleEditEnd]);

    // Handle key events during title editing
    const handleTitleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleTitleSave();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            handleTitleCancel();
        }
    }, [handleTitleSave, handleTitleCancel]);

    // Handle click outside during editing
    const handleTitleBlur = useCallback(() => {
        handleTitleSave();
    }, [handleTitleSave]);

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // Main group rectangle: pointerEvents none
    const groupStyle: React.CSSProperties = {
        position: 'absolute',
        left: group.bounds.x,
        top: group.bounds.y,
        width: group.bounds.width,
        height: group.bounds.height,
        backgroundColor: colors.backgroundColor,
        borderRadius: `${group.style.borderRadius}px`,
        zIndex: group.zIndex,
        pointerEvents: 'none', // Always allow panning
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
    };

    // Interactive border overlay
    const borderStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        border: `${isSelected ? 3 : 2}px solid ${colors.borderColor}`,
        borderRadius: `${group.style.borderRadius}px`,
        pointerEvents: 'all',
        cursor: 'move',
        boxSizing: 'border-box',
        zIndex: 1,
        background: 'transparent',
        boxShadow: isSelected ? `0 0 0 1px ${colors.borderColor}` : 'none',
    };

    const titleStyle: React.CSSProperties = {
        position: 'absolute',
        top: -24,
        left: 8,
        fontSize: '14px',
        fontWeight: 600,
        color: colors.titleColor,
        backgroundColor: colors.titleBackgroundColor,
        padding: '2px 8px',
        borderRadius: '4px',
        border: `1px solid ${colors.borderColor}`,
        userSelect: 'none',
        cursor: isEditing ? 'text' : 'move', // Show move cursor when not editing
        transition: 'color 0.2s ease, border-color 0.2s ease',
    };

    const inputStyle: React.CSSProperties = {
        ...titleStyle,
        cursor: 'text',
        outline: 'none',
        border: `2px solid ${colors.borderColor}`,
        minWidth: '100px',
    };

    return (
        <div
            style={groupStyle}
            data-testid={`group-${group.id}`}
            aria-label={`Group: ${group.title}`}
            aria-selected={isSelected}
            role="group"
            aria-describedby={`group-title-${group.id}`}
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const syntheticEvent = {
                        ctrlKey: e.ctrlKey,
                        metaKey: e.metaKey,
                        stopPropagation: () => { },
                        preventDefault: () => { }
                    } as React.MouseEvent;
                    onSelect(group.id, syntheticEvent);
                }
            }}
        >
            {/* Interactive border for selection/context menu */}
            <div
                style={borderStyle}
                aria-hidden="true"
                role="presentation"
                onClick={handleBackgroundClick}
                onMouseDown={handleGroupMouseDown}
                onContextMenu={handleContextMenu}
            />
            {/* Hidden help text for screen readers */}
            <div
                id={`group-title-help-${group.id}`}
                style={{
                    position: 'absolute',
                    left: '-10000px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden'
                }}
                aria-hidden="true"
            >
                Press Enter to save, Escape to cancel
            </div>

            {/* Group Title */}
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleBlur}
                    style={{ ...inputStyle, pointerEvents: 'all', zIndex: 2 }}
                    data-testid={`group-title-input-${group.id}`}
                    aria-label="Edit group title"
                    aria-describedby={`group-title-help-${group.id}`}
                    maxLength={100}
                />
            ) : (
                <div
                    id={`group-title-${group.id}`}
                    style={{ ...titleStyle, pointerEvents: 'all', zIndex: 2 }}
                    onDoubleClick={handleTitleDoubleClick}
                    onContextMenu={handleContextMenu}
                    role="button"
                    tabIndex={0}
                    onMouseDown={handleTitleMouseDown}
                    data-testid={`group-title-${group.id}`}
                    aria-label={`Group title: ${group.title}. Double-click to edit.`}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsEditing(true);
                            setEditValue(group.title);
                            onTitleEditStart?.(group.id);
                        }
                    }}
                >
                    {group.title}
                </div>
            )}
        </div>
    );
};

export default GroupRenderer;