import Link from "next/link";
import { DISCLAIMERS, SITE_NAME } from "@/lib/constants";
import { LeafSprig, FlowerSprig } from "@/components/Botanicals";

// NEXT_PUBLIC_INSTAGRAM_URL may hold a full URL or just a handle ("@name" or "name").
function instagramHref(value?: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
  return `https://www.instagram.com/${handle}`;
}

const INSTAGRAM_HREF = instagramHref(process.env.NEXT_PUBLIC_INSTAGRAM_URL);

// NEXT_PUBLIC_TIKTOK_URL may hold a full URL or just a handle ("@name" or "name").
function tiktokHref(value?: string): string | null {
  const v = value?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  if (!/^[A-Za-z0-9._]{2,24}$/.test(handle)) return null;
  return `https://www.tiktok.com/@${handle}`;
}

const TIKTOK_HREF = tiktokHref(process.env.NEXT_PUBLIC_TIKTOK_URL);

export default function Footer() {
  return (
    <footer className="relative w-full mt-24 bg-[#2b3a28] text-[#d3dec6] overflow-hidden">
      <LeafSprig className="absolute -left-6 -bottom-6 w-40 opacity-40" color="#b3c3a2" />
      <FlowerSprig className="absolute right-4 -top-4 w-36 opacity-40" color="#d9a89c" stem="#b3c3a2" />
      <div className="relative max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
          <div>
            <p className="text-sm tracking-widest uppercase font-light text-[#f5f7ef] mb-1">
              {SITE_NAME}
            </p>
            <p className="text-[9px] tracking-[0.25em] uppercase text-[#c9a984] mb-2">
              Tea Atelier
            </p>
            <p className="text-xs text-[#d3dec6] max-w-xs">
              Mystery tea collections. Limited batches.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-6 text-xs tracking-wide uppercase text-[#d3dec6]">
            <Link href="/teas" className="hover:text-white transition-colors">
              Tea Library
            </Link>
            <Link href="/mix" className="hover:text-white transition-colors">
              Make a Mix
            </Link>
            <Link href="/blog" className="hover:text-white transition-colors">
              Journal
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
            <Link href="/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            {INSTAGRAM_HREF && (
              <a
                href={INSTAGRAM_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram
              </a>
            )}
            {TIKTOK_HREF && (
              <a
                href={TIKTOK_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                TikTok
              </a>
            )}
          </nav>
        </div>
        <div className="border-t border-[#d3dec6]/20 pt-6 space-y-2">
          {DISCLAIMERS.map((d, i) => (
            <p key={i} className="text-[11px] leading-relaxed text-[#c3cfb6]">
              {d}
            </p>
          ))}
          <p className="text-[11px] text-[#c3cfb6] pt-2">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved. Photography from Pexels.
          </p>
        </div>
      </div>
    </footer>
  );
}
