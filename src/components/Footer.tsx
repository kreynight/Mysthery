import Link from "next/link";
import { DISCLAIMERS, SITE_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-200 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
          <div>
            <p className="text-sm tracking-widest uppercase font-light text-neutral-900 mb-2">
              {SITE_NAME}
            </p>
            <p className="text-xs text-neutral-400 max-w-xs">
              Mystery tea drops. Limited batches.
            </p>
          </div>
          <nav className="flex gap-6 text-xs tracking-wide uppercase text-neutral-500">
            <Link href="/about" className="hover:text-neutral-900 transition-colors">
              About
            </Link>
            <Link href="/faq" className="hover:text-neutral-900 transition-colors">
              FAQ
            </Link>
            {process.env.NEXT_PUBLIC_INSTAGRAM_URL && (
              <a
                href={process.env.NEXT_PUBLIC_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-900 transition-colors"
              >
                Instagram
              </a>
            )}
          </nav>
        </div>
        <div className="border-t border-neutral-100 pt-6 space-y-2">
          {DISCLAIMERS.map((d, i) => (
            <p key={i} className="text-[10px] leading-relaxed text-neutral-400">
              {d}
            </p>
          ))}
          <p className="text-[10px] text-neutral-300 pt-2">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
