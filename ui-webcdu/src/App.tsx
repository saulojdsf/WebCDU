import ReactFlow, { Background, ConnectionMode, Controls, MiniMap, useEdgesState, useNodesState, type Connection, addEdge, type Node } from 'reactflow'
import type { ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css'
import { useTheme } from "next-themes";

import DefaultEdge from './components/edges/DefaultEdge'
import SearchHighlightEdge from './components/edges/SearchHighlightEdge'
import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { useSearchLogic } from '@/hooks/useSearchLogic';

// Arrangement system integration - simplified version
// Note: Full arrangement system integration requires fixing TypeScript configuration
// This is a minimal integration to demonstrate the concept

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { CommandMenu } from "@/components/command-menu"
import { useDrawingCursor } from "@/hooks/useDrawingCursor"
import { useGlobalKeyboardShortcuts } from "@/hooks/useGlobalKeyboardShortcuts"
import { useCopyPaste } from "@/hooks/useCopyPaste"
import { useDrawing } from "@/contexts/DrawingContext"
import { useParameter } from "@/contexts/ParameterContext"
import { useUndoRedo } from "@/hooks/useUndoRedo"
import { DrawingCanvasOverlay } from "@/components/drawing/DrawingCanvasOverlay"
import { DrawingToolbar } from "@/components/drawing/DrawingToolbar"
import { useGroupState } from "@/hooks/useGroupState"
import { GroupLayer, useGroupContextMenu } from "./components/groups/GroupLayer"
import { GroupConstraintIndicator } from "./components/groups/GroupConstraintIndicator"
import { useArrangement } from '@/hooks/useArrangement';
import { useNodeDragConstraintIntegration } from '@/hooks/useNodeDragConstraintIntegration';
import { useGridSnap } from '@/hooks/useGridSnap';
import { useGridSnapDragPreview } from '@/hooks/useGridSnapDragPreview';
import { GridSnapPreview } from '@/components/grid/GridSnapPreview';
import { BASE_NODE_TYPES } from '@/components/nodes/node-types';
import { ParameterSidebar } from './components/parameter-sidebar';
export const iframeHeight = "800px"

// (BASE_NODE_TYPES is now imported)
// Define edge types outside component to prevent recreation
const BASE_EDGE_TYPES = {
    default: DefaultEdge,
} as const;


function padId(num: number) {
    return num.toString().padStart(4, '0');
}

function App() {
    const parameterContext = useParameter();
    const [commandOpen, setCommandOpen] = useState(false);
    const [commandMenuResetKey, setCommandMenuResetKey] = useState(0);
    const [showBlockNumbers, setShowBlockNumbers] = useState(true);
    const [showVariableNames, setShowVariableNames] = useState(true);
    const { resolvedTheme } = useTheme();
    const [isParameterSidebarOpen, setParameterSidebarOpen] = useState(false);
    const handleToggleParameterSidebar = useCallback(() => {
        setParameterSidebarOpen((open) => !open);
    }, []);

    // Initialize drawing cursor management
    useDrawingCursor();

    // Get drawing context for persistence and mode management
    const drawingContext = useDrawing();

    // Handle drawing mode toggle
    const handleToggleDrawingMode = useCallback(() => {
        drawingContext.setDrawingMode(!drawingContext.isDrawingMode);
    }, [drawingContext]);

    // Global keyboard shortcuts are now handled by the dedicated hook

    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const edgesRef = useRef(edges);
    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);
    const nextNodeId = useRef(1);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
    const [selectedEdges, setSelectedEdges] = useState<string[]>([]);

    // Ensure nodes have correct 'selected' field based on selectedNodes
    useEffect(() => {
        setNodes(prevNodes =>
            prevNodes.map(node => ({
                ...node,
                selected: selectedNodes.includes(node.id),
            }))
        );
    }, [selectedNodes, setNodes]);

    useEffect(() => {
        const handler = (e: any) => {
            const nodeIds: string[] = e.detail?.nodeIds || [];
            setSelectedNodes(nodeIds);
        };
        window.addEventListener('select-nodes', handler);
        return () => window.removeEventListener('select-nodes', handler);
    }, []);

    // Group state management
    const groupStateManager = useGroupState();

    // Arrangement system state - simplified for integration demo
    const {
        currentArrangementStrategy,
        isArrangementPreviewActive,
        arrangementHistoryIndex,
        arrangementHistory,
        handleArrangementStrategyChange,
        handleArrangement,
        handlePreview,
        handleUndo,
        handleRedo,
    } = useArrangement(nodes, edges, setNodes, reactFlowInstance);

    // Grid snapping functionality
    const gridSnap = useGridSnap();
    const gridSnapDragPreview = useGridSnapDragPreview(
        gridSnap.positionManager,
        gridSnap.isEnabled
    );

    // Group context menu state/handlers
    const { contextMenu, openGroupMenu, openCanvasMenu, openNodeMenu, closeMenu } = useGroupContextMenu();

    // Copy/paste functionality
    const { copyNodes, pasteNodes } = useCopyPaste({
        nodes,
        setNodes,
        selectedNodes,
        reactFlowInstance
    });

    // Undo/redo functionality
    const { undo, redo, canUndo, canRedo, executeDeleteNodes, executeAddNode, executeAddEdge, executeDeleteEdges, executeClearAll } = useUndoRedo({
        nodes,
        edges,
        setNodes,
        setEdges,
        drawingContext,
        groupStateManager,
        parameterContext,
    });

    // Node drag constraints integration
    const constraintIntegration = useNodeDragConstraintIntegration(
        nodes,
        groupStateManager.groupState.groups,
        false // expandGroups = false for now
    );

    // Compute node IDs with undefined parameter references
    const nodesWithUndefinedParams = useMemo(() => {
        const refCheck = parameterContext.checkNodeReferences(nodes);
        const undefinedParamSet = new Set(refCheck.undefinedParams);
        return nodes
            .filter(node => {
                // Check P1-P4 fields for undefined parameter references
                return ['P1', 'P2', 'P3', 'P4'].some(key => {
                    const val = node.data?.[key];
                    return val && undefinedParamSet.has(val);
                });
            })
            .map(node => node.id);
    }, [nodes, parameterContext]);

    // Initialize search functionality
    const {
        searchState,
        handleSearchInput,
        handleSearchModeChange,
        handleClearSearch,
        searchStateRef
    } = useSearchLogic(nodes, edges, reactFlowInstance);

    const clearAll = useCallback(() => {
        executeClearAll();
        nextNodeId.current = 1;
    }, [executeClearAll]);

    const onConnect = useCallback((connection: Connection) => {
        // Create the edge with a unique ID
        const newEdge = {
            ...connection,
            id: `${connection.source}-${connection.target}`,
            source: connection.source!,
            target: connection.target!,
        };

        // Add the edge using undo system
        executeAddEdge(newEdge);

        // Update connected node Vin values (this will be handled separately for now)
        // We can enhance this later to be part of the undo system as well
        const updatedEdges = [...edges, newEdge];
        setNodes(nodes => {
            const incoming = updatedEdges.filter(e => e.target === connection.target);
            const targetNode = nodes.find(n => n.id === connection.target);
            const targetType = targetNode?.type;
            const targetHandleId = connection.targetHandle;

            // Special handling for ARITMETIC nodes with vin2 handle
            if ((targetType === 'soma' || targetType === 'divsao' || targetType === 'multpl') && targetHandleId === 'vin2') {
                // For vin2 handle, store the value in Vin2 property
                const vin1Edges = incoming.filter(e => e.targetHandle !== 'vin2');
                const vin2Edges = incoming.filter(e => e.targetHandle === 'vin2');

                const vin1Array = vin1Edges.map(e => {
                    const src = nodes.find(n => n.id === e.source);
                    return src?.data?.Vout;
                }).filter(Boolean);

                const vin2Array = vin2Edges.map(e => {
                    const src = nodes.find(n => n.id === e.source);
                    return src?.data?.Vout;
                }).filter(Boolean);

                const vin1String = vin1Array.length > 0 ? `[${vin1Array.join(',')}]` : '';
                const vin2String = vin2Array.length > 0 ? vin2Array[0] : '';

                return nodes.map(n =>
                    n.id === connection.target
                        ? { ...n, data: { ...n.data, Vin: vin1String, Vin2: vin2String } }
                        : n
                );
            } else {
                // Standard handling for other nodes or handles
                const vinArray = incoming.map(e => {
                    const src = nodes.find(n => n.id === e.source);
                    if (src) {
                        const data = src.data as Record<string, any>;
                        return data.Vout;
                    }
                    return undefined;
                }).filter(v => typeof v !== 'undefined');
                const vinString = `[${vinArray.join(',')}]`;
                return nodes.map(n =>
                    n.id === connection.target
                        ? { ...n, data: { ...n.data, Vin: vinString } }
                        : n
                );
            }
        });
    }, [executeAddEdge, edges, setNodes]);
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData('application/reactflow');
        if (!raw || !reactFlowInstance) return;
        let nodeData;
        try {
            nodeData = JSON.parse(raw);
        } catch {
            nodeData = { type: raw, label: raw };
        }
        let position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        // Apply grid snapping if enabled
        if (gridSnap.isEnabled) {
            const snappedPosition = gridSnap.positionManager.snapToGrid(position);
            position = { x: snappedPosition.x, y: snappedPosition.y };
        }

        // Find the lowest available ID from 0001 to 9999
        const usedIds = new Set(nodes.map(n => parseInt(n.data?.id, 10)));
        let nextId = 1;
        while (usedIds.has(nextId) && nextId <= 9999) {
            nextId++;
        }
        const id = padId(nextId);
        // Use the dragged type if it matches a registered node type, otherwise fallback to 'placeholder'
        const typeKey = typeof nodeData.type === 'string' ? nodeData.type.toLowerCase() : '';
        const nodeType = typeKey in BASE_NODE_TYPES ? typeKey : 'placeholder';
        const newNode = {
            id,
            type: nodeType,
            position,
            data: { label: nodeData.label, id, Vout: `X${id}` },
        };
        executeAddNode(newNode);
    }, [reactFlowInstance, setNodes, nodes, gridSnap, executeAddNode]);

    // Handle selection with multi-node support
    const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: any[] }) => {
        const nodeIds = nodes.map(n => n.id);
        const edgeIds = edges.map(e => e.id);

        setSelectedNodes(nodeIds);
        setSelectedEdges(edgeIds);

        // In a full implementation, this would update arrangement options
    }, []);

    // Handle node click with Ctrl+click for multi-selection
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        event.stopPropagation();

        if (event.ctrlKey || event.metaKey) {
            // Multi-selection with Ctrl+click
            setSelectedNodes(prev => {
                if (prev.includes(node.id)) {
                    // Remove from selection if already selected
                    return prev.filter(id => id !== node.id);
                } else {
                    // Add to selection
                    return [...prev, node.id];
                }
            });
        } else {
            // Single selection (default behavior)
            setSelectedNodes([node.id]);
        }

        // Clear edge selection when selecting nodes
        setSelectedEdges([]);
    }, []);

    // Handle selection start for drag selection
    const onSelectionStart = useCallback((event: React.MouseEvent) => {
        // This will be handled by ReactFlow's built-in selection box
        console.log('Selection drag started');
    }, []);

    // Handle selection end for drag selection
    const onSelectionEnd = useCallback((event: React.MouseEvent) => {
        // This will be handled by ReactFlow's built-in selection box
        console.log('Selection drag ended');
    }, []);

    // Node drag handlers with constraint integration
    const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
        // Update node dimensions in the constraint system
        const nodeElement = event.target as HTMLElement;
        const nodeRect = nodeElement.getBoundingClientRect();
        constraintIntegration.updateNodeDimensions(node.id, nodeRect.width || 150, nodeRect.height || 40);

        // Initialize grid snap drag preview
        gridSnapDragPreview.onDragStart(event, node);

        // Call the integration hook's drag start handler
        constraintIntegration.onNodeDragStart(event, node);
    }, [constraintIntegration, gridSnapDragPreview]);

    const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
        // Update grid snap drag preview
        gridSnapDragPreview.onDrag(event, node);

        // During drag, we don't update the node position to avoid infinite loops
        // ReactFlow handles the position updates internally during dragging
        // We'll apply constraints only when dragging stops
    }, [gridSnapDragPreview]);

    const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
        // Apply grid snapping first if enabled
        let finalPosition = node.position;
        if (gridSnap.isEnabled) {
            const snappedPosition = gridSnap.positionManager.snapToGrid(node.position);
            finalPosition = { x: snappedPosition.x, y: snappedPosition.y };
        }

        // Apply final position constraints after grid snapping
        const constrainedPosition = constraintIntegration.nodePositionChange(node, finalPosition);

        // Update node position if it was constrained or snapped
        if (constrainedPosition.x !== node.position.x || constrainedPosition.y !== node.position.y) {
            setNodes(currentNodes => currentNodes.map(n =>
                n.id === node.id
                    ? { ...n, position: constrainedPosition }
                    : n
            ));
        }

        // Clear grid snap drag preview
        gridSnapDragPreview.onDragStop(event, node);

        // Call the integration hook's drag stop handler
        constraintIntegration.onNodeDragStop(event, node);

        // Update group bounds after node movement (with a small delay to ensure state is updated)
        const group = groupStateManager.groupState.groups.find(g => g.nodeIds.includes(node.id));
        if (group) {
            setTimeout(() => {
                groupStateManager.updateGroupBounds(group.id, nodes);
            }, 10);
        }
    }, [constraintIntegration, setNodes, groupStateManager, nodes, gridSnap, gridSnapDragPreview]);

    // Callback to toggle split state
    const handleSplitToggle = useCallback((edgeId: string, split: boolean) => {
        setEdges(eds =>
            eds.map(e =>
                e.id === edgeId
                    ? { ...e, data: { ...e.data, split } }
                    : e
            )
        );
    }, [setEdges]);

    // Keyboard shortcuts moved to hook below

    // Import the useParameter hook
    // const parameterContext = useParameter(); // This line is removed as per the edit hint

    const exportNodes = useCallback(() => {
        // Check for undefined parameter references
        const nodeReferenceCheck = parameterContext.checkNodeReferences(nodes);

        // If there are undefined parameters, show a warning
        if (!nodeReferenceCheck.valid) {
            const undefinedParamsStr = nodeReferenceCheck.undefinedParams.join(', ');
            toast.warning(`Warning: Undefined parameters found: ${undefinedParamsStr}`);
        }

        const exportData = {
            nodes: nodes.map(n => ({
                id: n.id,
                type: n.type,
                position: n.position,
                data: n.data,
            })),
            edges: edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
                type: e.type,
                data: e.data,
                label: e.label,
            })),
            // Include drawing data in export
            drawingData: drawingContext.exportDrawingData(),
            // Include group data in export
            groupData: groupStateManager.getGroupStateForPersistence(),
            // Include parameters in export
            parameters: parameterContext.exportParameters(),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'diagram.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [nodes, edges, drawingContext, groupStateManager]);

    const updateConnectedVins = useCallback((changedNodeId: string, handleId?: string) => {
        setNodes(nodes => {
            // Find all outgoing edges from changedNodeId
            const outgoingEdges = edgesRef.current.filter(e => e.source === changedNodeId);
            // For each target node, update its Vin to reflect the current Vout(s) of its sources
            return nodes.map(n => {
                // If this node is a target of an outgoing edge
                if (outgoingEdges.some(e => e.target === n.id)) {
                    // Find all incoming edges to this node
                    const incomingEdges = edgesRef.current.filter(e => e.target === n.id);

                    // Special handling for ARITMETIC nodes
                    if (n.type === 'soma' || n.type === 'divsao' || n.type === 'multpl') {
                        const vin1Edges = incomingEdges.filter(e => e.targetHandle !== 'vin2');
                        const vin2Edges = incomingEdges.filter(e => e.targetHandle === 'vin2');

                        const vin1Array = vin1Edges.map(e => {
                            const src = nodes.find(node => node.id === e.source);
                            return src?.data?.Vout;
                        }).filter(Boolean);

                        const vin2Array = vin2Edges.map(e => {
                            const src = nodes.find(node => node.id === e.source);
                            return src?.data?.Vout;
                        }).filter(Boolean);

                        const vin1String = vin1Array.length > 0 ? `[${vin1Array.join(',')}]` : '';
                        const vin2String = vin2Array.length > 0 ? vin2Array[0] : '';

                        return { ...n, data: { ...n.data, Vin: vin1String, Vin2: vin2String } };
                    } else {
                        // Standard handling for other nodes
                        const newVinArray = incomingEdges.map(e => {
                            const src = nodes.find(node => node.id === e.source);
                            return src?.data?.Vout;
                        }).filter(Boolean);
                        return { ...n, data: { ...n.data, Vin: `[${newVinArray.join(',')}]` } };
                    }
                }
                return n;
            });
        });
    }, [setNodes]);

    // Helper to get Vout from a node
    const getNodeVout = useCallback((nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId);
        return node?.data?.Vout || "X";
    }, [nodes]);

    // Edges with injected data for split/unsplit
    const edgesWithSplit = useMemo(() =>
        edges.map(e => ({
            ...e,
            data: {
                ...e.data,
                onSplitToggle: handleSplitToggle,
                sourceVout: getNodeVout(e.source),
                split: e.data?.split || false,
            }
        })),
        [edges, handleSplitToggle, getNodeVout]
    );

    const nodesWithUndefinedParamsRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        nodesWithUndefinedParamsRef.current = new Set(nodesWithUndefinedParams);
    }, [nodesWithUndefinedParams]);

    // Memoize node wrapper creation to prevent recreation on every render
    const createNodeWrapper = useCallback((Component: any) => {
        return (props: any) => {
            const isHighlighted = searchState.highlightedElements.nodes.includes(props.id);
            const isDimmed = searchState.isActive && !isHighlighted;

            return (
                <Component
                    {...props}
                    updateConnectedVins={updateConnectedVins}
                    showBlockNumbers={showBlockNumbers}
                    showVariableNames={showVariableNames}
                    isSearchHighlighted={isHighlighted}
                    isSearchDimmed={isDimmed}
                />
            );
        };
    }, [updateConnectedVins, showBlockNumbers, showVariableNames, searchState.highlightedElements.nodes, searchState.isActive]);

    // Create wrapped node types - stable across renders
    const nodeTypes = useMemo(() => {
        const types: Record<string, any> = {};
        for (const [key, Comp] of Object.entries(BASE_NODE_TYPES)) {
            types[key] = createNodeWrapper((props: any) => (
                <Comp
                    {...props}
                    isParamUndefined={nodesWithUndefinedParamsRef.current.has(props.id)}
                />
            ));
        }
        return types;
    }, [createNodeWrapper]);

    // Create wrapped edge types with search highlighting - stable across renders
    const edgeTypes = useMemo(() => {
        return {
            default: (props: any) => {
                const currentSearch = searchStateRef.current;
                const isHighlighted = currentSearch.highlightedElements.edges.includes(props.id);
                const isDimmed = currentSearch.isActive && !isHighlighted;

                return (
                    <SearchHighlightEdge
                        {...props}
                        isSearchHighlighted={isHighlighted}
                        isSearchDimmed={isDimmed}
                    />
                );
            }
        };
    }, []); // no deps

    function handleCreateNode(type: string) {
        if (!reactFlowInstance) return;
        // Find the lowest available ID from 0001 to 9999
        const usedIds = new Set(nodes.map(n => parseInt(n.data?.id, 10)));
        let nextId = 1;
        while (usedIds.has(nextId) && nextId <= 9999) {
            nextId++;
        }
        const id = padId(nextId);
        // Center of viewport
        let center = reactFlowInstance.screenToFlowPosition({
            x: (reactFlowWrapper.current?.getBoundingClientRect().width ?? 800) / 2,
            y: (reactFlowWrapper.current?.getBoundingClientRect().height ?? 600) / 2,
        });

        // Apply grid snapping if enabled
        if (gridSnap.isEnabled) {
            const snappedPosition = gridSnap.positionManager.snapToGrid(center);
            center = { x: snappedPosition.x, y: snappedPosition.y };
        }

        const newNode = {
            id,
            type,
            position: center,
            data: { label: type.charAt(0).toUpperCase() + type.slice(1), id, Vout: `X${id}` },
        };
        executeAddNode(newNode);
    }



    const loadNodes = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    if (data && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
                        // Reset the nextNodeId to the highest ID + 1
                        const maxId = Math.max(...data.nodes.map((node: any) => parseInt(node.data?.id || '0', 10)), 0);
                        nextNodeId.current = maxId + 1;

                        setNodes(data.nodes);
                        setEdges(data.edges);

                        // Import drawing data if present
                        if (data.drawingData) {
                            drawingContext.importDrawingData(data.drawingData);
                        } else {
                            // Clear drawing data if not present in loaded file
                            drawingContext.clearDrawing();
                        }

                        // Import group data if present
                        if (data.groupData) {
                            groupStateManager.loadGroupState(data.groupData);
                        } else {
                            // Clear group data if not present in loaded file
                            groupStateManager.resetGroupState();
                        }

                        // Import parameters if present
                        if (data.parameters) {
                            parameterContext.importParameters(data.parameters);
                        } else {
                            // Clear parameters if not present in loaded file
                            parameterContext.clearParameters();
                        }

                        toast.success('Diagrama carregado com sucesso!');
                    } else {
                        toast.error('Formato de arquivo inválido');
                    }
                } catch (error) {
                    toast.error('Erro ao carregar arquivo');
                    console.error('Error loading file:', error);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, [setNodes, setEdges, drawingContext, groupStateManager]);

    const importCDU = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.cdu';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('http://localhost:8000/import', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                if (data && Array.isArray(data.nodes) && Array.isArray(data.edges)) {
                    // Reset the nextNodeId to the highest ID + 1
                    const maxId = Math.max(...data.nodes.map((node: any) => parseInt(node.data?.id || '0', 10)), 0);
                    nextNodeId.current = maxId + 1;

                    setNodes(data.nodes);
                    setEdges(data.edges);

                    // Import drawing data if present
                    if (data.drawingData) {
                        drawingContext.importDrawingData(data.drawingData);
                    } else {
                        drawingContext.clearDrawing();
                    }

                    // Import group data if present
                    if (data.groupData) {
                        groupStateManager.loadGroupState(data.groupData);
                    } else {
                        groupStateManager.resetGroupState();
                    }

                    // Import parameters if present
                    if (data.parameters) {
                        parameterContext.importParameters(data.parameters);
                    } else {
                        parameterContext.clearParameters();
                    }

                    toast.success('CDU importado com sucesso!');
                } else {
                    toast.error('Formato de resposta inválido do servidor');
                }
            } catch (error) {
                toast.error('Erro ao importar CDU');
                console.error('Error importing CDU:', error);
            }
        };
        input.click();
    }, [setNodes, setEdges, drawingContext, groupStateManager, parameterContext]);

    // Note: Removed automatic selection clearing to avoid infinite loops
    // Users can manually clear selections by clicking on empty canvas

    // Handle group dragging
    useEffect(() => {
        const handler = (e: any) => {
            const { groupId, delta } = e.detail || {};
            if (!groupId || !delta) return;
            // Find the group
            const group = groupStateManager.groupState.groups.find(g => g.id === groupId);
            if (!group) return;
            // Move all member nodes
            setNodes(nodes => nodes.map(node =>
                group.nodeIds.includes(node.id)
                    ? { ...node, position: { x: node.position.x + delta.dx, y: node.position.y + delta.dy } }
                    : node
            ));
            // Update group bounds after moving nodes
            setTimeout(() => {
                groupStateManager.updateGroupBounds(groupId, nodes.map(node =>
                    group.nodeIds.includes(node.id)
                        ? { ...node, position: { x: node.position.x + delta.dx, y: node.position.y + delta.dy } }
                        : node
                ));
            }, 0);
        };
        window.addEventListener('move-group', handler);
        return () => window.removeEventListener('move-group', handler);
    }, [groupStateManager, setNodes, nodes]);

    const proOptions = { hideAttribution: true };

    // Install global keyboard shortcuts
    useGlobalKeyboardShortcuts({
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
        copyNodes,
        pasteNodes,
        undo,
        redo,
        executeDeleteNodes,
        executeDeleteEdges,
    });

    return (
        <>
            <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} onCreateNode={handleCreateNode} resetKey={commandMenuResetKey} />
            <Toaster position="top-center" />
            <div className="h-screen flex flex-col">
                <SidebarProvider className="flex flex-col h-full">
                    <SiteHeader
                        onNew={clearAll}
                        onExport={exportNodes}
                        onOpen={loadNodes}
                        onImport={importCDU}
                        showBlockNumbers={showBlockNumbers}
                        onToggleBlockNumbers={() => setShowBlockNumbers(v => !v)}
                        showVariableNames={showVariableNames}
                        onToggleVariableNames={() => setShowVariableNames(v => !v)}
                        searchState={searchState}
                        onSearchInput={handleSearchInput}
                        onSearchModeChange={handleSearchModeChange}
                        onClearSearch={handleClearSearch}
                        isDrawingMode={drawingContext.isDrawingMode}
                        onToggleDrawingMode={handleToggleDrawingMode}
                        // New arrangement system props
                        currentArrangementStrategy={currentArrangementStrategy}
                        onArrangementStrategyChange={handleArrangementStrategyChange}
                        onArrangement={handleArrangement}
                        onArrangementPreview={handlePreview}
                        onArrangementUndo={handleUndo}
                        onArrangementRedo={handleRedo}
                        isArrangementPreviewActive={isArrangementPreviewActive}
                        canUndo={arrangementHistoryIndex >= 0}
                        canRedo={arrangementHistoryIndex < arrangementHistory.length - 1}
                        // Copy/paste functions for testing
                        onCopy={copyNodes}
                        onPaste={pasteNodes}
                        onToggleParameterSidebar={handleToggleParameterSidebar}
                        isParameterSidebarOpen={isParameterSidebarOpen}
                    />
                    <div className="flex flex-1" style={{ position: 'relative' }}>
                        <AppSidebar />
                        <SidebarInset>
                            <div
                                className="w-full h-full relative"
                                ref={reactFlowWrapper}
                                style={{
                                    transition: 'margin-right 0.3s',
                                    marginRight: isParameterSidebarOpen ? 350 : 0,
                                }}
                            >
                                <div className="relative w-full h-full">
                                    <ReactFlow
                                        nodeTypes={nodeTypes}
                                        nodes={nodes}
                                        edgeTypes={edgeTypes}
                                        edges={edgesWithSplit}
                                        connectionMode={ConnectionMode.Strict}
                                        onConnect={drawingContext.isDrawingMode ? undefined : onConnect}
                                        onNodesChange={drawingContext.isDrawingMode ? undefined : onNodesChange}
                                        onEdgesChange={drawingContext.isDrawingMode ? undefined : onEdgesChange}
                                        onDrop={drawingContext.isDrawingMode ? undefined : onDrop}
                                        onDragOver={drawingContext.isDrawingMode ? undefined : onDragOver}
                                        onInit={setReactFlowInstance}
                                        onSelectionChange={drawingContext.isDrawingMode ? undefined : onSelectionChange}
                                        onNodeClick={drawingContext.isDrawingMode ? undefined : onNodeClick}
                                        onSelectionStart={drawingContext.isDrawingMode ? undefined : onSelectionStart}
                                        onSelectionEnd={drawingContext.isDrawingMode ? undefined : onSelectionEnd}
                                        onNodeDragStart={drawingContext.isDrawingMode ? undefined : onNodeDragStart}
                                        onNodeDrag={drawingContext.isDrawingMode ? undefined : onNodeDrag}
                                        onNodeDragStop={drawingContext.isDrawingMode ? undefined : onNodeDragStop}
                                        onPaneClick={() => {
                                            // Clear group selection when clicking on empty canvas
                                            groupStateManager.clearSelection();
                                        }}
                                        onPaneContextMenu={(event) => {
                                            event.preventDefault();
                                            // Only show menu if multiple nodes are selected
                                            if (selectedNodes.length > 1) {
                                                openCanvasMenu(event.clientX, event.clientY);
                                            }
                                        }}
                                        onNodeContextMenu={(event, node) => {
                                            event.preventDefault();
                                            event.stopPropagation();

                                            // If the clicked node is already selected and part of a multi-selection
                                            if (selectedNodes.includes(node.id) && selectedNodes.length > 1) {
                                                // Show the context menu at the cursor position with all selected nodes
                                                openNodeMenu(event.clientX, event.clientY, selectedNodes);
                                            } else if (!selectedNodes.includes(node.id)) {
                                                // If the node isn't selected, select it first
                                                setSelectedNodes([node.id]);
                                            }
                                        }}
                                        defaultEdgeOptions={{ type: 'default', }}
                                        nodesDraggable={!drawingContext.isDrawingMode}
                                        nodesConnectable={!drawingContext.isDrawingMode}
                                        elementsSelectable={!drawingContext.isDrawingMode}
                                        multiSelectionKeyCode="Control"
                                        selectionKeyCode="Shift"
                                        panOnDrag={true}
                                        selectNodesOnDrag={false}
                                        proOptions={proOptions}
                                    >
                                        <GroupLayer
                                            groups={groupStateManager.groupState.groups}
                                            selectedGroupIds={groupStateManager.groupState.selectedGroupIds}
                                            nodes={nodes}
                                            groupStateManager={groupStateManager}
                                            selectedNodes={selectedNodes}
                                            contextMenu={contextMenu}
                                            closeMenu={closeMenu}
                                            openGroupMenu={openGroupMenu}
                                            setNodes={setNodes}
                                        />
                                        <Background gap={12} size={2} color={resolvedTheme === "dark" ? "#333" : "#aaa"} />
                                        <Controls position="top-right" />
                                        <MiniMap />


                                        {/* Group Layer for rendering groups */}
                                        <GroupLayer
                                            groups={groupStateManager.groupState.groups}
                                            selectedGroupIds={groupStateManager.groupState.selectedGroupIds}
                                            nodes={nodes}
                                            groupStateManager={groupStateManager}
                                            selectedNodes={selectedNodes}
                                            contextMenu={contextMenu}
                                            closeMenu={closeMenu}
                                            openGroupMenu={openGroupMenu}
                                            setNodes={setNodes}
                                            constraintIntegration={constraintIntegration}
                                        />
                                        <DrawingCanvasOverlay />
                                        {/* Constraint violation indicators */}
                                        {constraintIntegration.constraintViolation && (() => {
                                            const group = groupStateManager.groupState.groups.find(g => g.id === constraintIntegration.constraintViolation?.groupId);
                                            return group ? (
                                                <GroupConstraintIndicator
                                                    group={group}
                                                    direction={constraintIntegration.constraintViolation.direction}
                                                    active={true}
                                                    pulsing={true}
                                                />
                                            ) : null;
                                        })()}

                                        {/* Grid snap preview during drag operations */}
                                        <GridSnapPreview
                                            dragPreview={gridSnapDragPreview.dragPreview}
                                            gridSize={gridSnap.gridSize}
                                        />
                                    </ReactFlow>
                                </div>

                                {/* Drawing Mode Status Indicator */}
                                {drawingContext.isDrawingMode && (
                                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
                                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                            Modo Desenho Ativo
                                        </div>
                                    </div>
                                )}

                                {/* Drawing Toolbar - Only show when drawing mode is active */}
                                {drawingContext.isDrawingMode && (
                                    <div className="absolute top-4 right-4 z-20">
                                        <DrawingToolbar />
                                    </div>
                                )}
                            </div>
                        </SidebarInset>
                    </div>
                </SidebarProvider>
                <ParameterSidebar isOpen={isParameterSidebarOpen} onToggle={handleToggleParameterSidebar} nodes={nodes} />
            </div>
        </>
    )
}

export default App
