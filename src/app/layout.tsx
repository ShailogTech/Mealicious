import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/Providers";
import { Analytics } from "@/components/Analytics";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mealicious.store";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mealicious Store - Premium Dry Fruits & Healthy Snacks",
    template: "%s | Mealicious Store",
  },
  description: "Shop premium quality cashews, almonds, trail mix, dried fruits, flavored nuts & healthy snacks. 100% natural, FSSAI certified. Free shipping on orders above ₹599.",
  keywords: ["dry fruits", "healthy snacks", "cashews", "almonds", "trail mix", "premium nuts", "organic", "Mealicious", "Indian snacks", "health food"],
  authors: [{ name: "Mealicious Ventures Private Limited" }],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Mealicious Store - Premium Dry Fruits & Healthy Snacks",
    description: "Handpicked premium dry fruits and healthy snacks delivered fresh to your doorstep. 100% natural, FSSAI certified.",
    siteName: "Mealicious Store",
    url: SITE_URL,
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mealicious Store - Premium Dry Fruits & Healthy Snacks",
    description: "Handpicked premium dry fruits and healthy snacks delivered fresh to your doorstep.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Mealicious Store",
  url: SITE_URL,
  description: "Premium dry fruits and healthy snacks. 100% natural, FSSAI certified.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1/108, Elappankadu, Malankadu, Uthamasolapuram",
    addressLocality: "Salem",
    addressRegion: "Tamil Nadu",
    postalCode: "636010",
    addressCountry: "IN"
  },
  sameAs: [] as string[],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${cormorant.variable} antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <Analytics />
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
