"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { OrderRecipe } from "@/lib/recipe";

interface Order {
  id: string;
  dropId: string | null;
  drop: { name: string; slug: string } | null;
  mixItems: string | null;
  quantity: number;
  email: string | null;
  stripeSessionId: string;
  stripePaymentId: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  blend: OrderRecipe | null;
  blendSource: "order" | "batch" | "names" | "none";
}

const SOURCE_NOTE: Record<Order["blendSource"], string> = {
  order: "",
  batch: "Placed before recipes were saved on orders, so this is the batch's current recipe.",
  names: "Placed before ratios were saved, so this assumes equal parts.",
  none: "",
};

function BlendCard({ order }: { order: Order }) {
  const b = order.blend;
  if (!b) {
    return (
      <p className="mt-3 text-xs text-orange-700 bg-orange-50 px-3 py-2">
        No recipe on file. Add one to this batch in Collections so future orders show what to blend.
      </p>
    );
  }
  return (
    <div className="mt-3 bg-[#eef2e8] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#2b3a28] mb-2">
        Blend {b.pouches > 1 ? `each of ${b.pouches} pouches` : "1 pouch"} ({b.packGrams} g)
      </p>
      <table className="w-full text-sm">
        <tbody>
          {b.lines.map((l, i) => (
            <tr key={i} className="align-top">
              <td className="py-0.5 pr-3 font-medium text-[#2b3a28] whitespace-nowrap">{l.grams} g</td>
              <td className="py-0.5 pr-3 text-stone-500 whitespace-nowrap">
                {l.parts} {l.parts === 1 ? "part" : "parts"}
              </td>
              <td className="py-0.5 text-stone-800">
                {l.inventoryNo ? <span className="text-stone-400">#{l.inventoryNo} </span> : null}
                {l.name}
                {l.brand ? <span className="text-stone-400"> · {l.brand}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {b.pouches > 1 && (
        <p className="text-xs text-stone-500 mt-2">
          In total: {b.lines.map((l) => `${l.grams * b.pouches} g ${l.name}`).join(", ")}.
        </p>
      )}
      {SOURCE_NOTE[order.blendSource] && <p className="text-xs text-stone-500 mt-2">{SOURCE_NOTE[order.blendSource]}</p>}
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => {
        if (!r.ok) {
          window.location.href = "/admin";
          return [];
        }
        return r.json();
      })
      .then((d) => setOrders(d || []))
      .finally(() => setLoading(false));
  }, []);

  const statusColor: Record<string, string> = {
    paid: "text-green-700 bg-green-50",
    pending: "text-amber-700 bg-amber-50",
    failed: "text-red-700 bg-red-50",
    review: "text-orange-700 bg-orange-50",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-stone-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-xl font-light tracking-wide text-stone-800 mb-2">Orders</h1>
      <p className="text-sm text-stone-500 mb-8">
        Each order shows exactly what to blend, in grams per pouch. Pack the paid ones; pending means checkout was
        opened but not paid.
      </p>

      {orders.length === 0 ? (
        <p className="text-sm text-stone-400">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-stone-200 p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <span className="text-sm font-medium text-stone-800">
                    {order.drop ? order.drop.name : "Custom mix"}
                  </span>
                  <span className="text-xs text-stone-400 ml-2">x{order.quantity}</span>
                </div>
                <span
                  className={`inline-block text-xs tracking-wide uppercase px-2 py-1 ${
                    statusColor[order.status] || "text-stone-500 bg-stone-50"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-500">
                <div>
                  <span className="text-stone-400">Total: </span>
                  ${(order.totalAmount / 100).toFixed(2)}
                </div>
                <div>
                  <span className="text-stone-400">Email: </span>
                  {order.email || "N/A"}
                </div>
                <div>
                  <span className="text-stone-400">Date: </span>
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
                <div className="truncate">
                  <span className="text-stone-400">ID: </span>
                  {order.id.slice(0, 8)}...
                </div>
              </div>
              <BlendCard order={order} />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-xs text-stone-400 hover:text-stone-800 transition-colors">
          &larr; Back to dashboard
        </Link>
      </div>
    </div>
  );
}
