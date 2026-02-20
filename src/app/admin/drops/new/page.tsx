"use client";

import Link from "next/link";
import DropForm from "@/components/DropForm";

export default function NewDropPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href="/admin/drops"
          className="text-xs text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          &larr; Back to drops
        </Link>
      </div>
      <h1 className="text-xl font-light tracking-wide text-neutral-900 mb-8">New Drop</h1>
      <DropForm />
    </div>
  );
}
