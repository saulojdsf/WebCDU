import ReactFlow, { Background, ConnectionMode, Controls, MiniMap, useEdgesState, useNodesState, type Connection, addEdge, type Node } from 'reactflow'
import 'reactflow/dist/style.css'

import { Placeholder } from './components/nodes/PLACEHOLDER'
import DefaultEdge from './components/edges/DefaultEdge'
import { useCallback } from 'react'


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


const onConnect = useCallback((connection : Connection) => {
  return setEdges(edges => addEdge(connection, edges))
},[]);
const onDragOver = useCallback((event : React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
}, []);


  return (
    <>
<div className="h-screen flex flex-col">
    <SidebarProvider className="flex flex-col h-full">
        <SiteHeader/>
        <div className="flex flex-1">
            <AppSidebar/>
            <SidebarInset>
                <div className="w-full h-full">
                    <ReactFlow 
                        nodeTypes={NODE_TYPES} 
                        nodes={nodes} 
                        edgeTypes={EDGE_TYPES} 
                        edges={edges} 
                        connectionMode={ConnectionMode.Strict} 
                        onConnect={onConnect} 
                        onNodesChange={onNodesChange} 
                        onEdgesChange={onEdgesChange} 
                        onDragOver={onDragOver} 
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
