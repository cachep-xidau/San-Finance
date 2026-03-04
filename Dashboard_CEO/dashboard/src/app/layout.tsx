import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "S Group Dashboard",
  description: "Financial dashboard for S Group dental clinics",
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#0F1117',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t === 'light') document.documentElement.setAttribute('data-theme','light');
              } catch(e){}
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Script id="pwa-sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch((error) => {
                  console.error('Service worker registration failed:', error)
                })
              })
            }
          `}
        </Script>
      </body>
    </html>
  );
}
