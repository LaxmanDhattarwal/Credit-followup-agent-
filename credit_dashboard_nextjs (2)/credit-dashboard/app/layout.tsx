import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credit Follow-Up Agent · Finance Dashboard",
  description: "AI-powered invoice recovery dashboard — Groq + Llama 3.3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0b] text-zinc-200 antialiased">
        <div className="scanline" />
        {children}
      </body>
    </html>
  );
}
