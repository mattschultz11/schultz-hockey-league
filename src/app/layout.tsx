import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Footer from "./footer";
import Nav from "./nav";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Schultz Hockey League",
  description: "Website for the Schultz Hockey League based in metro Detroit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} dark text-foreground bg-background min-h-screen antialiased`}
      >
        <Providers>
          <div id="appContainer" className="relative flex flex-col">
            <Nav />
            <main className="relative mx-auto min-h-[calc(100vh_-_64px_-_64px)] w-full max-w-7xl grow p-6">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
