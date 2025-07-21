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
          selectedGroups.forEach((groupId: string) => groupStateManager.deleteGroup(groupId));
          toast.success(`Ungrouped ${selectedGroups.length} group(s)`);
        } else {
          toast.error('No groups selected to ungroup');
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