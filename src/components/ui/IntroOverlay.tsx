import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface IntroOverlayProps {
  onDismiss: () => void
}

export function IntroOverlay({ onDismiss }: IntroOverlayProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleDismiss = () => {
    setIsVisible(false)
  }

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--sea-ink)]/90 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ 
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.2 
            }}
            className="island-shell max-w-lg w-full rounded-[2rem] p-8 sm:p-12 text-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="island-kicker mb-4"
            >
              Simulacra v0.1.0
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="display-title text-4xl sm:text-5xl font-bold mb-6 text-[var(--sea-ink)] leading-tight"
            >
              Welcome to <span className="text-[var(--lagoon-deep)]">Simulacra</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-[var(--sea-ink-soft)] text-lg mb-10 leading-relaxed"
            >
              A living, breathing isometric world powered by autonomous AI agents. 
              Observe their thoughts, witness their interactions, and explore their evolving society.
            </motion.p>
            
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDismiss}
              className="rounded-full bg-[var(--lagoon-deep)] text-white px-8 py-4 text-lg font-bold shadow-lg shadow-[var(--lagoon-deep)]/20 hover:bg-[var(--lagoon-deep)]/90 transition-colors"
            >
              Enter World
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
