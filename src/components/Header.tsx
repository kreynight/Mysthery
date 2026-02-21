import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function Header() {
  return (
    <header className="w-full border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between">
        <Link href="/" className="text-xl tracking-widest uppercase font-light text-[#3d4a3a]">
          {SITE_NAME}
        </Link>
        <nav className="flex gap-6 text-xs tracking-wide uppercase text-stone-400">
          <Link href="/about" className="hover:text-[#3d4a3a] transition-colors">
            About
          </Link>
          <Link href="/faq" className="hover:text-[#3d4a3a] transition-colors">
            FAQ
          </Link>
        </nav>
      </div>
    </header>
  );
}
