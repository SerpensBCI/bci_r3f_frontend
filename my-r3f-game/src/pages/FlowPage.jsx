import { Link } from 'react-router-dom'
import FlowCanvas from '../components/FlowCanvas'

export default function FlowPage() {
  return (
    <div>
      <div style={{ padding: '10px', position: 'absolute', zIndex: 1000 }}>
        <Link to="/">← Back</Link>
      </div>
      <FlowCanvas />
    </div>
  )
}
