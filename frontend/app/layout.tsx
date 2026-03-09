import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import Providers from "./providers";
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
        className="font-sans antialiased bg-gray-50 flex flex-col min-h-screen"
        suppressHydrationWarning
      >
        <AuthProvider>
          <Providers>
            <Navbar />
            <main className="flex-1 w-full">
              <ErrorBoundary name="Global App Context">
                {children}
              </ErrorBoundary>
            </main>
            <Footer />
            <CompareDrawer />
            <Toaster />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}

