import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Suspense, lazy, useState, useEffect } from 'react'
import { ConvexProvider } from "convex/react"
import { convex } from "../lib/convex"
import Footer from '../components/Footer'
import Header from '../components/Header'

import appCss from '../styles.css?url'

// Lazy load GameCanvas - it will only load in the browser
const GameCanvas = lazy(() => import('../components/game/GameCanvas').then(m => ({ default: m.default })))

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient ? <>{children}</> : null
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Simulacra - Isometric World',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <ConvexProvider client={convex}>
          <div className="flex flex-col h-screen w-screen overflow-hidden">
            <Header />
            <main className="flex-1 w-full overflow-hidden">
              <ClientOnly>
                <Suspense fallback={
                  <div className="flex h-full w-full items-center justify-center bg-slate-900">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-slate-400">Loading game...</p>
                    </div>
                  </div>
                }>
                  <GameCanvas />
                </Suspense>
              </ClientOnly>
            </main>
            <Footer />
          </div>
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}