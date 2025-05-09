import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Simulate Corrupted Elections',
  description: 'How efficiently can you detect the compromised votes?',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
