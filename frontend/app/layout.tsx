import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import QueryProvider from "@/components/query-provider";
import { CompareDrawer } from "@/components/compare-drawer";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Footer } from "@/components/ui/footer";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "North Bengal Homestays | Find Your Peace",
  description: "Book unique homestays in the hills of North Bengal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-gray-50 min-h-screen flex flex-col"
        suppressHydrationWarning
      >
        <AuthProvider>
          <QueryProvider>
            <Navbar />
            <main className="flex-grow min-h-screen">
              <ErrorBoundary name="Global App Context">
                {children}
              </ErrorBoundary>
            </main>
            <Footer />
            <CompareDrawer />
            <Toaster />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
