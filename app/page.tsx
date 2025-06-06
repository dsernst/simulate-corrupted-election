'use client'

import { LayoutGroup, motion } from 'motion/react'

import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { SimulatedContent } from './components/SimulatedContent'
import { SimulatorContextProvider } from './useSimulator'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center md:!p-10 p-2 py-10 gap-8">
      <LayoutGroup>
        <motion.div layout>
          <Header />
        </motion.div>

        <SimulatorContextProvider>
          <SimulatedContent />
        </SimulatorContextProvider>
      </LayoutGroup>

      <Footer />
    </main>
  )
}
