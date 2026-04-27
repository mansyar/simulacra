import { motion } from 'framer-motion'

interface NeedsBarProps {
  label: string
  value: number // 0 to 100
  color: string
}

export function NeedsBar({ label, value, color }: NeedsBarProps) {
  const percentage = Math.max(0, Math.min(100, value))
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-white">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  )
}
