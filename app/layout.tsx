import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import SessionProvider from "@/components/providers/session-provider";
import { cn } from "@/lib/utils";

import { Providers } from "./providers";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Steam Toolkit",
  description: "Steam Toolkit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        "h-full",
        "antialiased",
        "font-sans",
        spaceGrotesk.variable,
      )}
    >
      <meta name="apple-mobile-web-app-title" content="Steam Toolkit" />
      <body className="flex min-h-full flex-col">
        <SessionProvider>
          <Providers>{children}</Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
