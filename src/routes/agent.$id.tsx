import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export const Route = createFileRoute('/agent/$id')({
  component: AgentDetail,
})

function AgentDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()

  const handleClose = () => {
    navigate({ to: '/' })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-0 left-0 h-full w-80 bg-slate-900/90 backdrop-blur-md border-r border-slate-700 z-50 overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Agent Detail</h2>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 text-slate-300">
            <p>ID: {id}</p>
            {/* Detailed content will be implemented in subsequent tasks */}
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-800 rounded"></div>
              <div className="h-4 bg-slate-800 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
