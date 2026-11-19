"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/constants";
import { FREE_SHIP_FROM } from "@/lib/pricing";
import { openCart, useCart } from "@/lib/cart";
import CartDrawer from "@/components/shop/CartDrawer";

const MENU = [
  { href: "/#shop", label: "Shop teas" },
  { href: "/#mix", label: "Make a mix" },
  { href: "/#origins", label: "Shop by origin" },
  { href: "/teas", label: "Tea Library" },
  { href: "/blog", label: "Journal" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M3 6h16M3 11h16M3 16h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M4.5 7.5h13l-1 11h-11l-1-11Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Header({ instagram, tiktok }: { instagram?: string | null; tiktok?: string | null }) {
  const [menu, setMenu] = useState(false);
  const { lines } = useCart();
  const count = lines.reduce((s, l) => s + l.qty, 0);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);

  return (
    <>
      <div className="bg-[#2b3a28] text-[#e9dcc6] text-[11px] tracking-[0.2em] uppercase text-center py-2 px-4">
        Free shipping on {FREE_SHIP_FROM} or more pouches
      </div>
      <header className="sticky top-0 z-40 w-full border-b border-[#2b3a28]/10 bg-[#eef2e6]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMenu(true)}
              aria-label="Open menu"
              aria-expanded={menu}
              className="w-11 h-11 grid place-items-center text-[#2b3a28] rounded-full hover:bg-[#2b3a28]/5"
            >
              <MenuIcon />
            </button>
            <nav aria-label="Main" className="hidden lg:flex gap-6 ml-3 text-[13px] text-[#3d4a3a]">
              <Link href="/#shop" className="hover:text-[#2b3a28]">Shop</Link>
              <Link href="/#mix" className="hover:text-[#2b3a28]">Make a mix</Link>
              <Link href="/teas" className="hover:text-[#2b3a28]">Library</Link>
            </nav>
          </div>
          <Link href="/" className="flex flex-col items-center leading-none" aria-label={`${SITE_NAME} home`}>
            <span className="font-display text-[26px] sm:text-[30px] text-[#2b3a28] tracking-tight">{SITE_NAME}</span>
            <span className="text-[8.5px] tracking-[0.42em] uppercase text-[#7a5a3c] mt-1">Tea Atelier</span>
          </Link>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => openCart(true)}
              aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
              className="relative w-11 h-11 grid place-items-center text-[#2b3a28] rounded-full hover:bg-[#2b3a28]/5"
            >
              <BagIcon />
              {count > 0 && (
                <span className="absolute top-1 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#7a5a3c] text-[#fbf6ef] text-[10px] font-semibold grid place-items-center">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Menu drawer */}
      <div className={`fixed inset-0 z-50 ${menu ? "" : "pointer-events-none"}`} aria-hidden={!menu}>
        <div
          onClick={() => setMenu(false)}
          className={`absolute inset-0 bg-[#1e2a1c]/40 transition-opacity duration-300 ${menu ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          role="dialog"
          aria-label="Menu"
          className={`absolute left-0 top-0 h-full w-[min(340px,86vw)] bg-[#2b3a28] text-[#eef2e6] flex flex-col transition-transform duration-300 ${
            menu ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 h-16 border-b border-white/10">
            <span className="font-display text-2xl">{SITE_NAME}</span>
            <button type="button" onClick={() => setMenu(false)} aria-label="Close menu" className="w-10 h-10 grid place-items-center text-2xl">
              ×
            </button>
          </div>
          <nav className="flex-1 px-5 py-4 flex flex-col">
            {MENU.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => setMenu(false)}
                className="font-display text-[26px] py-2.5 border-b border-white/10 hover:text-[#e9dcc6] transition-colors"
              >
                {m.label}
              </Link>
            ))}
          </nav>
          <div className="px-5 py-5 flex gap-5 text-xs tracking-[0.2em] uppercase text-[#c9a984]">
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Instagram
              </a>
            )}
            {tiktok && (
              <a href={tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                TikTok
              </a>
            )}
          </div>
        </aside>
      </div>

      <CartDrawer />
    </>
  );
}
