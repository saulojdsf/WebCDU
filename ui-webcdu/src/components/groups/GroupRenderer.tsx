import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import type { NodeGroup } from '@/lib/group-types';
import { GroupHoverIndicator } from './GroupHoverIndicator';
import { GroupDragFeedback } from './GroupDragFeedback';
import { GroupTooltip } from './GroupTooltip';
import { GroupHelpIndicator } from './GroupHelpIndicator';
import { useGroupCursor } from '@/hooks/useGroupCursor';
import { useGroupDragFeedback } from '@/hooks/useGroupDragFeedback';
import { useGroupTooltip } from '@/hooks/useGroupTooltip';

interface GroupRendererProps {
    group: NodeGroup;
    isSelected: boolean;
    onSelect: (groupId: string, event?: React.MouseEvent) => void;
    onTitleEdit: (groupId: string, newTitle: string) => void;
    onTitleEditStart?: (groupId: string) => void;
    onTitleEditEnd?: (groupId: string) => void;
    onContextMenu?: (event: React.MouseEvent, groupId: string) => void;
    onGroupDrag?: (groupId: string, delta: { dx: number; dy: number }) => void;
    onGroupResize?: (groupId: string, newBounds: { x: number; y: number; width: number; height: number }) => void;
    isMultiSelected?: boolean; // New prop to indicate if multiple groups are selected
    selectedGroupCount?: number; // New prop to show how many groups are selected
    showResizeHandles?: boolean; // New prop to control resize handle visibility
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
    onGroupResize,
    isMultiSelected = false,
    selectedGroupCount = 1,
    showResizeHandles = true,
}) => {
    const { theme } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(group.title);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [hoverRegion, setHoverRegion] = useState<'border' | 'background' | 'title' | 'none'>('none');

    // Visual drag feedback state
    const [isDragging, setIsDragging] = useState(false);

    // Resize state
    const [isResizing, setIsResizing] = useState(false);

    // Cursor management
    const { cursorType, cursorValue, cursorClassName } = useGroupCursor({
        isHovered,
        isSelected,
        isDragging,
        isResizing,
        canDrag: true,
        canResize: showResizeHandles && isSelected && !isMultiSelected,
        canSelect: true,
    });

    // Drag feedback management
    const {
        isDragging: feedbackDragging,
        dragOffset: feedbackOffset,
        isValidDrop,
        startDragFeedback,
        updateDragFeedback,
        endDragFeedback,
        isSignificantDrag,
    } = useGroupDragFeedback({
        onDragStart: () => {
            // Add visual feedback when drag starts
            document.documentElement.classList.add('group-dragging');
        },
        onDragEnd: () => {
            // Remove visual feedback when drag ends
            document.documentElement.classList.remove('group-dragging');
        },
        validateDrop: (offset) => {
            // Simple validation - could be enhanced with boundary checking
            return Math.abs(offset.x) < 2000 && Math.abs(offset.y) < 2000;
        },
    });

    // Tooltip management
    const {
        tooltipState,
        showTooltip,
        hideTooltip,
        showTooltipImmediate,
        hideTooltipImmediate,
    } = useGroupTooltip({
        delay: 800,
        hideDelay: 200,
    });

    // Help indicator state
    const [showHelp, setShowHelp] = useState(false);
    const [helpPosition, setHelpPosition] = useState({ x: 0, y: 0 });

    // Define keyboard shortcuts for help
    const keyboardShortcuts = [
        { key: 'Enter', description: 'Select group' },
        { key: 'Space', description: 'Select group' },
        { key: 'Del', description: 'Delete group' },
        { key: 'F2', description: 'Rename group' },
        { key: 'Ctrl+G', description: 'Group selected nodes' },
        { key: 'Ctrl+Shift+G', description: 'Ungroup' },
        { key: 'Ctrl+D', description: 'Duplicate group' },
        { key: '?', description: 'Show help' },
    ];

    // Drag state for group
    const dragState = useRef<{
        startX: number;
        startY: number;
        dragging: boolean;
        dragType: 'group' | 'title' | null;
        hasMoved: boolean;
        initialGroupPosition: { x: number; y: number } | null;
    }>({
        startX: 0,
        startY: 0,
        dragging: false,
        dragType: null,
        hasMoved: false,
        initialGroupPosition: null
    });

    const resizeState = useRef<{
        handle: string | null;
        startX: number;
        startY: number;
        startBounds: { x: number; y: number; width: number; height: number };
        resizing: boolean;
    }>({
        handle: null,
        startX: 0,
        startY: 0,
        startBounds: { x: 0, y: 0, width: 0, height: 0 },
        resizing: false
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
            hasMoved: false,
            initialGroupPosition: { x: group.bounds.x, y: group.bounds.y }
        };

        // Set visual drag state
        setIsDragging(true);
        startDragFeedback();

        // Add event listeners with proper options
        window.addEventListener('mousemove', handleMouseMove, { passive: false });
        window.addEventListener('mouseup', handleMouseUp, { passive: false });

        // Prevent text selection during drag
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    };

    // Mouse down on group background to start drag
    const handleGroupMouseDown = (e: React.MouseEvent) => {
        // Always stop propagation to prevent ReactFlow from handling this event
        e.stopPropagation();
        e.preventDefault();

        // If the group isn't already selected, select it first
        if (!isSelected) {
            onSelect(group.id, e);
        }

        // Initialize drag state with current group position
        dragState.current = {
            startX: e.clientX,
            startY: e.clientY,
            dragging: true,
            dragType: 'group',
            hasMoved: false,
            initialGroupPosition: { x: group.bounds.x, y: group.bounds.y }
        };

        // Set visual drag state
        setIsDragging(true);
        startDragFeedback();

        // Add global event listeners for drag tracking with passive: false for preventDefault
        window.addEventListener('mousemove', handleMouseMove, { passive: false });
        window.addEventListener('mouseup', handleMouseUp, { passive: false });

        // Prevent text selection during drag
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    };

    // Mouse move handler
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragState.current.dragging) return;

        // Prevent default to avoid any unwanted browser behavior
        e.preventDefault();

        const dx = e.clientX - dragState.current.startX;
        const dy = e.clientY - dragState.current.startY;

        // Update drag feedback
        updateDragFeedback({ x: dx, y: dy });

        // Only start dragging if we've moved more than a threshold
        const threshold = 3;
        if (!dragState.current.hasMoved && (Math.abs(dx) > threshold || Math.abs(dy) > threshold)) {
            dragState.current.hasMoved = true;

            // Add visual indicators that we're dragging the group
            document.body.style.cursor = 'grabbing';

            // Add a class to the document for any global drag styling
            document.documentElement.classList.add('group-dragging');
        }

        if (dragState.current.hasMoved && onGroupDrag) {
            // Calculate delta from the initial position for more accurate dragging
            const totalDx = e.clientX - dragState.current.startX;
            const totalDy = e.clientY - dragState.current.startY;

            onGroupDrag(group.id, { dx: totalDx, dy: totalDy });
        }
    }, [group.id, onGroupDrag, updateDragFeedback]);

    // Mouse up handler
    const handleMouseUp = useCallback((e: MouseEvent) => {
        const wasDragging = dragState.current.dragging;
        const hasMoved = dragState.current.hasMoved;
        const dragType = dragState.current.dragType;

        // Clean up drag state
        dragState.current.dragging = false;
        dragState.current.hasMoved = false;
        dragState.current.dragType = null;
        dragState.current.initialGroupPosition = null;

        // Remove event listeners
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        // Reset visual drag state
        setIsDragging(false);
        endDragFeedback();

        // Reset cursor and user selection
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';

        // Remove global drag class
        document.documentElement.classList.remove('group-dragging');

        // If we didn't move and it was a group drag, treat it as a selection click
        if (wasDragging && !hasMoved && dragType === 'group') {
            // Create a synthetic event for the selection
            const syntheticEvent = {
                ctrlKey: e.ctrlKey,
                metaKey: e.metaKey,
                stopPropagation: () => { },
                preventDefault: () => { }
            } as React.MouseEvent;
            onSelect(group.id, syntheticEvent);
        }
    }, [handleMouseMove, onSelect, group.id, endDragFeedback]);

    // Handle theme-aware styling
    const getThemeColors = useCallback(() => {
        const isDark = theme === 'dark';

        // Multi-selection colors (more vibrant when multiple groups are selected)
        const multiSelectColor = isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(147, 51, 234, 0.25)'; // Purple for multi-select
        const multiSelectBorder = isDark ? 'rgb(196, 181, 253)' : 'rgb(124, 58, 237)';
        const multiSelectGlow = isDark ? '0 0 12px rgba(196, 181, 253, 0.6)' : '0 0 12px rgba(124, 58, 237, 0.6)';

        return {
            backgroundColor: isSelected && isMultiSelected
                ? multiSelectColor
                : isSelected
                    ? (isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)')
                    : isHovered
                        ? (isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(59, 130, 246, 0.15)')
                        : (isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
            borderColor: isSelected && isMultiSelected
                ? multiSelectBorder
                : isSelected
                    ? (isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)')
                    : isHovered
                        ? (isDark ? 'rgb(120, 180, 250)' : 'rgb(50, 115, 240)')
                        : (isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)'),
            titleColor: isSelected && isMultiSelected
                ? multiSelectBorder
                : isSelected
                    ? (isDark ? 'rgb(147, 197, 253)' : 'rgb(37, 99, 235)')
                    : isHovered
                        ? (isDark ? 'rgb(165, 205, 250)' : 'rgb(40, 80, 200)')
                        : (isDark ? 'rgb(191, 219, 254)' : 'rgb(30, 58, 138)'),
            titleBackgroundColor: isDark ? 'hsl(222.2 84% 4.9%)' : 'hsl(0 0% 100%)',
            selectionGlow: isSelected && isMultiSelected
                ? multiSelectGlow
                : isSelected
                    ? (isDark ? '0 0 8px rgba(147, 197, 253, 0.5)' : '0 0 8px rgba(37, 99, 235, 0.5)')
                    : 'none',
        };
    }, [theme, isSelected, isHovered, isMultiSelected]);

    const colors = getThemeColors();

    // Enhanced hover handlers for different regions
    const handleBorderHover = useCallback((entering: boolean, event?: React.MouseEvent) => {
        setIsHovered(entering);
        setHoverRegion(entering ? 'border' : 'none');

        if (entering && event) {
            const tooltipContent = isSelected
                ? `Group "${group.title}" (selected)${isMultiSelected ? ` - ${selectedGroupCount} groups selected` : ''}`
                : `Group "${group.title}" - Click to select`;
            showTooltip(tooltipContent, { x: event.clientX, y: event.clientY });
        } else {
            hideTooltip();
        }
    }, [group.title, isSelected, isMultiSelected, selectedGroupCount, showTooltip, hideTooltip]);

    const handleBackgroundHover = useCallback((entering: boolean, event?: React.MouseEvent) => {
        setIsHovered(entering);
        setHoverRegion(entering ? 'background' : 'none');

        if (entering && event) {
            const tooltipContent = `Group "${group.title}" - ${group.nodeIds.length} nodes`;
            showTooltip(tooltipContent, { x: event.clientX, y: event.clientY });
        } else {
            hideTooltip();
        }
    }, [group.title, group.nodeIds.length, showTooltip, hideTooltip]);

    const handleTitleHover = useCallback((entering: boolean, event?: React.MouseEvent) => {
        setIsHovered(entering);
        setHoverRegion(entering ? 'title' : 'none');

        if (entering && event) {
            const tooltipContent = `"${group.title}" - Double-click to edit`;
            showTooltip(tooltipContent, { x: event.clientX, y: event.clientY }, 'help');
        } else {
            hideTooltip();
        }
    }, [group.title, showTooltip, hideTooltip]);

    // Handle group background click
    const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
        // Only handle clicks if we're not in the middle of a drag operation
        if (dragState.current.dragging && dragState.current.hasMoved) {
            return;
        }

        // Ensure we stop propagation to prevent ReactFlow from handling this click
        event.stopPropagation();
        event.preventDefault();

        // Select the group with the appropriate modifier keys
        onSelect(group.id, event);

        // Set focus to ensure keyboard events work
        (event.currentTarget as HTMLElement).focus();
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

        if (!trimmedValue) {
            // Show error tooltip for empty title
            const rect = inputRef.current?.getBoundingClientRect();
            if (rect) {
                showTooltipImmediate(
                    'Group title cannot be empty',
                    { x: rect.left + rect.width / 2, y: rect.top },
                    'error'
                );
                setTimeout(() => hideTooltipImmediate(), 2000);
            }
            return;
        }

        if (trimmedValue !== group.title) {
            onTitleEdit(group.id, trimmedValue);
            // Show success feedback
            const rect = inputRef.current?.getBoundingClientRect();
            if (rect) {
                showTooltipImmediate(
                    'Group renamed successfully',
                    { x: rect.left + rect.width / 2, y: rect.top },
                    'success'
                );
                setTimeout(() => hideTooltipImmediate(), 1500);
            }
        }

        setIsEditing(false);
        onTitleEditEnd?.(group.id);
    }, [editValue, group.id, group.title, onTitleEdit, onTitleEditEnd, showTooltipImmediate, hideTooltipImmediate]);

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

    // Cleanup event listeners on unmount
    useEffect(() => {
        return () => {
            // Clean up any active drag operations
            if (dragState.current.dragging) {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);

                // Reset styles
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.body.style.webkitUserSelect = '';
                document.documentElement.classList.remove('group-dragging');
            }
        };
    }, [handleMouseMove, handleMouseUp]);

    // Resize handle mouse down
    const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();

        resizeState.current = {
            handle,
            startX: e.clientX,
            startY: e.clientY,
            startBounds: { ...group.bounds },
            resizing: true
        };

        setIsResizing(true);

        // Add global event listeners for resize tracking
        window.addEventListener('mousemove', handleResizeMouseMove, { passive: false });
        window.addEventListener('mouseup', handleResizeMouseUp, { passive: false });

        // Prevent text selection during resize
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        document.body.style.cursor = getResizeCursor(handle);
    }, [group.bounds]);

    // Resize mouse move handler
    const handleResizeMouseMove = useCallback((e: MouseEvent) => {
        if (!resizeState.current.resizing || !onGroupResize) return;

        e.preventDefault();

        const dx = e.clientX - resizeState.current.startX;
        const dy = e.clientY - resizeState.current.startY;
        const { startBounds, handle } = resizeState.current;

        const newBounds = { ...startBounds };

        // Calculate new bounds based on resize handle
        switch (handle) {
            case 'nw': // Top-left
                newBounds.x = startBounds.x + dx;
                newBounds.y = startBounds.y + dy;
                newBounds.width = startBounds.width - dx;
                newBounds.height = startBounds.height - dy;
                break;
            case 'n': // Top
                newBounds.y = startBounds.y + dy;
                newBounds.height = startBounds.height - dy;
                break;
            case 'ne': // Top-right
                newBounds.y = startBounds.y + dy;
                newBounds.width = startBounds.width + dx;
                newBounds.height = startBounds.height - dy;
                break;
            case 'e': // Right
                newBounds.width = startBounds.width + dx;
                break;
            case 'se': // Bottom-right
                newBounds.width = startBounds.width + dx;
                newBounds.height = startBounds.height + dy;
                break;
            case 's': // Bottom
                newBounds.height = startBounds.height + dy;
                break;
            case 'sw': // Bottom-left
                newBounds.x = startBounds.x + dx;
                newBounds.width = startBounds.width - dx;
                newBounds.height = startBounds.height + dy;
                break;
            case 'w': // Left
                newBounds.x = startBounds.x + dx;
                newBounds.width = startBounds.width - dx;
                break;
        }

        // Enforce minimum size
        const minWidth = 100;
        const minHeight = 60;

        if (newBounds.width < minWidth) {
            if (handle && handle.includes('w')) {
                newBounds.x = startBounds.x + startBounds.width - minWidth;
            }
            newBounds.width = minWidth;
        }

        if (newBounds.height < minHeight) {
            if (handle && handle.includes('n')) {
                newBounds.y = startBounds.y + startBounds.height - minHeight;
            }
            newBounds.height = minHeight;
        }

        onGroupResize(group.id, newBounds);
    }, [group.id, onGroupResize]);

    // Resize mouse up handler
    const handleResizeMouseUp = useCallback((_e: MouseEvent) => {
        resizeState.current.resizing = false;
        resizeState.current.handle = null;

        // Remove event listeners
        window.removeEventListener('mousemove', handleResizeMouseMove);
        window.removeEventListener('mouseup', handleResizeMouseUp);

        // Reset visual resize state
        setIsResizing(false);

        // Reset cursor and user selection
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
    }, [handleResizeMouseMove]);

    // Get cursor style for resize handle
    const getResizeCursor = useCallback((handle: string): string => {
        switch (handle) {
            case 'nw':
            case 'se':
                return 'nw-resize';
            case 'ne':
            case 'sw':
                return 'ne-resize';
            case 'n':
            case 's':
                return 'ns-resize';
            case 'e':
            case 'w':
                return 'ew-resize';
            default:
                return 'default';
        }
    }, []);

    // Cleanup resize event listeners on unmount
    useEffect(() => {
        return () => {
            // Clean up any active resize operations
            if (resizeState.current.resizing) {
                window.removeEventListener('mousemove', handleResizeMouseMove);
                window.removeEventListener('mouseup', handleResizeMouseUp);

                // Reset styles
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                document.body.style.webkitUserSelect = '';
            }
        };
    }, [handleResizeMouseMove, handleResizeMouseUp]);

    // Main group rectangle: pointerEvents none
    const groupStyle: React.CSSProperties = {
        position: 'absolute',
        left: group.bounds.x,
        top: group.bounds.y,
        width: group.bounds.width,
        height: group.bounds.height,
        backgroundColor: colors.backgroundColor,
        borderRadius: `${group.style.borderRadius}px`,
        // Ensure the group is rendered within the normal stacking context so the
        // interactive border (defined below) can receive pointer events. A
        // negative z-index would place the whole group behind the nodes and
        // make it non-interactive. We clamp it to at least 0.
        zIndex: Math.max(group.zIndex, 0),
        pointerEvents: 'all', // Allow interaction with the group
        transition: isDragging ? 'none' : 'border-color 0.2s ease, background-color 0.2s ease, transform 0.1s ease',
        transform: isDragging
            ? (isMultiSelected ? 'scale(1.008)' : 'scale(1.005)') // Larger scale for multi-group drag
            : isSelected
                ? 'scale(1.002)'
                : 'scale(1)',
        opacity: isDragging ? (isMultiSelected ? 0.75 : 0.8) : 1, // More transparency for multi-group drag
    };

    // Interactive border overlay
    const borderStyle: React.CSSProperties = {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        border: `${isDragging ? 4 : isSelected ? 3 : isHovered ? 2.5 : 2}px solid ${colors.borderColor}`,
        borderRadius: `${group.style.borderRadius}px`,
        pointerEvents: 'all',
        cursor: cursorValue,
        boxSizing: 'border-box',
        zIndex: 1,
        background: 'transparent',
        boxShadow: isDragging
            ? `${colors.selectionGlow}, 0 4px 12px rgba(0, 0, 0, 0.15)`
            : colors.selectionGlow,
        transition: isDragging ? 'none' : 'border-color 0.2s ease, border-width 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
        // Add subtle animation for hover state
        animation: isHovered && !isSelected && !isDragging ? 'groupSelectionPulse 2s ease-in-out infinite' : 'none',
    };

    const titleStyle: React.CSSProperties = {
        position: 'absolute',
        top: -24,
        left: 8,
        fontSize: '14px',
        fontWeight: isSelected ? 700 : 600,
        color: colors.titleColor,
        backgroundColor: colors.titleBackgroundColor,
        padding: '2px 8px',
        borderRadius: '4px',
        border: `${isDragging ? 3 : isSelected ? 2 : 1}px solid ${colors.borderColor}`,
        userSelect: 'none',
        cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'color 0.2s ease, border-color 0.2s ease, font-weight 0.2s ease, border-width 0.2s ease',
        boxShadow: isDragging
            ? `${colors.selectionGlow}, 0 2px 8px rgba(0, 0, 0, 0.1)`
            : isSelected
                ? colors.selectionGlow
                : 'none',
        opacity: isDragging ? (isMultiSelected ? 0.85 : 0.9) : 1,
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
            onClick={handleBackgroundClick}
            onMouseDown={handleGroupMouseDown}
            onContextMenu={handleContextMenu}
            onKeyDown={(e) => {
                // Select group with Enter or Space
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

                // Group context menu with context menu key or Shift+F10
                if (e.key === 'ContextMenu' || (e.key === 'F10' && e.shiftKey)) {
                    e.preventDefault();
                    if (onContextMenu) {
                        // Calculate position for context menu (center of group)
                        const rect = e.currentTarget.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;

                        const syntheticEvent = {
                            clientX: centerX,
                            clientY: centerY,
                            preventDefault: () => { },
                            stopPropagation: () => { }
                        } as React.MouseEvent;

                        onContextMenu(syntheticEvent, group.id);
                    }
                }

                // F2 to start editing title
                if (e.key === 'F2') {
                    e.preventDefault();
                    setIsEditing(true);
                    setEditValue(group.title);
                    onTitleEditStart?.(group.id);
                }

                // Show/hide help with ? key
                if (e.key === '?' || e.key === 'F1') {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHelpPosition({ x: rect.right + 10, y: rect.top });
                    setShowHelp(!showHelp);
                }

                // Hide help with Escape
                if (e.key === 'Escape' && showHelp) {
                    e.preventDefault();
                    setShowHelp(false);
                }

                // Delete/Backspace for group deletion (handled globally)
                // Ctrl+G for grouping (handled globally)
                // Ctrl+Shift+G for ungrouping (handled globally)
            }}
        >
            {/* Interactive border for selection/context menu */}
            <div
                style={borderStyle}
                aria-hidden="true"
                role="presentation"
                className={cursorClassName}
                onClick={handleBackgroundClick}
                onMouseDown={handleGroupMouseDown}
                onContextMenu={handleContextMenu}
                onMouseEnter={(e) => handleBorderHover(true, e)}
                onMouseLeave={(e) => handleBorderHover(false, e)}
            />

            {/* Hover indicator overlay */}
            <GroupHoverIndicator
                isHovered={isHovered}
                isSelected={isSelected}
                isDragging={isDragging}
                isResizing={isResizing}
                bounds={group.bounds}
                borderRadius={group.style.borderRadius}
                interactionType={cursorType}
            />

            {/* Drag feedback overlay */}
            <GroupDragFeedback
                isDragging={feedbackDragging || isDragging}
                isSelected={isSelected}
                isMultiSelected={isMultiSelected}
                selectedGroupCount={selectedGroupCount}
                bounds={group.bounds}
                borderRadius={group.style.borderRadius}
                dragOffset={feedbackOffset}
                isValidDrop={isValidDrop}
            />

            {/* Tooltip overlay */}
            <GroupTooltip
                isVisible={tooltipState.isVisible}
                content={tooltipState.content}
                position={tooltipState.position}
                type={tooltipState.type}
                placement="auto"
                showArrow={true}
            />

            {/* Help indicator */}
            <GroupHelpIndicator
                isVisible={showHelp}
                shortcuts={keyboardShortcuts}
                position={helpPosition}
                groupId={group.id}
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
                    onMouseEnter={(e) => handleTitleHover(true, e)}
                    onMouseLeave={(e) => handleTitleHover(false, e)}
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
                    {/* Multi-selection indicator */}
                    {isSelected && isMultiSelected && selectedGroupCount > 1 && (
                        <span
                            style={{
                                marginLeft: '8px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                backgroundColor: colors.borderColor,
                                color: colors.titleBackgroundColor,
                                padding: '2px 6px',
                                borderRadius: '10px',
                                display: 'inline-block',
                                minWidth: '16px',
                                textAlign: 'center',
                                lineHeight: '1',
                            }}
                            aria-label={`${selectedGroupCount} groups selected`}
                        >
                            {selectedGroupCount}
                        </span>
                    )}
                </div>
            )}

            {/* Resize handles - only show when selected and not multi-selected */}
            {isSelected && showResizeHandles && !isMultiSelected && (
                <>
                    {/* Corner handles */}
                    <div
                        style={{
                            position: 'absolute',
                            top: -4,
                            left: -4,
                            width: 8,
                            height: 8,
                            backgroundColor: colors.borderColor,
                            border: `1px solid ${colors.titleBackgroundColor}`,
                            borderRadius: '2px',
                            cursor: 'nw-resize',
                            pointerEvents: 'all',
                            zIndex: 3,
                        }}
                        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                        data-testid={`resize-handle-nw-${group.id}`}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            width: 8,
                            height: 8,
                            backgroundColor: colors.borderColor,
                            border: `1px solid ${colors.titleBackgroundColor}`,
                            borderRadius: '2px',
                            cursor: 'ne-resize',
                            pointerEvents: 'all',
                            zIndex: 3,
                        }}
                        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                        data-testid={`resize-handle-ne-${group.id}`}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: -4,
                            left: -4,
                            width: 8,
                            height: 8,
                            backgroundColor: colors.borderColor,
                            border: `1px solid ${colors.titleBackgroundColor}`,
                            borderRadius: '2px',
                            cursor: 'sw-resize',
                            pointerEvents: 'all',
                            zIndex: 3,
                        }}
                        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                        data-testid={`resize-handle-sw-${group.id}`}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            width: 8,
                            height: 8,
                            backgroundColor: colors.borderColor,
                            border: `1px solid ${colors.titleBackgroundColor}`,
                            borderRadius: '2px',
                            cursor: 'se-resize',
                            pointerEvents: 'all',
                            zIndex: 3,
                        }}
                        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                        data-testid={`resize-handle-se-${group.id}`}
                    />

                    {/* Edge handles */}
                    <div
                        style={{
                            position: 'absolute',
                            top: -4,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 8,
                            height: 8,
                            backgroundColor: colors.borderColor,
                            border: `1px solid ${colors.titleBackgroundColor}`,
                            borderRadius: '2px',
                            cursor: 'ns-resize',
                            pointerEvents: 'all',
                            zIndex: 3,
                        }}
                        onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                        data-testid={`resize-handle-n-${group.id}`}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: -4,
                            transform: 'translateY(-50%)',
                            width: 8,
                            height: 8,
                            backgroundColor: colors.borderColor,
                            border: `1px solid ${colors.titleBackgroundColor}`,
                            borderRadius: '2px',
                            cursor: 'ew-resize',
                            pointerEvents: 'all',
                            zIndex: 3,
                        }}
                        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                        data-testid={`resize-handle-e-${group.id}`}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: -4,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 8,
                            height: 8,
                            backgroundColor: colors.borderColor,
                            border: `1px solid ${colors.titleBackgroundColor}`,
                            borderRadius: '2px',
                            cursor: 'ns-resize',
                            pointerEvents: 'all',
                            zIndex: 3,
                        }}
                        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                        data-testid={`resize-handle-s-${group.id}`}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: -4,
                            transform: 'translateY(-50%)',
                            width: 8,
                            height: 8,
                            backgroundColor: colors.borderColor,
                            border: `1px solid ${colors.titleBackgroundColor}`,
                            borderRadius: '2px',
                            cursor: 'ew-resize',
                            pointerEvents: 'all',
                            zIndex: 3,
                        }}
                        onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                        data-testid={`resize-handle-w-${group.id}`}
                    />
                </>
            )}
        </div>
    );
};

export default GroupRenderer;