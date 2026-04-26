import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { IntroOverlay } from '../components/ui/IntroOverlay'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const [showOverlay, setShowOverlay] = useState(true)

  return (
    <>
      {showOverlay && (
        <IntroOverlay onDismiss={() => setShowOverlay(false)} />
      )}
      <div className="relative z-10 pointer-events-none">
        {/* Rest of home content if any */}
      </div>
    </>
  )
}
