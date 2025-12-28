import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { getCurrentUser } from "@/lib/auth";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import VerificationBanner from "@/components/verification-banner";
import NavWrapper from "@/components/layout/nav-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InstaClone",
  description: "Share your moments with the world",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get user data for layout
  let showVerificationBanner = false;
  let username: string | null = null;
  
  try {
    const currentUser = await getCurrentUser();
    
    if (currentUser) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, currentUser.userId),
      });
      
      if (user) {
        username = user.username;
        
        if (!user.emailVerified) {
          showVerificationBanner = true;
        }
      }
    }
  } catch (error) {
    // Silently fail - nav/banner just won't show
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {showVerificationBanner && <VerificationBanner />}
        <NavWrapper username={username} />
        {/* Add padding for fixed nav: pb-14 for mobile bottom nav, md:pt-16 for desktop top nav */}
        <main className={username ? "pb-14 md:pb-0 md:pt-16" : ""}>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
