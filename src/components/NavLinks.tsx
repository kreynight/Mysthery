"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/#batches", label: "Batches", match: (p: string) => p === "/" || p.startsWith("/collection") },
  { href: "/teas", label: "Tea Library", match: (p: string) => p.startsWith("/teas") },
  { href: "/mix", label: "Make a Mix", match: (p: string) => p.startsWith("/mix") },
  { href: "/blog", label: "Journal", match: (p: string) => p.startsWith("/blog") },
  { href: "/about", label: "About", match: (p: string) => p.startsWith("/about") },
];

/** Main menu: only the page you are on is highlighted. */
export default function NavLinks() {
  const path = usePathname() || "/";
  return (
    <>
      {NAV.map((n) => {
        const active = n.match(path);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "text-[#f5f7ef] bg-[#3d4a3a] px-3 py-1.5 -my-1.5 rounded-full transition-colors"
                : "hover:text-[#3d4a3a] transition-colors py-1"
            }
          >
            {n.label}
          </Link>
        );
      })}
    </>
  );
}
