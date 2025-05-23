import { motion } from 'motion/react'

export function Header() {
  return (
    <motion.div className="text-center mb-8">
      <h1 className="text-4xl font-bold mb-2">Simulate Corrupted Elections</h1>
      <p className="text-xl text-gray-600 px-4">
        How efficiently can you detect the compromised votes?
      </p>
    </motion.div>
  )
}
