import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Geist_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import QueryProvider from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ServiceWorkerProvider } from "@/components/providers/service-worker-provider"
import { cn } from "@/lib/utils"
import "./globals.css"

const openRunde = localFont({
  src: [
    { path: "../fonts/OpenRunde-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/OpenRunde-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/OpenRunde-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/OpenRunde-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export const metadata: Metadata = {
  title: "Forge",
  description: "A full-stack monorepo template",
  manifest: "/manifest.json",
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Forge",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", openRunde.variable)}
    >
      <body className={openRunde.className}>
        <NuqsAdapter>
          <QueryProvider>
            <ThemeProvider>
              <TooltipProvider>
                {children}
                <Toaster />
                <ServiceWorkerProvider />
              </TooltipProvider>
            </ThemeProvider>
          </QueryProvider>
        </NuqsAdapter>
      </body>
    </html>
  )
}
