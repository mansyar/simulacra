import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Zap, Package, Users, MessageSquare, Clock } from 'lucide-react'
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
  const relationships = useQuery(api.functions.relationships.getRelationships, { agentId: id as Id<'agents'> })
  const events = useQuery(api.functions.memory.getEvents, { agentId: id as Id<'agents'> })

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

  // Sort events newest first for the stream
  const sortedEvents = [...(events || [])].sort((a, b) => b._creationTime - a._creationTime)

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

          <div className="space-y-8 pb-8">
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

            {/* Current Activity */}
            <section className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-3 mb-2 text-slate-400">
                <Zap size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Current Goal</span>
              </div>
              <p className="text-sm text-white">
                {agent.currentGoal || 'Thinking...'}
              </p>
              <p className="text-xs text-slate-500 mt-2 italic capitalize">
                Status: {agent.currentAction}
              </p>
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

            {/* Inventory */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Inventory</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {agent.inventory.length > 0 ? (
                  agent.inventory.map((item, idx) => (
                    <div key={`${item}-${idx}`} className="px-3 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg text-xs text-slate-300 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-slate-500" />
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic col-span-2">Empty</p>
                )}
              </div>
            </section>

            {/* Relationships */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Relationships</h3>
              </div>
              <div className="space-y-2">
                {relationships && relationships.length > 0 ? (
                  relationships.map((rel) => {
                    const affinityColor = rel.affinity > 20 ? 'text-emerald-400' : rel.affinity < -20 ? 'text-rose-400' : 'text-slate-400';
                    const otherId = rel.agentAId === id ? rel.agentBId : rel.agentAId;
                    
                    return (
                      <Link 
                        key={rel._id}
                        to="/agent/$id"
                        params={{ id: otherId }}
                        className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/50 rounded-xl hover:bg-slate-800/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                            {rel.otherAgentName.substring(0, 1)}
                          </div>
                          <span className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">{rel.otherAgentName}</span>
                        </div>
                        <div className={`text-xs font-bold ${affinityColor}`}>
                          {rel.affinity > 0 ? '+' : ''}{rel.affinity}
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 italic">No social ties yet.</p>
                )}
                {relationships === undefined && (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-10 bg-slate-800/50 rounded-xl" />
                    <div className="h-10 bg-slate-800/50 rounded-xl" />
                  </div>
                )}
              </div>
            </section>

            {/* Recent Events */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                {sortedEvents.length > 0 ? (
                  sortedEvents.map((event) => (
                    <div key={event._id} className="relative pl-4 border-l border-slate-700 py-1">
                      <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-slate-600" />
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-bold mb-1">
                        <Clock size={10} />
                        {new Date(event._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400">{event.type}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No recent memories.</p>
                )}
                {events === undefined && (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-12 bg-slate-800/50 rounded-lg" />
                    <div className="h-12 bg-slate-800/50 rounded-lg" />
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
