import ReactFlow, { Background, ConnectionMode, Controls, MiniMap, useEdgesState, useNodesState, type Connection, addEdge, type Node } from 'reactflow'
import type { ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css'

import DefaultEdge from './components/edges/DefaultEdge'
import SearchHighlightEdge from './components/edges/SearchHighlightEdge'
import { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { useSearch } from '@/hooks/useSearch';
import { visualizationController } from '@/lib/visualization-controller';
import type { SearchableNode, SearchableEdge } from '@/lib/search-types';

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
import { useDrawing } from "@/contexts/DrawingContext"
import { DrawingCanvasOverlay } from "@/components/drawing/DrawingCanvasOverlay"
import { DrawingToolbar } from "@/components/drawing/DrawingToolbar"
import { useGroupState } from "@/hooks/useGroupState"
import { GroupCanvas } from "@/components/groups"
import { GroupLayer, useGroupContextMenu } from "./components/groups/GroupLayer"
import { POLS } from './components/nodes/POLS'
import { COMPAR } from './components/nodes/COMPAR';
import { ENTRAD } from './components/nodes/ENTRAD'
import { FRACAO } from './components/nodes/FRACAO'
import { LEDLAG } from './components/nodes/LEDLAG'
import { GANHO } from './components/nodes/GANHO'
import { ORD1 } from './components/nodes/ORD1'
import { Placeholder } from './components/nodes/PLACEHOLDER'
import { PROINT } from './components/nodes/PROINT'
import { FUNCAO } from './components/nodes/FUNCAO';
import { IMPORT } from './components/nodes/IMPORT';
import { EXPORT } from './components/nodes/EXPORT'
import { SAIDA } from './components/nodes/SAIDA';
import { LIMITA } from './components/nodes/LIMITA';
import { GENERIC1P } from './components/nodes/GENERIC1P';
import { GENERIC } from './components/nodes/GENERIC';
import ELK from 'elkjs/lib/elk.bundled.js';
import { LAGNL } from './components/nodes/LAGNL';
import { WSHOUT } from './components/nodes/WSHOUT';
import { LOGIC } from './components/nodes/LOGIC';
import { HOLD } from './components/nodes/HOLD';
import { ATAN2 } from './components/nodes/ATAN2';
import { ATRASO } from './components/nodes/ATRASO';
import { GENERIC3P } from './components/nodes/GENERIC3P';
import { DLAYONOFF } from './components/nodes/DLAYONOFF';
import { MONEST } from './components/nodes/MONEST';
import { OFFSET } from './components/nodes/OFFSET'
import { RAMPA } from './components/nodes/RAMPA'
import { PULSO } from './components/nodes/PULSO'
import { GENERIC4P } from './components/nodes/GENERIC4P'
import { HISTE1 } from './components/nodes/HISTE1'
import { GENERIC2P } from './components/nodes/GENERIC2P'
import { X2 } from './components/nodes/X2'
import { XK } from './components/nodes/XK'
import { NOT } from './components/nodes/NOT'
import { MINMAX } from './components/nodes/MINMAX'
import { ARITIMETIC } from './components/nodes/ARITMETIC'
import { FIMPRG } from './components/nodes/FIMPRG';
import { DERIVA } from './components/nodes/DERIVA';
import { SOBDES } from './components/nodes/SOBDES';
import { ALERTA } from './components/nodes/ALERTA';
import { SELET2 } from './components/nodes/SELET2';
import { INTRES } from './components/nodes/INTRES';
export const iframeHeight = "800px"

// Define node types outside component to prevent recreation
const BASE_NODE_TYPES = {
    alerta: ALERTA,
    fimprg: FIMPRG,
    deriva: DERIVA,
    subida: SOBDES,
    descid: SOBDES,
    soma: ARITIMETIC,
    divsao: ARITIMETIC,
    multpl: ARITIMETIC,
    min: MINMAX,
    max: MINMAX,
    noise: GENERIC1P,
    not: NOT,
    fflop1: LOGIC,
    x2: X2,
    xk: XK,
    reta: GENERIC2P,
    exp: GENERIC3P,
    deadb1: GENERIC4P,
    deadb2: GENERIC4P,
    histe1: HISTE1,
    sat01: GENERIC4P,
    steps: GENERIC4P,
    pulso: PULSO,
    rampa: RAMPA,
    monest: MONEST,
    offset: OFFSET,
    dlayon: DLAYONOFF,
    dlayof: DLAYONOFF,
    dismax: GENERIC3P,
    dismin: GENERIC3P,
    delay: GENERIC,
    atan2: ATAN2,
    and: LOGIC,
    or: LOGIC,
    xor: LOGIC,
    nand: LOGIC,
    nor: LOGIC,
    nxor: LOGIC,
    thold: HOLD,
    shold: HOLD,
    atraso: ATRASO,
    fex: GENERIC,
    proint: PROINT,
    ord1: ORD1,
    fracao: FRACAO,
    placeholder: Placeholder,
    lt: COMPAR,
    le: COMPAR,
    gt: COMPAR,
    ge: COMPAR,
    eq: COMPAR,
    ne: COMPAR,
    entrad: ENTRAD,
    export: EXPORT,
    abs: FUNCAO,
    acos: FUNCAO,
    asin: FUNCAO,
    atan: FUNCAO,
    cos: FUNCAO,
    degree: FUNCAO,
    invrs: FUNCAO,
    log: FUNCAO,
    log10: FUNCAO,
    menos: FUNCAO,
    radian: FUNCAO,
    round: FUNCAO,
    sin: FUNCAO,
    sinal: FUNCAO,
    sqrt: FUNCAO,
    ledlag: LEDLAG,
    ldlag2: LEDLAG,
    tan: FUNCAO,
    trunc: FUNCAO,
    ganho: GANHO,
    import: IMPORT,
    saida: SAIDA,
    limita: LIMITA,
    ratelm: LIMITA,
    pols: POLS,
    lagnl: LAGNL,
    wshout: WSHOUT,
    wshou2: WSHOUT,
    proin2: PROINT,
    selet2: SELET2,
    intres: INTRES,
} as const;

// Define edge types outside component to prevent recreation
const BASE_EDGE_TYPES = {
    default: DefaultEdge,
} as const;


function padId(num: number) {
    return num.toString().padStart(4, '0');
}

function App() {
    const [commandOpen, setCommandOpen] = useState(false);
    const [commandMenuResetKey, setCommandMenuResetKey] = useState(0);
    const [showBlockNumbers, setShowBlockNumbers] = useState(true);
    const [showVariableNames, setShowVariableNames] = useState(true);

    // Initialize drawing cursor management
    useDrawingCursor();

    // Get drawing context for persistence and mode management
    const drawingContext = useDrawing();

    // Handle drawing mode toggle
    const handleToggleDrawingMode = useCallback(() => {
        drawingContext.setDrawingMode(!drawingContext.isDrawingMode);
    }, [drawingContext]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement;
            const isInput =
                active &&
                (
                    active.tagName === 'INPUT' ||
                    active.tagName === 'TEXTAREA' ||
                    (active as HTMLElement).isContentEditable
                );
            if (!isInput && e.key === "/") {
                e.preventDefault();
                setCommandMenuResetKey(k => k + 1);
                setCommandOpen(true);
            }
            // Toggle drawing mode with 'D' key
            if (!isInput && e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
                e.preventDefault();
                handleToggleDrawingMode();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [handleToggleDrawingMode]);

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
    const [currentArrangementStrategy, setCurrentArrangementStrategy] = useState('hierarchical');
    const [isArrangementPreviewActive, setIsArrangementPreviewActive] = useState(false);
    const [lockedNodes, setLockedNodes] = useState<Set<string>>(new Set());
    const [arrangementHistory, setArrangementHistory] = useState<any[]>([]);
    const [arrangementHistoryIndex, setArrangementHistoryIndex] = useState(-1);

    // Group context menu state/handlers
    const { contextMenu, openGroupMenu, openCanvasMenu, closeMenu } = useGroupContextMenu();

    // Convert ReactFlow nodes and edges to searchable format
    const searchableNodes: SearchableNode[] = useMemo(() =>
        nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                id: node.data?.id || node.id,
                Vin: node.data?.Vin,
                Vout: node.data?.Vout
            }
        })), [nodes]
    );

    const searchableEdges: SearchableEdge[] = useMemo(() =>
        edges.map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
            data: edge.data,
            label: edge.label
        })), [edges]
    );

    // Initialize search functionality
    const {
        searchState,
        handleSearchInput,
        handleSearchModeChange,
        clearSearch
    } = useSearch(searchableNodes, searchableEdges);

    // Connect visualization controller with ReactFlow instance
    useEffect(() => {
        if (reactFlowInstance) {
            visualizationController.setReactFlowInstance(reactFlowInstance);
        }
    }, [reactFlowInstance]);

    // Arrangement system integration hooks - simplified for demo
    useEffect(() => {
        // In a full implementation, this would initialize the arrangement system
        // console.log('Arrangement system would be initialized here');
    }, []);

    // Update arrangement system with current nodes and edges
    useEffect(() => {
        // In a full implementation, this would update the arrangement manager
        // console.log('Arrangement system would be updated with nodes/edges here');
    }, [nodes, edges]);

    // Handle search result visualization
    useEffect(() => {
        if (searchState.results && searchState.isActive) {
            // Apply highlighting and center view on search results
            visualizationController.highlightSearchResults(searchState.results);
            visualizationController.centerViewOnNodes(searchState.results.nodes);
        } else {
            // Clear highlighting when search is inactive
            visualizationController.clearHighlighting();
        }
    }, [searchState.results, searchState.isActive]);

    // Enhanced clear search function that also clears visualization
    const handleClearSearch = useCallback(() => {
        clearSearch();
        visualizationController.clearHighlighting();
    }, [clearSearch]);

    const clearAll = useCallback(() => {
        setNodes([]);
        setEdges([]);
        nextNodeId.current = 1;
        drawingContext.clearDrawing();
        groupStateManager.resetGroupState();
    }, [setNodes, setEdges, drawingContext, groupStateManager]);

    const onConnect = useCallback((connection: Connection) => {
        setEdges(currentEdges => {
            const updatedEdges = addEdge(connection, currentEdges);
            setNodes(nodes => {
                const incoming = updatedEdges.filter(e => e.target === connection.target);
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
            });
            return updatedEdges;
        });
    }, [setEdges, setNodes]);
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
        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });
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
        setNodes(nds => nds.concat(newNode));
    }, [reactFlowInstance, setNodes, nodes]);

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

    // Handle delete key
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const active = document.activeElement;
            const isInput =
                active &&
                (
                    active.tagName === 'INPUT' ||
                    active.tagName === 'TEXTAREA' ||
                    (active as HTMLElement).isContentEditable
                );

            if ((event.key === 'Delete' || event.key === 'Backspace') && !isInput) {
                if (selectedNodes.length > 0) {
                    setNodes(nds => nds.filter(n => !selectedNodes.includes(n.id)));
                    setEdges(eds => eds.filter(e => !selectedNodes.includes(e.source) && !selectedNodes.includes(e.target)));
                }
                if (selectedEdges.length > 0) {
                    setEdges(eds => eds.filter(e => !selectedEdges.includes(e.id)));
                }
            }

            // Split/Unsplit edges with 'S' key
            if (event.key.toLowerCase() === 's' && !isInput && selectedEdges.length > 0) {
                event.preventDefault();
                selectedEdges.forEach(edgeId => {
                    const edge = edges.find(e => e.id === edgeId);
                    if (edge) {
                        const currentSplit = edge.data?.split || false;
                        handleSplitToggle(edgeId, !currentSplit);
                    }
                });
            }

            // Group selected nodes with Ctrl+G
            if (event.key.toLowerCase() === 'g' && event.ctrlKey && !event.shiftKey && !isInput) {
                event.preventDefault();
                if (selectedNodes.length > 1) {
                    const nodeIdsToGroup = selectedNodes.filter(
                        nodeId => !groupStateManager.groupState.groups.some(g => g.nodeIds.includes(nodeId))
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
            }

            // Ungroup selected groups with Ctrl+Shift+G
            if (event.key.toLowerCase() === 'g' && event.ctrlKey && event.shiftKey && !isInput) {
                event.preventDefault();
                const selectedGroups = groupStateManager.groupState.selectedGroupIds;
                if (selectedGroups.length > 0) {
                    selectedGroups.forEach(groupId => {
                        groupStateManager.deleteGroup(groupId);
                    });
                    toast.success(`Ungrouped ${selectedGroups.length} group(s)`);
                } else {
                    toast.error('No groups selected to ungroup');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodes, selectedEdges, setNodes, setEdges, edges, handleSplitToggle, groupStateManager, nodes]);

    const exportNodes = useCallback(() => {
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
                type: e.type,
                data: e.data,
                label: e.label,
            })),
            // Include drawing data in export
            drawingData: drawingContext.exportDrawingData(),
            // Include group data in export
            groupData: groupStateManager.getGroupStateForPersistence(),
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

    const updateConnectedVins = useCallback((changedNodeId: string) => {
        setNodes(nodes => {
            // Find all outgoing edges from changedNodeId
            const outgoingEdges = edgesRef.current.filter(e => e.source === changedNodeId);
            // For each target node, update its Vin to reflect the current Vout(s) of its sources
            return nodes.map(n => {
                // If this node is a target of an outgoing edge
                if (outgoingEdges.some(e => e.target === n.id)) {
                    // Find all incoming edges to this node
                    const incomingEdges = edgesRef.current.filter(e => e.target === n.id);
                    const newVinArray = incomingEdges.map(e => {
                        const src = nodes.find(node => node.id === e.source);
                        return src?.data?.Vout;
                    }).filter(Boolean);
                    return { ...n, data: { ...n.data, Vin: `[${newVinArray.join(',')}]` } };
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

    // Create wrapped node types - memoized to prevent recreation
    const nodeTypes = useMemo(() => {
        const wrappedTypes: any = {};
        Object.keys(BASE_NODE_TYPES).forEach(key => {
            wrappedTypes[key] = createNodeWrapper(BASE_NODE_TYPES[key as keyof typeof BASE_NODE_TYPES]);
        });
        return wrappedTypes;
    }, [createNodeWrapper]);

    // Create wrapped edge types with search highlighting - memoized to prevent recreation
    const edgeTypes = useMemo(() => {
        return {
            default: (props: any) => {
                const isHighlighted = searchState.highlightedElements.edges.includes(props.id);
                const isDimmed = searchState.isActive && !isHighlighted;

                return (
                    <SearchHighlightEdge
                        {...props}
                        isSearchHighlighted={isHighlighted}
                        isSearchDimmed={isDimmed}
                    />
                );
            }
        };
    }, [searchState.highlightedElements.edges, searchState.isActive]);

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
        const center = reactFlowInstance.screenToFlowPosition({
            x: (reactFlowWrapper.current?.getBoundingClientRect().width ?? 800) / 2,
            y: (reactFlowWrapper.current?.getBoundingClientRect().height ?? 600) / 2,
        });
        const newNode = {
            id,
            type,
            position: center,
            data: { label: type.charAt(0).toUpperCase() + type.slice(1), id, Vout: `X${id}` },
        };
        setNodes(nds => nds.concat(newNode));
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

    // Layout algorithm implementations first
    const applyHierarchicalLayout = useCallback(async () => {
        // Hierarchical layout - arrange nodes in layers based on signal flow
        const allNodes = nodes;
        const allEdges = edges;

        // Find nodes with no incoming edges (sources)
        const sourceNodes = allNodes.filter(node =>
            !allEdges.some(edge => edge.target === node.id)
        );

        const nodePositions = new Map();
        const processed = new Set();
        let currentLayer = 0;

        // Start with source nodes
        if (sourceNodes.length > 0) {
            sourceNodes.forEach((node, index) => {
                nodePositions.set(node.id, {
                    x: 50,
                    y: 50 + index * 120
                });
                processed.add(node.id);
            });
            currentLayer = 1;
        }

        // Process remaining nodes layer by layer
        while (processed.size < allNodes.length) {
            const currentLayerNodes = allNodes.filter(node => {
                if (processed.has(node.id)) return false;
                const incomingEdges = allEdges.filter(edge => edge.target === node.id);
                return incomingEdges.length === 0 || incomingEdges.every(edge => processed.has(edge.source));
            });

            if (currentLayerNodes.length === 0) {
                // Handle remaining nodes (likely in cycles)
                const remainingNodes = allNodes.filter(node => !processed.has(node.id));
                remainingNodes.forEach((node, index) => {
                    nodePositions.set(node.id, {
                        x: 50 + currentLayer * 250,
                        y: 50 + index * 120
                    });
                    processed.add(node.id);
                });
                break;
            }

            currentLayerNodes.forEach((node, index) => {
                nodePositions.set(node.id, {
                    x: 50 + currentLayer * 250,
                    y: 50 + index * 120
                });
                processed.add(node.id);
            });

            currentLayer++;
        }

        return Array.from(nodePositions.entries()).map(([id, pos]) => ({
            id,
            x: pos.x,
            y: pos.y
        }));
    }, [nodes, edges]);

    const applyGridLayout = useCallback(async () => {
        // Grid layout - arrange nodes in a regular grid
        const gridSize = Math.ceil(Math.sqrt(nodes.length));
        const spacing = 200;

        return nodes.map((node, index) => ({
            id: node.id,
            x: 50 + (index % gridSize) * spacing,
            y: 50 + Math.floor(index / gridSize) * spacing
        }));
    }, [nodes]);

    const applyCircularLayout = useCallback(async () => {
        // Circular layout - arrange nodes in a circle
        const centerX = 400;
        const centerY = 300;
        const radius = Math.max(150, nodes.length * 20);

        return nodes.map((node, index) => {
            const angle = (2 * Math.PI * index) / nodes.length;
            return {
                id: node.id,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });
    }, [nodes]);

    const applyForceDirectedLayout = useCallback(async () => {
        // Simple force-directed layout simulation
        const positions = new Map();
        const forces = new Map();

        // Initialize random positions
        nodes.forEach(node => {
            positions.set(node.id, {
                x: Math.random() * 800 + 100,
                y: Math.random() * 600 + 100
            });
            forces.set(node.id, { x: 0, y: 0 });
        });

        // Run simulation for a few iterations
        for (let iteration = 0; iteration < 50; iteration++) {
            // Reset forces
            forces.forEach(force => {
                force.x = 0;
                force.y = 0;
            });

            // Repulsive forces between all nodes
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const node1 = nodes[i];
                    const node2 = nodes[j];
                    const pos1 = positions.get(node1.id);
                    const pos2 = positions.get(node2.id);

                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                    const repulsiveForce = 5000 / (distance * distance);
                    const fx = (dx / distance) * repulsiveForce;
                    const fy = (dy / distance) * repulsiveForce;

                    const force1 = forces.get(node1.id);
                    const force2 = forces.get(node2.id);
                    force1.x -= fx;
                    force1.y -= fy;
                    force2.x += fx;
                    force2.y += fy;
                }
            }

            // Attractive forces for connected nodes
            edges.forEach(edge => {
                const pos1 = positions.get(edge.source);
                const pos2 = positions.get(edge.target);
                if (pos1 && pos2) {
                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                    const attractiveForce = distance * 0.01;
                    const fx = (dx / distance) * attractiveForce;
                    const fy = (dy / distance) * attractiveForce;

                    const force1 = forces.get(edge.source);
                    const force2 = forces.get(edge.target);
                    if (force1 && force2) {
                        force1.x += fx;
                        force1.y += fy;
                        force2.x -= fx;
                        force2.y -= fy;
                    }
                }
            });

            // Apply forces to positions
            positions.forEach((pos, nodeId) => {
                const force = forces.get(nodeId);
                if (force) {
                    pos.x += force.x * 0.1;
                    pos.y += force.y * 0.1;
                }
            });
        }

        return Array.from(positions.entries()).map(([id, pos]) => ({
            id,
            x: pos.x,
            y: pos.y
        }));
    }, [nodes, edges]);

    const applySmartLayout = useCallback(async () => {
        // Smart layout - choose the best layout based on diagram characteristics
        const nodeCount = nodes.length;
        const edgeCount = edges.length;
        const connectivity = nodeCount > 0 ? edgeCount / nodeCount : 0;

        // Analyze diagram structure
        const sourceNodes = nodes.filter(node =>
            !edges.some(edge => edge.target === node.id)
        );
        const sinkNodes = nodes.filter(node =>
            !edges.some(edge => edge.source === node.id)
        );

        // Choose layout based on characteristics
        if (sourceNodes.length > 0 && sinkNodes.length > 0 && connectivity < 2) {
            // Hierarchical for flow-like diagrams
            return applyHierarchicalLayout();
        } else if (nodeCount <= 10) {
            // Circular for small diagrams
            return applyCircularLayout();
        } else if (connectivity > 3) {
            // Force-directed for highly connected diagrams
            return applyForceDirectedLayout();
        } else {
            // Grid for everything else
            return applyGridLayout();
        }
    }, [nodes, edges, applyHierarchicalLayout, applyCircularLayout, applyForceDirectedLayout, applyGridLayout]);

    // Function to handle arrangement with a specific strategy
    const handleArrangementWithStrategy = useCallback(async (strategy: string) => {
        if (!reactFlowInstance) {
            toast.error('Canvas not ready for arrangement');
            return;
        }

        try {
            // Store current positions for undo
            const currentPositions = nodes.map(node => ({
                id: node.id,
                x: node.position.x,
                y: node.position.y,
                locked: lockedNodes.has(node.id),
            }));

            // Add to history
            setArrangementHistory(prev => [...prev.slice(0, arrangementHistoryIndex + 1), {
                positions: currentPositions,
                strategy: strategy,
                timestamp: Date.now(),
            }]);
            setArrangementHistoryIndex(prev => prev + 1);

            let newPositions;

            // Apply the selected arrangement strategy
            switch (strategy) {
                case 'hierarchical':
                    newPositions = await applyHierarchicalLayout();
                    break;
                case 'smart':
                    newPositions = await applySmartLayout();
                    break;
                case 'circular':
                    newPositions = await applyCircularLayout();
                    break;
                case 'grid':
                    newPositions = await applyGridLayout();
                    break;
                case 'force-directed':
                    newPositions = await applyForceDirectedLayout();
                    break;
                default:
                    newPositions = await applyHierarchicalLayout();
            }

            // Apply new positions to React Flow nodes
            setNodes(currentNodes => currentNodes.map(node => {
                const newPos = newPositions.find(pos => pos.id === node.id);
                if (newPos && !lockedNodes.has(node.id)) {
                    return {
                        ...node,
                        position: { x: newPos.x, y: newPos.y }
                    };
                }
                return node;
            }));

            // Fit view to show all nodes after arrangement
            setTimeout(() => {
                reactFlowInstance.fitView({ padding: 0.1, duration: 800 });
            }, 100);

            toast.success(`Nodes arranged using ${strategy} layout`);
        } catch (error) {
            console.error('Arrangement failed:', error);
            toast.error(`Failed to arrange nodes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }, [nodes, lockedNodes, reactFlowInstance, arrangementHistoryIndex, setNodes, setArrangementHistory, setArrangementHistoryIndex, applyHierarchicalLayout, applySmartLayout, applyCircularLayout, applyGridLayout, applyForceDirectedLayout]);

    // Working arrangement system that moves nodes and fits view
    const handleArrangementStrategyChange = useCallback(async (strategy: string) => {
        setCurrentArrangementStrategy(strategy);

        if (!reactFlowInstance) {
            toast.error('Canvas não está pronto para arranjo');
            return;
        }

        if (nodes.length === 0) {
            toast.error('Nenhum nó para arranjar');
            return;
        }

        try {
            toast.info(`Aplicando layout ${strategy}...`);

            let positions;
            switch (strategy) {
                case 'hierarchical':
                    positions = await applyHierarchicalLayout();
                    break;
                case 'grid':
                    positions = await applyGridLayout();
                    break;
                case 'circular':
                    positions = await applyCircularLayout();
                    break;
                case 'force':
                    positions = await applyForceDirectedLayout();
                    break;
                case 'smart':
                    positions = await applySmartLayout();
                    break;
                default:
                    positions = await applyHierarchicalLayout();
            }

            // Apply the new positions to nodes
            setNodes(nodes => nodes.map(node => {
                const newPos = positions.find(p => p.id === node.id);
                if (newPos && !lockedNodes.has(node.id)) {
                    return {
                        ...node,
                        position: { x: newPos.x, y: newPos.y }
                    };
                }
                return node;
            }));

            // Fit view to show all nodes after arrangement
            setTimeout(() => {
                reactFlowInstance?.fitView({
                    padding: 0.1,
                    duration: 800,
                    minZoom: 0.1,
                    maxZoom: 1.5
                });
            }, 100);

            toast.success(`Layout ${strategy} aplicado com sucesso`);
        } catch (error) {
            console.error('Arrangement failed:', error);
            toast.error(`Falha ao aplicar layout ${strategy}`);
        }
    }, [reactFlowInstance, nodes, lockedNodes, setNodes, applyHierarchicalLayout, applyGridLayout, applyCircularLayout, applyForceDirectedLayout, applySmartLayout]);

    // Handle the Arrange button click
    const handleArrangement = useCallback(() => {
        // Use the current selected strategy
        handleArrangementStrategyChange(currentArrangementStrategy);
    }, [currentArrangementStrategy, handleArrangementStrategyChange]);





    const handlePreview = useCallback(() => {
        setIsArrangementPreviewActive(!isArrangementPreviewActive);
        toast.info(isArrangementPreviewActive ? 'Preview cancelled' : 'Preview mode activated');
    }, [isArrangementPreviewActive]);

    const handleUndo = useCallback(() => {
        if (arrangementHistoryIndex > 0) {
            const previousState = arrangementHistory[arrangementHistoryIndex - 1];

            // Restore previous positions
            setNodes(currentNodes => currentNodes.map(node => {
                const previousPos = previousState.positions.find((pos: any) => pos.id === node.id);
                if (previousPos) {
                    return {
                        ...node,
                        position: { x: previousPos.x, y: previousPos.y }
                    };
                }
                return node;
            }));

            setArrangementHistoryIndex(prev => prev - 1);
            toast.success('Arrangement undone');
        } else {
            toast.error('Nothing to undo');
        }
    }, [arrangementHistoryIndex, arrangementHistory, setNodes]);

    const handleRedo = useCallback(() => {
        if (arrangementHistoryIndex < arrangementHistory.length - 1) {
            const nextState = arrangementHistory[arrangementHistoryIndex + 1];

            // Restore next positions
            setNodes(currentNodes => currentNodes.map(node => {
                const nextPos = nextState.positions.find((pos: any) => pos.id === node.id);
                if (nextPos) {
                    return {
                        ...node,
                        position: { x: nextPos.x, y: nextPos.y }
                    };
                }
                return node;
            }));

            setArrangementHistoryIndex(prev => prev + 1);
            toast.success('Arrangement redone');
        } else {
            toast.error('Nothing to redo');
        }
    }, [arrangementHistoryIndex, arrangementHistory, setNodes]);

    // Node locking functionality - simplified
    const handleToggleNodeLock = useCallback((nodeIds: string[]) => {
        const newLockedNodes = new Set(lockedNodes);
        nodeIds.forEach(id => {
            if (newLockedNodes.has(id)) {
                newLockedNodes.delete(id);
            } else {
                newLockedNodes.add(id);
            }
        });
        setLockedNodes(newLockedNodes);
        toast.info(`${nodeIds.length} node(s) lock state toggled`);
    }, [lockedNodes]);

    const elk = useMemo(() => new ELK(), []);

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
                    />
                    <div className="flex flex-1">
                        <AppSidebar />
                        <SidebarInset>
                            <div className="w-full h-full relative" ref={reactFlowWrapper}>
                                <GroupCanvas
                                    nodes={nodes}
                                    groupStateManager={groupStateManager}
                                    selectedNodes={selectedNodes}
                                >
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
                                        />
                                        <Background gap={12} size={2} color="#aaa" />
                                        <Controls position="top-right" />
                                        <MiniMap />
                                        <DrawingCanvasOverlay />
                                    </ReactFlow>
                                </GroupCanvas>

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
            </div>
        </>
    )
}

export default App
