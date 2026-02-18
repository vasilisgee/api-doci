/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata } from "next";
import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { BackToTopButton } from "@/components/ui/back-to-top-button";

export const metadata: Metadata = {
  title: "APIdoci - API Docs Hub",
  description: "APIdoci - API documentation portal - https://github.com/vasilisgee/api-doci",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png"
  },
  robots: {
    index: false,
    follow: false
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Providers>
          {children}
          <BackToTopButton />
        </Providers>
      </body>
    </html>
  );
}
