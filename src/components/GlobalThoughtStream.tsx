import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MessageSquare, Move, Activity, Cloud, Zap } from "lucide-react";

export default function GlobalThoughtStream() {
  const events = useQuery(api.functions.memory.getGlobalEvents, { limit: 20 });

  if (!events) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "movement": return <Move className="w-3 h-3 text-slate-400" />;
      case "conversation": return <MessageSquare className="w-3 h-3 text-blue-400" />;
      case "interaction": return <Activity className="w-3 h-3 text-green-400" />;
      case "weather_change": return <Cloud className="w-3 h-3 text-yellow-400" />;
      default: return <Zap className="w-3 h-3 text-purple-400" />;
    }
  };

  return (
    <div className="fixed right-4 top-20 bottom-24 w-64 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl flex flex-col overflow-hidden shadow-2xl">
      <div className="p-3 border-b border-slate-700/50 bg-slate-800/30">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-3 h-3" />
          Thought Stream
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
        {events.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 italic">
            Waiting for simulation events...
          </div>
        ) : (
          events.map((event) => (
            <div 
              key={event._id} 
              className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-300">
                  {event.agentName}
                </span>
                {getIcon(event.type)}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed break-words">
                {event.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
