import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useReactFlow, useViewport } from 'reactflow';
import type { Node } from 'reactflow';
import { GroupRenderer } from './GroupRenderer';
import { GroupConstraintIndicator } from './GroupConstraintIndicator';
import { GroupConstraintIndicators } from './GroupConstraintIndicators';
import type { NodeGroup } from '@/lib/group-types';
import type { UseGroupStateReturn } from '@/hooks/useGroupState';
import type { UseNodeDragConstraintsReturn } from '@/hooks/useNodeDragConstraints';
import type { UseNodeDragConstraintIntegrationReturn } from '@/hooks/useNodeDragConstraintIntegration';
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
        type: 'group' | 'canvas' | 'node';
        nodeIds?: string[];
    } | null;
    closeMenu: () => void;
    openGroupMenu: (x: number, y: number, groupId: string) => void;
    setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
    nodeDragConstraints?: UseNodeDragConstraintsReturn;
    constraintIntegration?: UseNodeDragConstraintIntegrationReturn;
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
    setNodes,
    nodeDragConstraints,
    constraintIntegration,
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
                setNodes(nodes => nodes.filter(n => !nodeIds.includes(n.id)));
            }
            // Remove group
            groupStateManager.deleteGroup(pendingDeleteGroupId);
        }
        setShowDeleteDialog(false);
        setPendingDeleteGroupId(null);
    }, [pendingDeleteGroupId, groupStateManager, setNodes]);

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

    // Handle group resize from GroupRenderer
    const handleGroupResize = useCallback((groupId: string, newBounds: { x: number; y: number; width: number; height: number }) => {
        const group = groupStateManager.groupState.groups.find(g => g.id === groupId);
        if (!group) return;

        // Check if any member nodes would be outside the new bounds
        const memberNodes = nodes.filter(node => group.nodeIds.includes(node.id));
        let needsNodeAdjustment = false;
        const adjustedNodes: Node[] = [];

        memberNodes.forEach(node => {
            const nodeRight = node.position.x + (node.width || 150);
            const nodeBottom = node.position.y + (node.height || 40);
            const padding = 20;

            // Check if node is outside new bounds
            if (node.position.x < newBounds.x + padding ||
                node.position.y < newBounds.y + padding ||
                nodeRight > newBounds.x + newBounds.width - padding ||
                nodeBottom > newBounds.y + newBounds.height - padding) {

                needsNodeAdjustment = true;

                // Constrain node position to new bounds
                const constrainedX = Math.max(
                    newBounds.x + padding,
                    Math.min(node.position.x, newBounds.x + newBounds.width - padding - (node.width || 150))
                );
                const constrainedY = Math.max(
                    newBounds.y + padding,
                    Math.min(node.position.y, newBounds.y + newBounds.height - padding - (node.height || 40))
                );

                adjustedNodes.push({
                    ...node,
                    position: { x: constrainedX, y: constrainedY }
                });
            } else {
                adjustedNodes.push(node);
            }
        });

        // Update group bounds
        groupStateManager.updateGroup(groupId, { bounds: newBounds });

        // Update node positions if needed
        if (needsNodeAdjustment) {
            setNodes(currentNodes => currentNodes.map(node => {
                const adjustedNode = adjustedNodes.find(adj => adj.id === node.id);
                return adjustedNode || node;
            }));
        }
    }, [groupStateManager, nodes, setNodes]);

    // Handle group drag from GroupRenderer (supports multi-group dragging)
    const handleGroupDrag = useCallback((groupId: string, delta: { dx: number; dy: number }) => {
        const group = groupStateManager.groupState.groups.find(g => g.id === groupId);
        if (!group) return;

        // Adjust delta for current zoom level
        const adjustedDelta = {
            dx: delta.dx / viewport.zoom,
            dy: delta.dy / viewport.zoom
        };

        // Determine which groups to move
        const groupsToMove = selectedGroupIds.includes(groupId)
            ? selectedGroupIds // If the dragged group is selected, move all selected groups
            : [groupId]; // Otherwise, just move the dragged group

        // Get all node IDs from groups to move
        const nodeIdsToMove = new Set<string>();
        groupsToMove.forEach(gId => {
            const g = groupStateManager.groupState.groups.find(group => group.id === gId);
            if (g) {
                g.nodeIds.forEach(nodeId => nodeIdsToMove.add(nodeId));
            }
        });

        // Move all member nodes from all groups being dragged
        setNodes(nodes => nodes.map(node =>
            nodeIdsToMove.has(node.id)
                ? { ...node, position: { x: node.position.x + adjustedDelta.dx, y: node.position.y + adjustedDelta.dy } }
                : node
        ));

        // Update bounds for all moved groups
        setTimeout(() => {
            groupsToMove.forEach(gId => {
                groupStateManager.updateGroupBounds(gId, nodes.map(node =>
                    nodeIdsToMove.has(node.id)
                        ? { ...node, position: { x: node.position.x + adjustedDelta.dx, y: node.position.y + adjustedDelta.dy } }
                        : node
                ));
            });
        }, 0);
    }, [groupStateManager, setNodes, nodes, viewport.zoom, selectedGroupIds]);

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
        // Allow clicks to pass through to ReactFlow nodes/pane by default.
        // Interactive children (borders/titles/handles) explicitly enable pointer events.
        pointerEvents: 'none',
        // Ensure this layer renders above nodes so borders/titles/handles are
        // actually clickable, while the non-interactive backgrounds won't block
        // node interactions.
        zIndex: 10,
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
                    onGroupResize={handleGroupResize}
                    isMultiSelected={selectedGroupIds.length > 1}
                    selectedGroupCount={selectedGroupIds.length}
                    showResizeHandles={selectedGroupIds.length === 1} // Only show resize handles for single selection
                />
            ))}
            {/* Constraint indicators for visual feedback */}
            {constraintIntegration ? (
                <GroupConstraintIndicators
                    groups={groups}
                    constraintIntegration={constraintIntegration}
                />
            ) : nodeDragConstraints?.constraintViolation && (
                <GroupConstraintIndicator
                    group={groups.find(g => g.id === nodeDragConstraints.constraintViolation?.groupId) as NodeGroup}
                    direction={nodeDragConstraints.constraintViolation.direction}
                    active={true}
                    pulsing={true}
                />
            )}
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
                        {/* Show Group option for canvas or node context menu when multiple nodes are selected */}
                        {(contextMenu.type === 'canvas' || contextMenu.type === 'node') &&
                            selectedNodes && selectedNodes.length > 1 && (
                                <DropdownMenuItem onClick={handleGroup}>
                                    Group
                                </DropdownMenuItem>
                            )}
                        {/* Show Ungroup option for group context menu */}
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
        type: 'group' | 'canvas' | 'node';
        nodeIds?: string[];
    } | null>(null);

    const openGroupMenu = useCallback((x: number, y: number, groupId: string) => {
        setContextMenu({ groupId, x, y, type: 'group' });
    }, []);

    const openCanvasMenu = useCallback((x: number, y: number) => {
        setContextMenu({ groupId: null, x, y, type: 'canvas' });
    }, []);

    const openNodeMenu = useCallback((x: number, y: number, nodeIds: string[]) => {
        setContextMenu({ groupId: null, x, y, type: 'node', nodeIds });
    }, []);

    const closeMenu = useCallback(() => setContextMenu(null), []);

    return { contextMenu, openGroupMenu, openCanvasMenu, openNodeMenu, closeMenu };
}

export default GroupLayer;