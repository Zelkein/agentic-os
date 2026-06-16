import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SSEProvider } from "@/components/sse-provider";
import { TaskDetailPanel } from "@/components/panel/task-detail-panel";
import { ThemeProvider } from "@/components/theme-provider";
import NavHeader from "@/components/layout/nav-header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

// Epilogue for headlines — loaded via next/font/google
import { Epilogue } from "next/font/google";
const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-epilogue",
});

export const metadata: Metadata = {
  title: "Command Centre",
  description: "Agentic OS Command Centre",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${epilogue.variable} antialiased`}
        style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
      >
        <ThemeProvider>
          <SSEProvider>
            <NavHeader />
            {children}
            <TaskDetailPanel />
          </SSEProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
