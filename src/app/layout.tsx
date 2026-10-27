import type { Metadata } from 'next'
import './globals.css'
import { Shell } from '@/components/layout/Shell'
export const metadata: Metadata = {
  title: 'CertAlign — Place names on certificates',
  description: 'Add names to digital or printed certificates with accurate positioning and print-ready PDFs. Your files stay on your device.',
}
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><Shell>{children}</Shell></body></html> }
