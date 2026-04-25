import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { triggerManualTick, resetAgentBrain } from "../lib/server-functions";
import { Play, RotateCcw, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function AdminPanel() {
  const agents = useQuery(api.functions.agents.getAll);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleTick = async () => {
    setLoading(true);
    setStatus("Triggering tick...");
    try {
      await triggerManualTick();
      setStatus("Tick successful!");
    } catch (e) {
      setStatus("Tick failed.");
      console.error(e);
    }
    setLoading(false);
  };

  const handleReset = async (agentId: string) => {
    if (!confirm("Are you sure you want to reset this agent's brain?")) return;
    
    setLoading(true);
    setStatus("Resetting brain...");
    try {
      await resetAgentBrain({ data: agentId });
      setStatus("Reset successful!");
    } catch (e) {
      setStatus("Reset failed.");
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="fixed left-4 bottom-24 w-64 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl flex flex-col overflow-hidden shadow-2xl z-50">
      <div className="p-3 border-b border-slate-700/50 bg-slate-800/30 flex justify-between items-center">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          God Mode
        </h2>
        {status && <span className="text-[10px] text-blue-400 font-medium">{status}</span>}
      </div>
      
      <div className="p-3 space-y-4">
        <button
          onClick={handleTick}
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Play className="w-3 h-3" />
          Trigger World Tick
        </button>

        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase">Agent Resets</h3>
          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {agents?.map((agent) => (
              <div key={agent._id} className="flex items-center justify-between p-2 rounded bg-slate-800/40 border border-slate-700/30">
                <span className="text-[11px] text-slate-300 truncate max-w-[100px]">{agent.name}</span>
                <button
                  onClick={() => handleReset(agent._id)}
                  disabled={loading}
                  className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                  title="Reset Brain"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
