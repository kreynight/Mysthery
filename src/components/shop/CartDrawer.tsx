"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { FREE_SHIP_FROM, sizeLabel } from "@/lib/pricing";
import { CART_MAX_QTY, cartTotals, clearCart, openCart, setQty, useCart, type CartLine } from "@/lib/cart";

function price(cents: number) {
  return formatPrice(cents).replace(".00", "");
}

function Line({ line }: { line: CartLine }) {
  return (
    <li className="flex gap-3 py-4 border-b border-[#2b3a28]/10">
      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-[#dfe6d3]">
        {line.kind === "tea" && line.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={line.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center font-display text-2xl text-[#5b4532]">✦</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#2b3a28] leading-snug">{line.name}</p>
        <p className="text-xs text-stone-500 mt-0.5 leading-snug">
          {line.kind === "tea" ? line.label : `${sizeLabel(line.size)} · ${line.teas.join(" + ")}`}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="inline-flex items-center rounded-full ring-1 ring-[#2b3a28]/20">
            <button
              type="button"
              aria-label={`One fewer ${line.name}`}
              onClick={() => setQty(line.key, line.qty - 1)}
              className="w-8 h-8 grid place-items-center text-[#2b3a28]"
            >
              −
            </button>
            <span className="w-5 text-center text-sm tabular-nums">{line.qty}</span>
            <button
              type="button"
              aria-label={`One more ${line.name}`}
              disabled={line.qty >= CART_MAX_QTY}
              onClick={() => setQty(line.key, line.qty + 1)}
              className="w-8 h-8 grid place-items-center text-[#2b3a28] disabled:opacity-30"
            >
              +
            </button>
          </div>
          <button type="button" onClick={() => setQty(line.key, 0)} className="text-xs text-stone-500 underline underline-offset-2">
            Remove
          </button>
        </div>
      </div>
      <p className="text-sm font-semibold text-[#5b4532] whitespace-nowrap">{price(line.price * line.qty)}</p>
    </li>
  );
}

export default function CartDrawer() {
  const { lines, open } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = cartTotals(lines);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && openCart(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const checkout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: lines.map((l) =>
            l.kind === "tea" ? { type: "tea", id: l.teaId, qty: l.qty } : { type: "mix", mix: l.items, size: l.size, qty: l.qty }
          ),
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        onClick={() => openCart(false)}
        className={`absolute inset-0 bg-[#1e2a1c]/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-label="Your cart"
        className={`absolute right-0 top-0 h-full w-[min(420px,92vw)] bg-[#f6f4ec] shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2b3a28]/10">
          <p className="font-display text-2xl text-[#2b3a28]">Your cart</p>
          <button type="button" onClick={() => openCart(false)} aria-label="Close cart" className="w-10 h-10 grid place-items-center text-2xl text-[#2b3a28]">
            ×
          </button>
        </div>

        {lines.length > 0 && (
          <div className="px-5 pt-3">
            <div className="h-1.5 rounded-full bg-[#2b3a28]/10 overflow-hidden">
              <div className="h-full bg-[#7a5a3c] transition-all" style={{ width: `${Math.min(100, (t.pouches / FREE_SHIP_FROM) * 100)}%` }} />
            </div>
            <p className="text-xs text-stone-600 mt-1.5">
              {t.toFree > 0
                ? `Add ${t.toFree} more ${t.toFree === 1 ? "pouch" : "pouches"} for free shipping.`
                : "You've got free shipping."}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5">
          {lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-stone-500 mb-4">Your cart is empty.</p>
              <Link href="/#shop" onClick={() => openCart(false)} className="inline-block rounded-full bg-[#2b3a28] text-[#f5f7ef] px-6 py-3 text-xs tracking-widest uppercase">
                Shop teas
              </Link>
            </div>
          ) : (
            <ul>
              {lines.map((l) => (
                <Line key={l.key} line={l} />
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="px-5 py-4 border-t border-[#2b3a28]/10 space-y-1.5 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatPrice(t.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Shipping</span>
              <span>{t.shipping === 0 ? "Free" : formatPrice(t.shipping)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[#2b3a28] pt-1">
              <span>Total</span>
              <span>{formatPrice(t.total)}</span>
            </div>
            <button
              type="button"
              onClick={checkout}
              disabled={loading}
              className="mt-3 w-full py-4 rounded-full bg-[#2b3a28] text-[#f5f7ef] text-sm tracking-widest uppercase hover:bg-[#1e2a1c] transition-colors disabled:opacity-70"
            >
              {loading ? "Opening checkout..." : "Checkout"}
            </button>
            <p className="text-[11px] text-stone-500 text-center">Promo codes go in at checkout. US shipping only.</p>
            {error && <p className="text-sm text-[#8b3a2b] text-center">{error}</p>}
            <button type="button" onClick={clearCart} className="block mx-auto text-[11px] text-stone-400 underline underline-offset-2">
              Empty cart
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
