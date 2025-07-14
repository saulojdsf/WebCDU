import ReactFlow, { Background, ConnectionMode, Controls, MiniMap, useEdgesState, useNodesState, type Connection, addEdge } from 'reactflow'
import 'reactflow/dist/style.css'

import { Placeholder } from './components/nodes/PLACEHOLDER'
import DefaultEdge from './components/edges/DefaultEdge'
import { useCallback } from 'react'

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
const [nodes, setNodes, onNodesChange] = useNodesState([]);

const onConnect = useCallback((connection : Connection) => {
  return setEdges(edges => addEdge(connection, edges))
},[]);

  return (
    <div className="w-screen h-screen">
      <ReactFlow 
      nodeTypes={NODE_TYPES} 
      nodes={INITIAL_NODES} 
      edgeTypes={EDGE_TYPES} 
      edges={edges} 
      connectionMode={ConnectionMode.Strict}
      onConnect={onConnect}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      >
        <Background gap={12} size={2} color="#aaa"/>
        <Controls position="top-right"/>
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

export default App
