import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'


function App() {
  return (
    <div className="w-screen h-screen">
      <ReactFlow>
        <Background gap={12} size={2} color="#aaa"/>
        <Controls position="bottom-right"/>
      </ReactFlow>
    </div>
  )
}

export default App
