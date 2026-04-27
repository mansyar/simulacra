import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Zap } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { NeedsBar } from '../components/ui/NeedsBar'

export const Route = createFileRoute('/agent/$id')({
  component: AgentDetail,
})

function AgentDetail() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const agent = useQuery(api.functions.agents.getById, { agentId: id as Id<'agents'> })

  const handleClose = () => {
    navigate({ to: '/' })
  }

  if (agent === undefined) {
    return (
      <div className="absolute top-0 left-0 h-full w-80 bg-slate-900/90 backdrop-blur-md border-r border-slate-700 z-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (agent === null) {
    return (
      <div className="absolute top-0 left-0 h-full w-80 bg-slate-900/90 backdrop-blur-md border-r border-slate-700 z-50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Not Found</h2>
          <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X size={20} /></button>
        </div>
        <p className="text-slate-400">Agent not found or inactive.</p>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={agent._id}
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute top-0 left-0 h-full w-80 bg-slate-900/90 backdrop-blur-md border-r border-slate-700 z-50 overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
                <User size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-tight">{agent.name}</h2>
                <span className="text-xs text-slate-400 uppercase tracking-widest">{agent.archetype}</span>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-8">
            {/* Bio & Traits */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Identity</h3>
              <p className="text-sm text-slate-300 leading-relaxed italic">
                "{agent.bio || 'A mysterious inhabitant of the simulacrum.'}"
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {agent.coreTraits.map(trait => (
                  <span key={trait} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-md text-[10px] text-slate-400 uppercase">
                    {trait}
                  </span>
                ))}
              </div>
            </section>

            {/* Needs */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Status</h3>
              <div className="space-y-4">
                <NeedsBar 
                  label="Energy" 
                  value={agent.energy} 
                  color="bg-amber-400" 
                />
                <NeedsBar 
                  label="Hunger" 
                  value={agent.hunger} 
                  color="bg-emerald-400" 
                />
                <NeedsBar 
                  label="Social" 
                  value={agent.social} 
                  color="bg-pink-400" 
                />
              </div>
            </section>

            {/* Current Activity Placeholder */}
            <section className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-3 mb-2 text-slate-400">
                <Zap size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Current Goal</span>
              </div>
              <p className="text-sm text-white">
                {agent.currentGoal || 'Thinking...'}
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
