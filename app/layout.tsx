import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '实时汇率转换器',
  description: '支持人民币、港币、美元实时汇率转换',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
