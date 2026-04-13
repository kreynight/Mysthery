import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE_NAME} | Tea Atelier`,
  description: "Limited-batch mystery tea collections. Curated blends, minimal quantities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        <div className="bg-[#3d4a3a] text-white text-center py-2.5 px-4">
          <p className="text-[11px] tracking-[0.2em] uppercase font-light">
            Coming Soon · Curated tea collections launching this spring
          </p>
        </div>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
