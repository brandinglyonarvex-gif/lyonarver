import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { KindeAuthProvider } from "@/components/kinde-provider"

const _geistSans = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LyonArvex - Premium E-Commerce Store",
  description: "Shop the finest products with premium quality and exceptional service",
  keywords: "ecommerce, shopping, luxury, products",
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#000000",
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <html lang="en" suppressHydrationWarning>
        <body className="font-sans">
        <KindeAuthProvider>
          {children}
        </KindeAuthProvider>
        </body>
      </html>
  )
}
