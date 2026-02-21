"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [seedStatus, setSeedStatus] = useState("");
  const [setupStatus, setSetupStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/drops")
      .then((r) => {
        if (r.ok) setLoggedIn(true);
      })
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setLoggedIn(true);
    } else {
      setError("Invalid password.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setLoggedIn(false);
    setPassword("");
  };

  const handleSetup = async () => {
    setSetupStatus("Creating tables...");
    try {
      const res = await fetch("/api/admin/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSetupStatus(data.message || "Tables created successfully.");
      } else {
        setSetupStatus(`Error: ${data.error}`);
      }
    } catch {
      setSetupStatus("Failed to connect. Check your DATABASE_URL.");
    }
  };

  const handleSeed = async () => {
    if (!confirm("This will clear all existing drops, orders, and ingredients, then add sample data. Continue?")) return;
    setSeedStatus("Seeding...");
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSeedStatus(data.message || "Seeded successfully.");
      } else {
        setSeedStatus(`Error: ${data.error}`);
      }
    } catch {
      setSeedStatus("Failed to seed.");
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-neutral-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
          <h1 className="text-lg font-light tracking-wide text-neutral-900 text-center">
            Admin Login
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-neutral-300 px-4 py-3 text-sm"
            autoFocus
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full bg-neutral-900 text-white py-3 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors"
          >
            Log In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-xl font-light tracking-wide text-neutral-900">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          Log Out
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/drops"
          className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors"
        >
          <h2 className="text-sm font-medium text-neutral-900 mb-1">Drops</h2>
          <p className="text-xs text-neutral-400">Create, edit, and manage drops</p>
        </Link>
        <Link
          href="/admin/orders"
          className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors"
        >
          <h2 className="text-sm font-medium text-neutral-900 mb-1">Orders</h2>
          <p className="text-xs text-neutral-400">View orders and statuses</p>
        </Link>
        <Link
          href="/admin/inventory"
          className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors"
        >
          <h2 className="text-sm font-medium text-neutral-900 mb-1">Inventory</h2>
          <p className="text-xs text-neutral-400">Manage ingredient inventory</p>
        </Link>
      </div>

      {/* Setup & Seed section */}
      <div className="mt-10 border-t border-neutral-100 pt-8">
        <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 mb-4">
          First-Time Setup
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSetup}
            className="px-5 py-2.5 text-xs tracking-widest uppercase border border-neutral-300 hover:border-neutral-500 transition-colors"
          >
            Create Database Tables
          </button>
          <button
            onClick={handleSeed}
            className="px-5 py-2.5 text-xs tracking-widest uppercase border border-neutral-300 hover:border-neutral-500 transition-colors"
          >
            Load Sample Data
          </button>
        </div>
        {setupStatus && (
          <p className={`text-xs mt-3 ${setupStatus.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
            {setupStatus}
          </p>
        )}
        {seedStatus && (
          <p className={`text-xs mt-3 ${seedStatus.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
            {seedStatus}
          </p>
        )}
        <p className="text-[10px] text-neutral-400 mt-3">
          &ldquo;Create Database Tables&rdquo; sets up the database schema. Only needed once after first deploy.
          &ldquo;Load Sample Data&rdquo; adds 3 demo drops and 10 ingredients (clears existing data first).
        </p>
      </div>

      <div className="mt-6">
        <Link href="/" className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors">
          &larr; Back to site
        </Link>
      </div>
    </div>
  );
}
