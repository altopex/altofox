import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AltoFox — Premium AI Static Website Builder",
  description: "Create complete, beautiful, SEO-optimized static websites in seconds with Google Gemini, OpenAI, or OpenRouter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-[#0F172A] min-h-screen antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
