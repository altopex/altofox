import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AltoFox — Premium AI Static Website Builder",
  description: "Create complete, beautiful, SEO-optimized static websites in seconds with Google Gemini, OpenAI, or OpenRouter.",
};

import { AuthProvider } from "@/lib/auth/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 min-h-screen antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
