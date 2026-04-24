import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sun, Cloud, CloudRain, Zap, Clock, Calendar } from "lucide-react";

export default function WorldHUD() {
  const worldState = useQuery(api.functions.world.getState);

  if (!worldState) return null;

  const weatherIcons: Record<string, React.ReactNode> = {
    sunny: <Sun className="w-4 h-4 text-yellow-400" />,
    cloudy: <Cloud className="w-4 h-4 text-slate-400" />,
    rainy: <CloudRain className="w-4 h-4 text-blue-400" />,
    stormy: <Zap className="w-4 h-4 text-purple-400" />,
  };

  const formatTime = (time: number) => {
    const hour = Math.floor(time);
    const minute = Math.floor((time % 1) * 60);
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700/50 backdrop-blur-md">
      <div className="flex items-center gap-2" title="Weather">
        {weatherIcons[worldState.weather] || <Sun className="w-4 h-4" />}
        <span className="text-xs font-medium text-slate-200 capitalize">
          {worldState.weather}
        </span>
      </div>
      
      <div className="w-px h-4 bg-slate-700" />
      
      <div className="flex items-center gap-2" title="Time of Day">
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-mono text-slate-200">
          {formatTime(worldState.timeOfDay)}
        </span>
      </div>
      
      <div className="w-px h-4 bg-slate-700" />
      
      <div className="flex items-center gap-2" title="Day Count">
        <Calendar className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-medium text-slate-200">
          Day {worldState.dayCount}
        </span>
      </div>
    </div>
  );
}
