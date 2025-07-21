import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useReactFlow, useViewport } from 'reactflow';
import type { Node } from 'reactflow';
import { GroupRenderer } from './GroupRenderer';
import type { NodeGroup } from '@/lib/group-types';
import type { UseGroupStateReturn } from '@/hooks/useGroupState';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface GroupLayerProps {
    groups: NodeGroup[];
    selectedGroupIds: string[];
    nodes: Node[];
    groupStateManager: UseGroupStateReturn;
    selectedNodes?: string[];
    contextMenu: {
        groupId: string | null;
        x: number;
        y: number;
        type: 'group' | 'canvas';
    } | null;
    closeMenu: () => void;
    openGroupMenu: (x: number, y: number, groupId: string) => void;
}

/**
 * GroupLayer component that renders all groups as background elements in ReactFlow
 * This component handles the integration between groups and the ReactFlow canvas
 */
export const GroupLayer: React.FC<GroupLayerProps> = ({
    groups,
    selectedGroupIds,
    nodes,
    groupStateManager,
    selectedNodes = [],
    contextMenu,
    closeMenu,
    openGroupMenu,
}) => {
    const reactFlowInstance = useReactFlow();
    const viewport = useViewport();

    // Handle group selection
    const handleGroupSelect = useCallback((groupId: string, event?: React.MouseEvent) => {
        try {
            if (event && (event.ctrlKey || event.metaKey)) {
                // Multi-selection with Ctrl+click
                if (groupStateManager.toggleGroupSelection) {
                    groupStateManager.toggleGroupSelection(groupId);
                } else {
                    // Fallback for older group state manager versions
                    const currentSelection = groupStateManager.groupState.selectedGroupIds;
                    if (currentSelection.includes(groupId)) {
                        groupStateManager.selectGroups(currentSelection.filter(id => id !== groupId));
                    } else {
                        groupStateManager.selectGroups([...currentSelection, groupId]);
                    }
                }
            } else {
                // Single selection (default behavior)
                groupStateManager.selectGroups([groupId]);
            }
        } catch (error) {
            console.error('Error handling group selection:', error);
        }
    }, [groupStateManager]);

    // Handle group title editing
    const handleGroupTitleEdit = useCallback((groupId: string, newTitle: string) => {
        groupStateManager.updateGroupTitle(groupId, newTitle);
    }, [groupStateManager]);

    // Handle group context menu from GroupRenderer
    const handleGroupContextMenu = useCallback((event: React.MouseEvent, groupId: string) => {
        event.preventDefault();
        event.stopPropagation();
        openGroupMenu(event.clientX, event.clientY, groupId);
    }, [openGroupMenu]);

    // Dialog state for group title entry
    const [showTitleDialog, setShowTitleDialog] = useState(false);
    const [pendingNodeIds, setPendingNodeIds] = useState<string[]>([]);
    const [titleInput, setTitleInput] = useState('');
    const [titleError, setTitleError] = useState<string | null>(null);

    // Generate default group title (e.g., Group 1, Group 2, ...)
    const getDefaultTitle = useCallback(() => {
        const groupCount = groupStateManager.groupState.groups.length + 1;
        return `Group ${groupCount}`;
    }, [groupStateManager.groupState.groups.length]);

    // Show dialog and store node IDs to group
    const openTitleDialog = useCallback((nodeIds: string[]) => {
        setPendingNodeIds(nodeIds);
        setTitleInput(getDefaultTitle());
        setTitleError(null);
        setShowTitleDialog(true);
    }, [getDefaultTitle]);

    // Handle group action (group selected nodes)
    const handleGroup = useCallback(() => {
        if (selectedNodes && selectedNodes.length > 1) {
            const nodeIdsToGroup = selectedNodes.filter(
                nodeId => !groupStateManager.groupState.groups.some(g => g.nodeIds.includes(nodeId))
            );
            if (nodeIdsToGroup.length > 1) {
                openTitleDialog(nodeIdsToGroup);
                // Do not call createGroup here; wait for dialog submit
            }
        }
        closeMenu();
    }, [selectedNodes, groupStateManager, openTitleDialog, closeMenu]);

    // Handle dialog submit
    const handleDialogSubmit = useCallback(() => {
        const trimmed = titleInput.trim();
        if (!trimmed) {
            setTitleError('Title cannot be empty');
            return;
        }
        if (trimmed.length > 100) {
            setTitleError('Title cannot exceed 100 characters');
            return;
        }
        groupStateManager.createGroup({ nodeIds: pendingNodeIds, title: trimmed }, nodes);
        setShowTitleDialog(false);
        setPendingNodeIds([]);
        setTitleInput('');
        setTitleError(null);
    }, [titleInput, pendingNodeIds, groupStateManager, nodes]);

    // Handle dialog skip (use default title)
    const handleDialogSkip = useCallback(() => {
        groupStateManager.createGroup({ nodeIds: pendingNodeIds }, nodes);
        setShowTitleDialog(false);
        setPendingNodeIds([]);
        setTitleInput('');
        setTitleError(null);
    }, [pendingNodeIds, groupStateManager, nodes]);

    // Handle dialog close/cancel
    const handleDialogClose = useCallback(() => {
        setShowTitleDialog(false);
        setPendingNodeIds([]);
        setTitleInput('');
        setTitleError(null);
    }, []);

    // State for group deletion confirmation dialog
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<string | null>(null);
    const [deleteMode, setDeleteMode] = useState<'delete' | 'ungroup'>('ungroup');

    // Helper to get group member node IDs
    const getGroupNodeIds = (groupId: string) => {
        const group = groupStateManager.groupState.groups.find(g => g.id === groupId);
        return group ? group.nodeIds : [];
    };

    // Handle ungroup action (show dialog)
    const handleUngroup = useCallback(() => {
        if (contextMenu && contextMenu.groupId) {
            setPendingDeleteGroupId(contextMenu.groupId);
            setDeleteMode('ungroup');
            setShowDeleteDialog(true);
        }
        closeMenu();
    }, [contextMenu, closeMenu]);

    // Handle delete group and nodes (from dialog)
    const handleDeleteGroupAndNodes = useCallback(() => {
        if (pendingDeleteGroupId) {
            const nodeIds = getGroupNodeIds(pendingDeleteGroupId);
            // Remove nodes
            if (nodeIds.length > 0) {
                // Remove nodes from the main diagram (requires setNodes from parent)
                if (typeof window !== 'undefined' && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent('delete-nodes', { detail: { nodeIds } }));
                }
            }
            // Remove group
            groupStateManager.deleteGroup(pendingDeleteGroupId);
        }
        setShowDeleteDialog(false);
        setPendingDeleteGroupId(null);
    }, [pendingDeleteGroupId, groupStateManager]);

    // Handle ungroup only (from dialog)
    const handleUngroupOnly = useCallback(() => {
        if (pendingDeleteGroupId) {
            // Remove group only
            groupStateManager.deleteGroup(pendingDeleteGroupId);
            // Select member nodes
            const nodeIds = getGroupNodeIds(pendingDeleteGroupId);
            if (typeof window !== 'undefined' && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('select-nodes', { detail: { nodeIds } }));
            }
        }
        setShowDeleteDialog(false);
        setPendingDeleteGroupId(null);
    }, [pendingDeleteGroupId, groupStateManager]);

    // Listen for node deletion events to clean up orphaned groups
    useEffect(() => {
        const handler = (e: any) => {
            const nodeIds: string[] = e.detail?.nodeIds || [];
            // For each group, if all its nodes are deleted, remove the group
            groupStateManager.groupState.groups.forEach(group => {
                if (group.nodeIds.every(id => nodeIds.includes(id))) {
                    groupStateManager.deleteGroup(group.id);
                }
            });
        };
        window.addEventListener('delete-nodes', handler);
        return () => window.removeEventListener('delete-nodes', handler);
    }, [groupStateManager.groupState.groups, groupStateManager]);

    // Listen for select-nodes event to update selection
    useEffect(() => {
        const handler = (e: any) => {
            const nodeIds: string[] = e.detail?.nodeIds || [];
            // Deselect all groups
            groupStateManager.clearSelection();
            // Selection update should be handled in parent (App.tsx) if needed
        };
        window.addEventListener('select-nodes', handler);
        return () => window.removeEventListener('select-nodes', handler);
    }, [groupStateManager]);

    // Update group bounds when nodes change
    const updateGroupBounds = useCallback(() => {
        groupStateManager.updateAllGroupBounds(nodes);
    }, [groupStateManager, nodes]);

    // Handle group drag from GroupRenderer
    const handleGroupDrag = useCallback((groupId: string, delta: { dx: number; dy: number }) => {


        // Adjust delta for current zoom level
        const adjustedDelta = {
            dx: delta.dx / viewport.zoom,
            dy: delta.dy / viewport.zoom
        };

        // Emit a custom event to parent (App.tsx) to update node positions and group bounds
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('move-group', { detail: { groupId, delta: adjustedDelta } }));
        }
    }, [viewport.zoom]);

    // Determine if we should show 'Group' or 'Ungroup' in the context menu
    const showGroupOption = selectedNodes && selectedNodes.length > 1 && selectedNodes.some(
        nodeId => !groupStateManager.groupState.groups.some(g => g.nodeIds.includes(nodeId))
    );
    const showUngroupOption = !!(contextMenu && contextMenu.groupId);

    // Transform style for the group layer container
    const containerStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow clicks to pass through to ReactFlow
        zIndex: -1, // Render behind nodes
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        transformOrigin: '0 0',
    };

    return (
        <div
            style={containerStyle}
            data-testid="group-layer"
            role="presentation"
            aria-hidden="true"
        >
            {/* Group Title Dialog */}
            <Dialog open={showTitleDialog} onOpenChange={(open) => { if (!open) handleDialogClose(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Enter Group Title</DialogTitle>
                        <DialogDescription>
                            You can enter a custom title for this group, or skip to use the default.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={titleInput}
                        onChange={e => setTitleInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleDialogSubmit();
                            if (e.key === 'Escape') handleDialogClose();
                        }}
                        autoFocus
                        maxLength={100}
                        placeholder={getDefaultTitle()}
                        aria-label="Group title"
                    />
                    {titleError && <div style={{ color: 'red', fontSize: 12 }}>{titleError}</div>}
                    <DialogFooter>
                        <Button variant="secondary" onClick={handleDialogSkip} type="button">Skip (use default)</Button>
                        <Button onClick={handleDialogSubmit} type="button">Create Group</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Group Deletion Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group</AlertDialogTitle>
                        <AlertDialogDescription>
                            Do you want to delete the group and all its member nodes, or just ungroup (keep nodes)?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteGroupAndNodes}>Delete Group & Nodes</AlertDialogAction>
                        <AlertDialogAction onClick={handleUngroupOnly}>Ungroup (Keep Nodes)</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {groups.map(group => (
                <GroupRenderer
                    key={group.id}
                    group={group}
                    isSelected={selectedGroupIds.includes(group.id)}
                    onSelect={handleGroupSelect}
                    onTitleEdit={handleGroupTitleEdit}
                    onContextMenu={handleGroupContextMenu}
                    onGroupDrag={handleGroupDrag}
                />
            ))}
            {/* Context menu for group operations */}
            {contextMenu && (
                <DropdownMenu open onOpenChange={(open) => { if (!open) closeMenu(); }}>
                    <DropdownMenuContent
                        sideOffset={0}
                        align="start"
                        style={{
                            position: 'fixed',
                            left: contextMenu.x,
                            top: contextMenu.y,
                            zIndex: 9999,
                        }}
                    >
                        {contextMenu.type === 'canvas' && selectedNodes && selectedNodes.length > 1 && (
                            <DropdownMenuItem onClick={handleGroup}>
                                Group
                            </DropdownMenuItem>
                        )}
                        {contextMenu.type === 'group' && contextMenu.groupId && (
                            <DropdownMenuItem onClick={handleUngroup}>
                                Ungroup
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
};

// Export a hook to manage group context menu state and handlers
export function useGroupContextMenu() {
    const [contextMenu, setContextMenu] = useState<{
        groupId: string | null;
        x: number;
        y: number;
        type: 'group' | 'canvas';
    } | null>(null);

    const openGroupMenu = useCallback((x: number, y: number, groupId: string) => {
        setContextMenu({ groupId, x, y, type: 'group' });
    }, []);
    const openCanvasMenu = useCallback((x: number, y: number) => {
        setContextMenu({ groupId: null, x, y, type: 'canvas' });
    }, []);
    const closeMenu = useCallback(() => setContextMenu(null), []);

    return { contextMenu, openGroupMenu, openCanvasMenu, closeMenu };
}

export default GroupLayer;