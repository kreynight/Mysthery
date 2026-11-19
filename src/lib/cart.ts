"use client";
// The shopping cart and the shared origin filter. Kept in the browser (localStorage) and shared across components.

import { useSyncExternalStore } from "react";
import type { PackSize } from "@/lib/pricing";
import { FREE_SHIP_FROM, shippingFor } from "@/lib/pricing";

export interface TeaCartLine {
  kind: "tea";
  key: string;
  teaId: string;
  name: string;
  /** "1 oz pouch" or "10 g tasting" */
  label: string;
  price: number;
  qty: number;
  image?: string;
}

export interface MixCartLine {
  kind: "mix";
  key: string;
  name: string;
  items: { id: string; parts: number }[];
  teas: string[];
  size: PackSize;
  /** Price for `size` pouches. */
  price: number;
  qty: number;
}

export type CartLine = TeaCartLine | MixCartLine;

const KEY = "mystherie-cart-v1";
const MAX_QTY = 5;
const MAX_LINES = 20;

type State = { lines: CartLine[]; open: boolean; origin: string | null };
let state: State = { lines: [], open: false, origin: null };
let loaded = false;
const listeners = new Set<() => void>();
const SERVER: State = { lines: [], open: false, origin: null };

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) state = { ...state, lines: parsed.filter((l) => l && (l.kind === "tea" || l.kind === "mix")).slice(0, MAX_LINES) };
  } catch {
    // storage blocked: the cart still works for this visit
  }
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state.lines));
  } catch {
    // ignore
  }
}

function set(next: Partial<State>, persist = false) {
  state = { ...state, ...next };
  if (persist) save();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCart(): State {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => SERVER
  );
}

export function addTea(line: Omit<TeaCartLine, "kind" | "key" | "qty">) {
  const key = `tea:${line.teaId}`;
  const existing = state.lines.find((l) => l.key === key);
  const lines = existing
    ? state.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l))
    : [...state.lines, { ...line, kind: "tea" as const, key, qty: 1 }].slice(-MAX_LINES);
  set({ lines, open: true }, true);
}

export function addMix(line: Omit<MixCartLine, "kind" | "key" | "qty">) {
  const key = `mix:${line.items.map((i) => `${i.id}x${i.parts}`).join("+")}:${line.size}`;
  const existing = state.lines.find((l) => l.key === key);
  const lines = existing
    ? state.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l))
    : [...state.lines, { ...line, kind: "mix" as const, key, qty: 1 }].slice(-MAX_LINES);
  set({ lines, open: true }, true);
}

export function setQty(key: string, qty: number) {
  const lines =
    qty <= 0
      ? state.lines.filter((l) => l.key !== key)
      : state.lines.map((l) => (l.key === key ? { ...l, qty: Math.min(MAX_QTY, qty) } : l));
  set({ lines }, true);
}

export function clearCart() {
  set({ lines: [] }, true);
}

export function openCart(open: boolean) {
  set({ open });
}

export function setOrigin(origin: string | null) {
  set({ origin });
}

export function linePouches(l: CartLine): number {
  return l.kind === "mix" ? l.size * l.qty : l.qty;
}

export function cartTotals(lines: CartLine[]) {
  const pouches = lines.reduce((s, l) => s + linePouches(l), 0);
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = pouches === 0 ? 0 : shippingFor(pouches);
  return { pouches, subtotal, shipping, total: subtotal + shipping, toFree: Math.max(0, FREE_SHIP_FROM - pouches) };
}

export const CART_MAX_QTY = MAX_QTY;
