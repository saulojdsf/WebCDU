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


import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { CommandMenu } from "@/components/command-menu"


import { ABS } from './components/nodes/ABS'
import { ACOS } from './components/nodes/ACOS'
import { ASIN } from './components/nodes/ASIN'
import { ATAN } from './components/nodes/ATAN'
import { ATAN2 } from './components/nodes/ATAN2'
import { COS } from './components/nodes/COS'
import { DEGREE } from './components/nodes/DEGREE'
import { DIVSAO } from './components/nodes/DIVSAO'
import { ENTRAD } from './components/nodes/ENTRAD'
import { EXP } from './components/nodes/EXP'
import { FRACAO } from './components/nodes/FRACAO'
import { GANHO } from './components/nodes/GANHO'
import { INVRS } from './components/nodes/INVRS'
import { LEDLAG } from './components/nodes/LEDLAG'
import { LOG } from './components/nodes/LOG'
import { LOG10 } from './components/nodes/LOG10'
import { MENOS } from './components/nodes/MENOS'
import { MULTPL } from './components/nodes/MULTPL'
import { OFFSET } from './components/nodes/OFFSET'
import { ORD1 } from './components/nodes/ORD1'
import { Placeholder } from './components/nodes/PLACEHOLDER'
import { PROINT } from './components/nodes/PROINT'
import { RADIAN } from './components/nodes/RADIAN'
import { ROUND } from './components/nodes/ROUND'
import { SIN } from './components/nodes/SIN'
import { SINAL } from './components/nodes/SINAL'
import { SOMA } from './components/nodes/SOMA'
import { SQRT } from './components/nodes/SQRT'
import { TRUNC } from './components/nodes/TRUNC'
import { TAN } from './components/nodes/TAN'
import { X2 } from './components/nodes/X2'
import { XK } from './components/nodes/XK'
import ELK from 'elkjs/lib/elk.bundled.js';


export const iframeHeight = "800px"

const NODE_TYPES = {
    abs: ABS,
    acos: ACOS,
    asin: ASIN,
    atan: ATAN,
    atan2: ATAN2,
    cos: COS,
    degree: DEGREE,
    divsao: DIVSAO,
    entrad: ENTRAD,
    exp: EXP,
    fracao: FRACAO,
    ganho: GANHO,
    invrs: INVRS,
    ledlag: LEDLAG,
    log: LOG,
    log10: LOG10,
    menos: MENOS,
    multpl: MULTPL,
    offset: OFFSET,
    ord1: ORD1,
    proint: PROINT,
    placeholder: Placeholder,
    radian: RADIAN,
    round: ROUND,
    sin: SIN,
    sinal: SINAL,
    soma: SOMA,
    sqrt: SQRT,
    tan: TAN,
    trunc: TRUNC,
    x2: X2,
    xk: XK,
}

const EDGE_TYPES = {
    default: DefaultEdge,
}


function padId(num: number) {
    return num.toString().padStart(4, '0');
}

function App() {
    const [commandOpen, setCommandOpen] = useState(false);
    const [commandMenuResetKey, setCommandMenuResetKey] = useState(0);
    const [showBlockNumbers, setShowBlockNumbers] = useState(true);
    const [showVariableNames, setShowVariableNames] = useState(true);

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
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

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

    const clearAll = useCallback(() => {
        setNodes([]);
        setEdges([]);
        nextNodeId.current = 1;
    }, [setNodes, setEdges]);

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
        const nodeType = typeKey in NODE_TYPES ? typeKey : 'placeholder';
        const newNode = {
            id,
            type: nodeType,
            position,
            data: { label: nodeData.label, id, Vout: `X${id}` },
        };
        setNodes(nds => nds.concat(newNode));
    }, [reactFlowInstance, setNodes, nodes]);

    // Handle selection
    const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: any[] }) => {
        setSelectedNodes(nodes.map(n => n.id));
        setSelectedEdges(edges.map(e => e.id));
    }, []);

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
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodes, selectedEdges, setNodes, setEdges]);

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
    }, [nodes, edges]);

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

// Create wrapper components that receive the update functions
const createNodeWrapper = (Component: any) => {
  return (props: any) => (
    <Component 
      {...props} 
      updateConnectedVins={updateConnectedVins}
      showBlockNumbers={showBlockNumbers}
      showVariableNames={showVariableNames}
    />
  );
};

// Create wrapped node types
const NODE_TYPES_WITH_CALLBACKS = useMemo(() => {
  const wrappedTypes: any = {};
  Object.keys(NODE_TYPES).forEach(key => {
    wrappedTypes[key] = createNodeWrapper(NODE_TYPES[key as keyof typeof NODE_TYPES]);
  });
  return wrappedTypes;
}, [updateConnectedVins, showBlockNumbers, showVariableNames]);

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

  const autoRearrangeNodes = useCallback(() => {
    if (!reactFlowInstance) return;
    
    // Get all nodes and edges
    const allNodes = nodes;
    const allEdges = edges;
    
    // Find nodes with no incoming edges (sources)
    const sourceNodes = allNodes.filter(node => 
      !allEdges.some(edge => edge.target === node.id)
    );
    
    // Find nodes with no outgoing edges (sinks)
    const sinkNodes = allNodes.filter(node => 
      !allEdges.some(edge => edge.source === node.id)
    );
    
    // Arrange nodes in layers from left to right
    const arrangedNodes = [...allNodes];
    const nodePositions = new Map();
    
    // Start with source nodes at x=0
    sourceNodes.forEach((node, index) => {
      nodePositions.set(node.id, { x: 0, y: index * 150 });
    });
    
    // Process remaining nodes based on their connections
    const processed = new Set(sourceNodes.map(n => n.id));
    let currentLayer = 1;
    
    while (processed.size < allNodes.length) {
      const currentLayerNodes = allNodes.filter(node => {
        if (processed.has(node.id)) return false;
        // Check if all incoming edges are from processed nodes
        const incomingEdges = allEdges.filter(edge => edge.target === node.id);
        return incomingEdges.every(edge => processed.has(edge.source));
      });
      
      if (currentLayerNodes.length === 0) {
        // If no nodes can be processed, put remaining nodes in the last layer
        const remainingNodes = allNodes.filter(node => !processed.has(node.id));
        remainingNodes.forEach((node, index) => {
          nodePositions.set(node.id, { x: currentLayer * 300, y: index * 150 });
        });
        break;
      }
      
      currentLayerNodes.forEach((node, index) => {
        nodePositions.set(node.id, { x: currentLayer * 300, y: index * 150 });
        processed.add(node.id);
      });
      
      currentLayer++;
    }
    
    // Update node positions
    setNodes(nodes => nodes.map(node => {
      const newPos = nodePositions.get(node.id);
      if (newPos) {
        return {
          ...node,
          position: reactFlowInstance.project({ x: newPos.x, y: newPos.y })
        };
      }
      return node;
    }));
  }, [nodes, edges, setNodes, reactFlowInstance]);

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
    }, [setNodes, setEdges]);

    const elk = useMemo(() => new ELK(), []);

    const onSugiyamaLayout = useCallback(async () => {
        if (!reactFlowInstance) return;
        const elkGraph = {
            id: 'root',
            layoutOptions: {
                'elk.algorithm': 'layered',
                'elk.spacing.nodeNode': '40',
                'elk.spacing.edgeNode': '60',
                'elk.spacing.edgeEdge': '40',
                'elk.layered.spacing.nodeNodeBetweenLayers': '60',
                'elk.layered.spacing.edgeNodeBetweenLayers': '100',
                'elk.layered.spacing.edgeEdgeBetweenLayers': '80',
                'elk.spacing.componentComponent': '60',
                'elk.contentAlignment': 'center',
            },
            children: nodes.map(node => ({
                id: node.id,
                width: 180,
                height: 60,
            })),
            edges: edges.map(edge => ({
                id: edge.id,
                sources: [edge.source],
                targets: [edge.target],
            })),
        };
        try {
            const layout = await elk.layout(elkGraph);
            setNodes(nodes => nodes.map(node => {
                const layoutNode = layout.children?.find((n: any) => n.id === node.id);
                if (layoutNode) {
                    const x = typeof layoutNode.x === 'number' ? layoutNode.x : 0;
                    const y = typeof layoutNode.y === 'number' ? layoutNode.y : 0;
                    return {
                        ...node,
                        position: reactFlowInstance.screenToFlowPosition({ x, y })
                    };
                }
                return node;
            }));
        } catch (e) {
            toast.error('Erro ao aplicar layout Sugiyama');
            console.error(e);
        }
    }, [nodes, edges, setNodes, reactFlowInstance, elk]);

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
          onAutoRearrange={autoRearrangeNodes}
        />
        <div className="flex flex-1">
            <AppSidebar/>
            <SidebarInset>
                <div className="w-full h-full" ref={reactFlowWrapper}>
                    <ReactFlow 
                        nodeTypes={NODE_TYPES_WITH_CALLBACKS} 
                        nodes={nodes} 
                        edgeTypes={EDGE_TYPES} 
                        edges={edges} 
                        connectionMode={ConnectionMode.Strict} 
                        onConnect={onConnect} 
                        onNodesChange={onNodesChange} 
                        onEdgesChange={onEdgesChange} 
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onInit={setReactFlowInstance}
                        onSelectionChange={onSelectionChange}
                        defaultEdgeOptions={{ type: 'default', }}
                    >
                        <Background gap={12} size={2} color="#aaa"/>
                        <Controls position="top-right"/>
                        <MiniMap/>
                    </ReactFlow>
                </div>
            </SidebarInset>
        </div>
    </SidebarProvider>
</div>
    </>
  )
}

export default App
