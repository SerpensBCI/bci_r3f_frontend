import { useCallback } from 'react'
import '@xyflow/react/dist/style.css'

import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge 
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

if (typeof document !== 'undefined') {
    const style = document.createElement('style')
    style.textContent = `
      .react-flow__controls { background: #2d3748 !important; }
      .react-flow__controls button { background: #4a5568 !important; }
      .react-flow__controls button:hover { background: #718096 !important; }
      .react-flow__controls button svg { stroke: #fff !important; }
    `
    document.head.appendChild(style)
}

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
]

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
]

export default function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  )
}
