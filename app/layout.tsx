import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Election Simulator',
  description: 'Simulate election scenarios',
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
