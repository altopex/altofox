import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default: BRAND.seo.title,
    template: BRAND.seo.titleTemplate,
  },
  description: BRAND.seo.description,
  keywords: [...BRAND.seo.keywords],
  authors: [{ name: BRAND.legalName, url: BRAND.siteUrl }],
  creator: BRAND.name,
  publisher: BRAND.legalName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BRAND.siteUrl,
    title: BRAND.seo.title,
    description: BRAND.seo.description,
    siteName: BRAND.name,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${BRAND.name} — AI Static Website Builder`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.seo.title,
    description: BRAND.seo.description,
    creator: BRAND.social.twitterHandle,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BRAND.siteUrl}/#organization`,
        name: BRAND.legalName,
        url: BRAND.siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${BRAND.siteUrl}/brand/icon.svg`,
          caption: `${BRAND.name} Logo`,
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: BRAND.supportEmail,
          contactType: "customer support",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${BRAND.siteUrl}/#software`,
        name: BRAND.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: BRAND.siteUrl,
        description: BRAND.seo.description,
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: "99",
          highPrice: "499",
          offerCount: "2",
        },
        publisher: {
          "@id": `${BRAND.siteUrl}/#organization`,
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="bg-[#F8FAFC] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 min-h-screen antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
