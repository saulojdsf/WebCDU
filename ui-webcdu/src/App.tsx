import ReactFlow, { Background, ConnectionMode, Controls, MiniMap, useEdgesState, useNodesState, type Connection, addEdge, type Node, useReactFlow } from 'reactflow'
import type { ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css'

import { Placeholder } from './components/nodes/PLACEHOLDER'
import DefaultEdge from './components/edges/DefaultEdge'
import { useCallback, useRef, useState, useEffect } from 'react'


import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export const iframeHeight = "800px"



const NODE_TYPES = {
  placeholder: Placeholder,
}

const EDGE_TYPES = {
  default: DefaultEdge,
}

const INITIAL_NODES = [
  {
    id: crypto.randomUUID(),
    type: 'placeholder',
    position: { x: 500, y: 500 },
    data: {} ,
  },
{
    id: crypto.randomUUID(),
    type: 'placeholder',
    position: { x: 1000, y: 750},
    data: {}
},
] satisfies Node[]


function App() {
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
const reactFlowWrapper = useRef<HTMLDivElement>(null);
const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
const [selectedEdges, setSelectedEdges] = useState<string[]>([]);

const onConnect = useCallback((connection : Connection) => {
  return setEdges(edges => addEdge(connection, edges))
},[]);
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
  const newNode = {
    id: crypto.randomUUID(),
    type: 'placeholder', // For now, always use placeholder type
    position,
    data: { label: nodeData.label },
  };
  setNodes(nds => nds.concat(newNode));
}, [reactFlowInstance, setNodes]);

// Handle selection
const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: any[] }) => {
  setSelectedNodes(nodes.map(n => n.id));
  setSelectedEdges(edges.map(e => e.id));
}, []);

// Handle delete key
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
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

  return (
    <>
<div className="h-screen flex flex-col">
    <SidebarProvider className="flex flex-col h-full">
        <SiteHeader/>
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
