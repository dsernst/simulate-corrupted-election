import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  description: 'How efficiently can you detect the compromised votes?',
  title: 'Simulate Corrupted Elections',
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
