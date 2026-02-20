"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Order {
  id: string;
  dropId: string;
  drop: { name: string; slug: string };
  quantity: number;
  email: string | null;
  stripeSessionId: string;
  stripePaymentId: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
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
        <p className="text-neutral-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-xl font-light tracking-wide text-neutral-900 mb-8">Orders</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-neutral-400">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-neutral-200 p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div>
                  <span className="text-sm font-medium text-neutral-900">
                    {order.drop.name}
                  </span>
                  <span className="text-xs text-neutral-400 ml-2">x{order.quantity}</span>
                </div>
                <span
                  className={`inline-block text-xs tracking-wide uppercase px-2 py-1 ${
                    statusColor[order.status] || "text-neutral-500 bg-neutral-50"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-neutral-500">
                <div>
                  <span className="text-neutral-400">Total: </span>
                  ${(order.totalAmount / 100).toFixed(2)}
                </div>
                <div>
                  <span className="text-neutral-400">Email: </span>
                  {order.email || "—"}
                </div>
                <div>
                  <span className="text-neutral-400">Date: </span>
                  {new Date(order.createdAt).toLocaleDateString()}
                </div>
                <div className="truncate">
                  <span className="text-neutral-400">ID: </span>
                  {order.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors">
          &larr; Back to dashboard
        </Link>
      </div>
    </div>
  );
}
