import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AltoFox - Local Home Service Website Builder",
  description: "Generate SEO-optimized static websites for local home services and contractors with ChatGPT, Gemini, or any Custom API model.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
