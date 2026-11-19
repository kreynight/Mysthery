import type { Metadata } from "next";
import { Familjen_Grotesk, Young_Serif } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_NAME } from "@/lib/constants";
import { INSTAGRAM_HREF, TIKTOK_HREF } from "@/lib/social";

// Display: Young Serif, a warm, slightly old-world serif. Body: Familjen Grotesk, a grotesk with hand-cut character.
const display = Young_Serif({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-young", display: "swap" });
const body = Familjen_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-familjen", display: "swap" });

export const metadata: Metadata = {
  title: `${SITE_NAME} | Tea Atelier`,
  description: "Single-origin teas and Haitian bush teas by the pouch, or pull the lever for a one-of-a-kind blend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        <Header instagram={INSTAGRAM_HREF} tiktok={TIKTOK_HREF} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
