import { useEffect } from 'react';
import { toast } from 'sonner';
import type { Edge, Node } from 'reactflow';

interface Params {
  setCommandMenuResetKey: (cb: (k: number) => number) => void;
  setCommandOpen: (open: boolean) => void;
  handleToggleDrawingMode: () => void;
  selectedNodes: string[];
  selectedEdges: string[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  edges: Edge[];
  handleSplitToggle: (edgeId: string, split: boolean) => void;
  groupStateManager: any; // keep as any to avoid deep typing here
  nodes: Node[];
}

/**
 * Attaches global <keydown> listeners for all diagram-level shortcuts.
 * Keeping it in its own hook keeps App.tsx leaner and improves testability.
 */
export function useGlobalKeyboardShortcuts({
  setCommandMenuResetKey,
  setCommandOpen,
  handleToggleDrawingMode,
  selectedNodes,
  selectedEdges,
  setNodes,
  setEdges,
  edges,
  handleSplitToggle,
  groupStateManager,
  nodes,
}: Params) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isInput = !!active && (
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.isContentEditable
      );

      // Quick-open command menu ("/")
      if (!isInput && e.key === '/') {
        e.preventDefault();
        setCommandMenuResetKey(k => k + 1);
        setCommandOpen(true);
        return;
      }

      // Toggle drawing mode ("d")
      if (!isInput && e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        handleToggleDrawingMode();
        return;
      }

      // Delete / Backspace – remove nodes & edges
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        if (selectedNodes.length) {
          setNodes(nds => nds.filter(n => !selectedNodes.includes(n.id)));
          setEdges(eds => eds.filter(e => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)));
        }
        if (selectedEdges.length) {
          setEdges(eds => eds.filter(e => !selectedEdges.includes(e.id)));
        }
        return;
      }

      // Split / unsplit selected edges ("s")
      if (e.key.toLowerCase() === 's' && !isInput && selectedEdges.length) {
        e.preventDefault();
        selectedEdges.forEach(edgeId => {
          const edge = edges.find(ed => ed.id === edgeId);
          if (edge) {
            const currentSplit = edge.data?.split || false;
            handleSplitToggle(edgeId, !currentSplit);
          }
        });
        return;
      }

      // Group selected nodes (Ctrl+G)
      if (e.key.toLowerCase() === 'g' && e.ctrlKey && !e.shiftKey && !isInput) {
        e.preventDefault();
        if (selectedNodes.length > 1) {
          const nodeIdsToGroup = selectedNodes.filter(
            nodeId => !groupStateManager.groupState.groups.some((g: any) => g.nodeIds.includes(nodeId))
          );
          if (nodeIdsToGroup.length > 1) {
            groupStateManager.createGroup({ nodeIds: nodeIdsToGroup }, nodes);
            toast.success(`Grouped ${nodeIdsToGroup.length} nodes`);
          } else {
            toast.error('Selected nodes are already in groups');
          }
        } else {
          toast.error('Select at least 2 nodes to create a group');
        }
        return;
      }

      // Ungroup (Ctrl+Shift+G)
      if (e.key.toLowerCase() === 'g' && e.ctrlKey && e.shiftKey && !isInput) {
        e.preventDefault();
        const selectedGroups = groupStateManager.groupState.selectedGroupIds;
        if (selectedGroups.length) {
          // Show confirmation dialog before ungrouping
          if (confirm(`Ungroup ${selectedGroups.length} group(s)? This will preserve all nodes but remove the group container.`)) {
            selectedGroups.forEach((groupId: string) => groupStateManager.deleteGroup(groupId));
            toast.success(`Ungrouped ${selectedGroups.length} group(s)`);
          }
        } else {
          toast.error('No groups selected to ungroup');
        }
        return;
      }

      // Select all nodes in the selected groups (Ctrl+A when groups are selected)
      if (e.key.toLowerCase() === 'a' && e.ctrlKey && !isInput) {
        const selectedGroups = groupStateManager.groupState.selectedGroupIds;
        if (selectedGroups.length) {
          e.preventDefault(); // Prevent the default "select all" behavior

          // Get all node IDs from the selected groups
          const nodeIds = selectedGroups.flatMap((groupId: string) => {
            const group = groupStateManager.getGroupById(groupId);
            return group ? group.nodeIds : [];
          });

          // Select these nodes
          if (nodeIds.length > 0) {
            // Use the custom event to select nodes
            if (typeof window !== 'undefined' && window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('select-nodes', { detail: { nodeIds } }));
              toast.success(`Selected ${nodeIds.length} nodes from ${selectedGroups.length} group(s)`);
            }
          }
          return;
        }
      }

      // Delete selected groups with confirmation (Delete key)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        const selectedGroups = groupStateManager.groupState.selectedGroupIds;
        if (selectedGroups.length) {
          e.preventDefault();

          // Show confirmation dialog before deleting groups and their nodes
          if (confirm(`Delete ${selectedGroups.length} group(s) and all their nodes? This cannot be undone.`)) {
            // For each group, get the node IDs and remove them
            const nodeIdsToDelete = selectedGroups.flatMap((groupId: string) => {
              const group = groupStateManager.getGroupById(groupId);
              return group ? group.nodeIds : [];
            });

            // Delete the nodes
            if (nodeIdsToDelete.length > 0) {
              setNodes(nds => nds.filter(n => !nodeIdsToDelete.includes(n.id)));
              setEdges(eds => eds.filter(e =>
                !nodeIdsToDelete.includes(e.source) && !nodeIdsToDelete.includes(e.target)
              ));
            }

            // Delete the groups
            selectedGroups.forEach((groupId: string) => groupStateManager.deleteGroup(groupId));
            toast.success(`Deleted ${selectedGroups.length} group(s) and ${nodeIdsToDelete.length} nodes`);
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    setCommandMenuResetKey,
    setCommandOpen,
    handleToggleDrawingMode,
    selectedNodes,
    selectedEdges,
    setNodes,
    setEdges,
    edges,
    handleSplitToggle,
    groupStateManager,
    nodes,
  ]);
} 