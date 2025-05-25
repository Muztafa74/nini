import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/auth'
import { Toaster } from '@/components/ui/sonner'

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nini Family - Our Precious Memories",
  description: "A private space for our family to store and cherish our beautiful moments together. Join Hager Lotfy and Mustafa Mohamed in preserving our family's precious memories.",
  keywords: ["Nini Family", "Hager Lotfy", "Mustafa Mohamed", "Family Memories", "Family Photos", "Family Website"],
  authors: [{ name: "Hager Lotfy", url: "https://nini-family.com" }],
  creator: "Hager Lotfy",
  publisher: "Nini Family",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://nini-family.com',
    title: 'Nini Family - Our Precious Memories',
    description: 'A private space for our family to store and cherish our beautiful moments together. Join Hager Lotfy and Mustafa Mohamed in preserving our family\'s precious memories.',
    siteName: 'Nini Family',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nini Family - Our Precious Memories',
    description: 'A private space for our family to store and cherish our beautiful moments together.',
    creator: '@ninifamily',
  },
  verification: {
    google: 'your-google-site-verification', // You'll need to add your Google Search Console verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster
            theme="light"
            position="top-center"
            richColors
          />
        </AuthProvider>
      </body>
    </html>
  );
}
