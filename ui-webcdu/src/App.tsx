import ReactFlow, { Background, ConnectionMode, Controls, MiniMap, useEdgesState, useNodesState, type Connection, addEdge, type Node, useReactFlow } from 'reactflow'
import type { ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css'

import { Placeholder } from './components/nodes/PLACEHOLDER'
import DefaultEdge from './components/edges/DefaultEdge'
import { useCallback, useRef, useState, useEffect } from 'react'
import { Toaster } from './components/ui/sonner';


import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { SOMA } from './components/nodes/SOMA'
import { MULTPL } from './components/nodes/MULTPL'
import { GANHO } from './components/nodes/GANHO'

export const iframeHeight = "800px"



const NODE_TYPES = {
  placeholder: Placeholder,
  soma: SOMA,
  multpl: MULTPL,
  ganho: GANHO,
}

const EDGE_TYPES = {
  default: DefaultEdge,
}


function padId(num: number) {
  return num.toString().padStart(4, '0');
}

function App() {
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
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
const onDragOver = useCallback((event : React.DragEvent) => {
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
  const bounds = reactFlowWrapper.current?.getBoundingClientRect();
  const position = reactFlowInstance.project({
    x: event.clientX - (bounds?.left ?? 0),
    y: event.clientY - (bounds?.top ?? 0),
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
  const exportData = nodes.map(n => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  }));
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nodes.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}, [nodes]);

  return (
    <>
      <Toaster position="top-center" />
<div className="h-screen flex flex-col">
    <SidebarProvider className="flex flex-col h-full">
        <SiteHeader onNew={clearAll} onExport={exportNodes}/>
        <div className="flex flex-1">
            <AppSidebar/>
            <SidebarInset>
                <div className="w-full h-full" ref={reactFlowWrapper}>
                    <ReactFlow 
                        nodeTypes={NODE_TYPES} 
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
