import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouterState } from "@tanstack/react-router";
import { MessageSquare, Move, Activity, Cloud, Zap } from "lucide-react";
import { useRef, useEffect, useMemo, useState } from "react";
import { useDrawer } from "../lib/drawer-context";
import type { Id } from "../../convex/_generated/dataModel";

export default function GlobalThoughtStream() {
  const events = useQuery(api.functions.memory.getGlobalEvents, { limit: 20 });
  const agents = useQuery(api.functions.agents.getAll);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isExpanded, toggle: toggleExpanded } = useDrawer();
  const [filterAgent, setFilterAgent] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Derive selected agent ID from the current route
  const routerState = useRouterState();
  const selectedAgentId = routerState.location.pathname.match(/\/agent\/(.+)/)?.[1] ?? null;

  // Build a map of agent ID -> agent name for resolving the selected agent
  const agentNameById = useMemo(() => {
    if (!agents) return new Map<string, string>();
    return new Map(agents.map((a) => [a._id, a.name]));
  }, [agents]);

  // Derive selected agent name from the route ID and agents map
  const selectedAgentName = useMemo(() => {
    if (!selectedAgentId || !agentNameById.size) return null;
    return agentNameById.get(selectedAgentId as Id<"agents">) ?? null;
  }, [selectedAgentId, agentNameById]);

  // Get unique agent names for filter tags
  const agentNames = useMemo(() => {
    if (!events) return [];
    return [...new Set(events.map((e) => e.agentName).filter(Boolean))].sort();
  }, [events]);

  // Get unique event types for filter tags
  const eventTypes = useMemo(() => {
    if (!events) return [];
    return [...new Set(events.map((e) => e.type))].sort();
  }, [events]);

  // Filter events by agent name and type
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => {
      if (filterAgent && e.agentName !== filterAgent) return false;
      if (filterType && e.type !== filterType) return false;
      return true;
    });
  }, [events, filterAgent, filterType]);

  // Auto-scroll to bottom when filtered events list changes (new events arrive)
  useEffect(() => {
    if (scrollRef.current && filteredEvents.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredEvents.length]);

  // Reset filters when events data changes (e.g., disconnected)
  useEffect(() => {
    if (!events) {
      setFilterAgent(null);
      setFilterType(null);
    }
  }, [events]);

  if (!events) return null;

  const lastEvent = events[events.length - 1] ?? null;

  const getIcon = (type: string) => {
    switch (type) {
      case "movement":
        return <Move className="w-3 h-3 text-slate-400" />;
      case "conversation":
        return <MessageSquare className="w-3 h-3 text-blue-400" />;
      case "interaction":
        return <Activity className="w-3 h-3 text-green-400" />;
      case "weather_change":
        return <Cloud className="w-3 h-3 text-yellow-400" />;
      default:
        return <Zap className="w-3 h-3 text-purple-400" />;
    }
  };

  return (
    <div
      data-testid="thoughtstream-drawer"
      className={`fixed left-0 right-0 bottom-8 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 shadow-2xl transition-all duration-300 ease-in-out ${
        isExpanded ? "h-[200px]" : "h-8"
      }`}
    >
      {/* Collapsed state: thin bar showing last event */}
      {!isExpanded && (
        <div
          className="h-full flex items-center px-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
          onClick={toggleExpanded}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Thought Stream
            </span>
            {lastEvent && (
              <>
                <span className="text-[10px] text-slate-600">|</span>
                {getIcon(lastEvent.type)}
                <span className="text-[11px] text-slate-400 truncate">
                  <span className="font-medium text-slate-300">{lastEvent.agentName}</span>
                  : {lastEvent.description}
                </span>
              </>
            )}
            {!lastEvent && events.length === 0 && (
              <span className="text-[11px] text-slate-500 italic">Waiting for simulation events...</span>
            )}
          </div>
          <span
            data-testid="expand-handle"
            className="ml-2 text-xs text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            ▲
          </span>
        </div>
      )}

      {/* Expanded state: full drawer */}
      {isExpanded && (
        <div className="h-full flex flex-col">
          {/* Header bar with title and collapse handle */}
          <div
            className="flex items-center justify-between px-4 py-1.5 border-b border-slate-700/50 bg-slate-800/30 cursor-pointer flex-shrink-0"
            onClick={toggleExpanded}
          >
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Thought Stream
            </h2>
            <span
              data-testid="collapse-handle"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ▼
            </span>
          </div>

          {/* Filter tags */}
          <div className="px-3 py-1.5 border-b border-slate-700/50 bg-slate-800/20 flex-shrink-0">
            {agentNames.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setFilterAgent(null); }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors ${
                    filterAgent === null
                      ? "bg-blue-500/30 text-blue-300 border border-blue-500/40"
                      : "bg-slate-800/60 text-slate-500 border border-slate-700/50 hover:text-slate-300"
                  }`}
                >
                  All Agents
                </button>
                {agentNames.map((name) => (
                  <button
                    key={name}
                    onClick={(e) => { e.stopPropagation(); setFilterAgent(filterAgent === name ? null : name); }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors ${
                      filterAgent === name
                        ? "bg-blue-500/30 text-blue-300 border border-blue-500/40"
                        : "bg-slate-800/60 text-slate-500 border border-slate-700/50 hover:text-slate-300"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            {eventTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setFilterType(null); }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors ${
                    filterType === null
                      ? "bg-purple-500/30 text-purple-300 border border-purple-500/40"
                      : "bg-slate-800/60 text-slate-500 border border-slate-700/50 hover:text-slate-300"
                  }`}
                >
                  All Types
                </button>
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    onClick={(e) => { e.stopPropagation(); setFilterType(filterType === type ? null : type); }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider transition-colors ${
                      filterType === type
                        ? "bg-purple-500/30 text-purple-300 border border-purple-500/40"
                        : "bg-slate-800/60 text-slate-500 border border-slate-700/50 hover:text-slate-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Event feed */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700"
          >
            {filteredEvents.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 italic">
                {events.length === 0
                  ? "Waiting for simulation events..."
                  : "No events match the selected filters."}
              </div>
            ) : (
              filteredEvents.map((event) => {
                const isHighlighted =
                  selectedAgentName !== null && event.agentName === selectedAgentName;
                return (
                  <div
                    key={event._id}
                    className={`p-2 rounded-lg border transition-colors ${
                      isHighlighted
                        ? "bg-blue-800/30 border-blue-500/30"
                        : "bg-slate-800/40 border-slate-700/30 hover:bg-slate-800/60"
                    }`}
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
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
