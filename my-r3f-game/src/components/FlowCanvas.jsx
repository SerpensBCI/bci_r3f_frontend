import { useCallback, useMemo, useState, useEffect } from 'react'
import '@xyflow/react/dist/style.css'

import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Handle,
  Position
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { GAME_CONFIG } from '../gameConfig'

if (typeof document !== 'undefined') {
    const style = document.createElement('style')
    style.textContent = `
      .react-flow__controls { background: #2d3748 !important; }
      .react-flow__controls button { background: #4a5568 !important; }
      .react-flow__controls button:hover { background: #718096 !important; }
      .react-flow__controls button svg { stroke: #fff !important; }
      .config-node { 
        padding: 12px; 
        border-radius: 8px; 
        font-size: 12px;
        min-width: 280px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
        position: relative;
      }
      .config-node:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      .config-node.physics { 
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
        color: white; 
      }
      .config-node.rendering { 
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
        color: white; 
      }
      .config-node-title { 
        font-weight: bold; 
        font-size: 14px; 
        margin-bottom: 10px; 
        border-bottom: 1px solid rgba(255,255,255,0.3); 
        padding-bottom: 6px;
      }
      .config-node-field {
        margin: 8px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .config-node-field label {
        font-size: 11px;
        opacity: 0.9;
        flex: 1;
        min-width: 0;
      }
      .config-node-field input[type="number"] {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        padding: 4px 8px;
        color: white;
        font-size: 11px;
        width: 80px;
        text-align: right;
      }
      .config-node-field input[type="number"]:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
      }
      .config-node-field input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      .config-node-field select {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        padding: 4px 8px;
        color: white;
        font-size: 11px;
        cursor: pointer;
      }
      .config-node-field select:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.3);
      }
      .config-node-field select option {
        background: #f5576c;
        color: white;
      }
      .array-input-group {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      .array-input-group input {
        width: 60px;
      }
      .edit-hint {
        font-size: 9px;
        opacity: 0.7;
        font-style: italic;
        margin-top: 6px;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `
    document.head.appendChild(style)
}

// Custom physics node component with editable fields
const PhysicsNode = ({ data, selected }) => {
  const { label, fields, onFieldChange } = data

  const handleChange = (fieldKey, value) => {
    if (onFieldChange) {
      onFieldChange(fieldKey, value)
    }
  }

  const renderField = (field) => {
    const { key, label: fieldLabel, type, value, min, max, step, options } = field

    switch (type) {
      case 'number':
        return (
          <div key={key} className="config-node-field">
            <label>{fieldLabel}:</label>
            <input
              type="number"
              value={value}
              min={min}
              max={max}
              step={step || 0.1}
              onChange={(e) => handleChange(key, parseFloat(e.target.value) || 0)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )
      
      case 'array':
        return (
          <div key={key} className="config-node-field">
            <label>{fieldLabel}:</label>
            <div className="array-input-group">
              {value.map((val, idx) => (
                <input
                  key={idx}
                  type="number"
                  value={val}
                  step={step || 1}
                  onChange={(e) => {
                    const newArray = [...value]
                    newArray[idx] = parseFloat(e.target.value) || 0
                    handleChange(key, newArray)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={`[${idx}]`}
                />
              ))}
            </div>
          </div>
        )
      
      case 'boolean':
        return (
          <div key={key} className="config-node-field">
            <label>{fieldLabel}:</label>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleChange(key, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )
      
      case 'select':
        return (
          <div key={key} className="config-node-field">
            <label>{fieldLabel}:</label>
            <select
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              {options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )
      
      default:
        return (
          <div key={key} className="config-node-field">
            <label>{fieldLabel}:</label>
            <span>{String(value)}</span>
          </div>
        )
    }
  }

  return (
    <div className={`config-node physics`}>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <div className="config-node-title">{label}</div>
      {fields?.map(renderField)}
      <div className="edit-hint">Click fields to edit values</div>
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  )
}

// Rendering node component (display only)
const RenderingNode = ({ data }) => {
  const { label, details } = data

  return (
    <div className={`config-node rendering`}>
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      <div className="config-node-title">{label}</div>
      {details && Object.entries(details).map(([key, value]) => (
        <div key={key} className="config-node-field">
          <label>{key}:</label>
          <span>{typeof value === 'object' ? JSON.stringify(value).slice(0, 30) + '...' : String(value)}</span>
        </div>
      ))}
    </div>
  )
}

const nodeTypes = {
  physicsNode: PhysicsNode,
  renderingNode: RenderingNode,
}

export default function FlowCanvas({ onPhysicsChange = null }) {
  // Initialize physics state from GAME_CONFIG
  const [physicsState, setPhysicsState] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('physicsSettings')
      if (saved) {
        try {
          return { ...JSON.parse(saved) }
        } catch (e) {
          console.warn('Failed to parse saved physics settings', e)
        }
      }
    }
    return {
      ballRadius: GAME_CONFIG.PHYSICS.BALL.RADIUS,
      ballRestitution: GAME_CONFIG.PHYSICS.BALL.RESTITUTION,
      ballAngularDamping: GAME_CONFIG.PHYSICS.BALL.ANGULAR_DAMPING,
      ballCCD: GAME_CONFIG.PHYSICS.BALL.CCD,
      ballCanSleep: GAME_CONFIG.PHYSICS.BALL.CAN_SLEEP,
      paddleCollider: [...GAME_CONFIG.PHYSICS.PADDLE.CYLINDER_COLLIDER],
      paddleCCD: GAME_CONFIG.PHYSICS.PADDLE.CCD,
      paddleCanSleep: GAME_CONFIG.PHYSICS.PADDLE.CAN_SLEEP,
      boundariesSize: GAME_CONFIG.PHYSICS.BOUNDARIES.SIZE,
      boundariesThickness: GAME_CONFIG.PHYSICS.BOUNDARIES.THICKNESS,
      boundariesRestitution: GAME_CONFIG.PHYSICS.BOUNDARIES.RESTITUTION,
      gravityEasy: [...GAME_CONFIG.PHYSICS.GRAVITY.EASY],
      gravityMedium: [...GAME_CONFIG.PHYSICS.GRAVITY.MEDIUM],
      gravityHard: [...GAME_CONFIG.PHYSICS.GRAVITY.HARD],
    }
  })

  // Save to localStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('physicsSettings', JSON.stringify(physicsState))
      // Dispatch custom event so same-tab listeners can update
      window.dispatchEvent(new Event('physicsSettingsUpdated'))
    }
    if (onPhysicsChange) {
      onPhysicsChange(physicsState)
    }
  }, [physicsState, onPhysicsChange])

  // Handle field changes
  const handleFieldChange = useCallback((nodeId, fieldKey, value) => {
    setPhysicsState(prev => ({
      ...prev,
      [fieldKey]: value
    }))
  }, [])

  // Physics nodes with editable fields
  const physicsNodes = useMemo(() => [
    {
      id: 'physics-ball',
      type: 'physicsNode',
      position: { x: 50, y: 50 },
      data: {
        label: 'Ball Physics',
        onFieldChange: (key, value) => handleFieldChange('physics-ball', key, value),
        fields: [
          {
            key: 'ballRadius',
            label: 'Radius',
            type: 'number',
            value: physicsState.ballRadius,
            min: 0.1,
            max: 2,
            step: 0.01
          },
          {
            key: 'ballRestitution',
            label: 'Restitution',
            type: 'number',
            value: physicsState.ballRestitution,
            min: 0,
            max: 2,
            step: 0.1
          },
          {
            key: 'ballAngularDamping',
            label: 'Angular Damping',
            type: 'number',
            value: physicsState.ballAngularDamping,
            min: 0,
            max: 1,
            step: 0.1
          },
          {
            key: 'ballCCD',
            label: 'CCD Enabled',
            type: 'boolean',
            value: physicsState.ballCCD
          },
          {
            key: 'ballCanSleep',
            label: 'Can Sleep',
            type: 'boolean',
            value: physicsState.ballCanSleep
          }
        ]
      }
    },
    {
      id: 'physics-paddle',
      type: 'physicsNode',
      position: { x: 50, y: 280 },
      data: {
        label: 'Paddle Physics',
        onFieldChange: (key, value) => handleFieldChange('physics-paddle', key, value),
        fields: [
          {
            key: 'paddleCollider',
            label: 'Collider [height, radius]',
            type: 'array',
            value: physicsState.paddleCollider,
            step: 0.01
          },
          {
            key: 'paddleCCD',
            label: 'CCD Enabled',
            type: 'boolean',
            value: physicsState.paddleCCD
          },
          {
            key: 'paddleCanSleep',
            label: 'Can Sleep',
            type: 'boolean',
            value: physicsState.paddleCanSleep
          }
        ]
      }
    },
    {
      id: 'physics-boundaries',
      type: 'physicsNode',
      position: { x: 50, y: 510 },
      data: {
        label: 'Boundaries',
        onFieldChange: (key, value) => handleFieldChange('physics-boundaries', key, value),
        fields: [
          {
            key: 'boundariesSize',
            label: 'Size',
            type: 'number',
            value: physicsState.boundariesSize,
            min: 100,
            max: 5000,
            step: 100
          },
          {
            key: 'boundariesThickness',
            label: 'Thickness',
            type: 'number',
            value: physicsState.boundariesThickness,
            min: 0.5,
            max: 10,
            step: 0.5
          },
          {
            key: 'boundariesRestitution',
            label: 'Restitution',
            type: 'number',
            value: physicsState.boundariesRestitution,
            min: 0,
            max: 5,
            step: 0.1
          }
        ]
      }
    },
    {
      id: 'physics-gravity',
      type: 'physicsNode',
      position: { x: 50, y: 740 },
      data: {
        label: 'Gravity',
        onFieldChange: (key, value) => handleFieldChange('physics-gravity', key, value),
        fields: [
          {
            key: 'gravityEasy',
            label: 'Easy [x, y, z]',
            type: 'array',
            value: physicsState.gravityEasy,
            step: 1
          },
          {
            key: 'gravityMedium',
            label: 'Medium [x, y, z]',
            type: 'array',
            value: physicsState.gravityMedium,
            step: 1
          },
          {
            key: 'gravityHard',
            label: 'Hard [x, y, z]',
            type: 'array',
            value: physicsState.gravityHard,
            step: 1
          }
        ]
      }
    }
  ], [physicsState, handleFieldChange])

  // Rendering nodes (display only)
  const renderingNodes = useMemo(() => [
    {
      id: 'rendering-camera',
      type: 'renderingNode',
      position: { x: 400, y: 50 },
      data: {
        label: 'Camera',
        details: {
          'Position': `[${GAME_CONFIG.RENDERING.CAMERA.POSITION.join(', ')}]`,
          'FOV': GAME_CONFIG.RENDERING.CAMERA.FOV,
        }
      },
    },
    {
      id: 'rendering-lighting',
      type: 'renderingNode',
      position: { x: 400, y: 200 },
      data: {
        label: 'Lighting',
        details: {
          'Ambient Intensity': (GAME_CONFIG.RENDERING.LIGHTING.AMBIENT_INTENSITY / Math.PI).toFixed(2),
          'Spotlight Intensity': GAME_CONFIG.RENDERING.LIGHTING.SPOTLIGHT.INTENSITY,
          'Shadow Map Size': GAME_CONFIG.RENDERING.LIGHTING.SPOTLIGHT.SHADOW_MAP_SIZE,
        }
      },
    },
    {
      id: 'rendering-postprocessing',
      type: 'renderingNode',
      position: { x: 400, y: 350 },
      data: {
        label: 'Post-Processing',
        details: {
          'AO Radius': GAME_CONFIG.RENDERING.POSTPROCESSING.N8AO.AO_RADIUS,
          'AO Intensity': GAME_CONFIG.RENDERING.POSTPROCESSING.N8AO.INTENSITY,
          'Tilt Shift Blur': GAME_CONFIG.RENDERING.POSTPROCESSING.TILT_SHIFT.BLUR,
        }
      },
    },
    {
      id: 'rendering-background',
      type: 'renderingNode',
      position: { x: 400, y: 500 },
      data: {
        label: 'Background',
        details: {
          'Color': GAME_CONFIG.RENDERING.BACKGROUND.COLOR,
          'Scale': GAME_CONFIG.RENDERING.BACKGROUND.SCALE,
        }
      },
    },
  ], [])

  // Combine all nodes
  const initialNodes = useMemo(() => [
    ...physicsNodes,
    ...renderingNodes,
  ], [physicsNodes, renderingNodes])

  // Create edges: Physics → Rendering
  const initialEdges = useMemo(() => [
    { id: 'e-physics-ball-camera', source: 'physics-ball', target: 'rendering-camera' },
    { id: 'e-physics-paddle-lighting', source: 'physics-paddle', target: 'rendering-lighting' },
    { id: 'e-physics-boundaries-postprocessing', source: 'physics-boundaries', target: 'rendering-postprocessing' },
    { id: 'e-physics-gravity-background', source: 'physics-gravity', target: 'rendering-background' },
  ], [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when physics state changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'physicsNode' && node.data.fields) {
          return {
            ...node,
            data: {
              ...node.data,
              fields: node.data.fields.map(field => ({
                ...field,
                value: physicsState[field.key]
              }))
            }
          }
        }
        return node
      })
    )
  }, [physicsState, setNodes])

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
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  )
}
