import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import NavLinks from "@/components/NavLinks";

export function BotanicalLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      {/* Main leaf */}
      <path
        d="M14 3C14 3 8 8 8 14C8 18.5 10.5 22 14 24C17.5 22 20 18.5 20 14C20 8 14 3 14 3Z"
        fill="#3d4a3a"
        opacity="0.15"
        stroke="#3d4a3a"
        strokeWidth="0.8"
      />
      {/* Leaf vein */}
      <path
        d="M14 6V21"
        stroke="#3d4a3a"
        strokeWidth="0.6"
        opacity="0.4"
      />
      {/* Side veins */}
      <path
        d="M14 10L10.5 13M14 13L10 16M14 16L11 18.5M14 10L17.5 13M14 13L18 16M14 16L17 18.5"
        stroke="#3d4a3a"
        strokeWidth="0.4"
        opacity="0.3"
      />
      {/* Small accent leaf left */}
      <path
        d="M6 8C6 8 4 11 5 13C6 13 8 11 6 8Z"
        fill="#3d4a3a"
        opacity="0.12"
        stroke="#3d4a3a"
        strokeWidth="0.5"
      />
      {/* Small accent leaf right */}
      <path
        d="M22 8C22 8 24 11 23 13C22 13 20 11 22 8Z"
        fill="#3d4a3a"
        opacity="0.12"
        stroke="#3d4a3a"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export default function Header() {
  return (
    <header className="w-full border-b border-stone-200 bg-[#eef2e6]/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Link href="/" className="flex items-center gap-3 group">
          <BotanicalLogo />
          <div className="flex flex-col">
            <span className="text-xl tracking-widest uppercase font-light text-[#3d4a3a] group-hover:text-[#2b3a28] transition-colors">
              {SITE_NAME}
            </span>
            <span className="text-[9px] tracking-[0.25em] uppercase text-[#7a5a3c] -mt-0.5">
              Tea Atelier
            </span>
          </div>
        </Link>
        <nav aria-label="Main" className="-mx-4 px-4 w-[calc(100%+2rem)] sm:w-auto sm:mx-0 sm:px-0 flex gap-x-5 overflow-x-auto whitespace-nowrap py-1 text-xs tracking-wide uppercase text-stone-500 [scrollbar-width:none]">
          <NavLinks />
        </nav>
      </div>
    </header>
  );
}
