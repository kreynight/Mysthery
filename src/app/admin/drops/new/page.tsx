"use client";

import Link from "next/link";
import DropForm from "@/components/DropForm";

export default function NewDropPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href="/admin/drops"
          className="text-xs text-stone-400 hover:text-stone-800 transition-colors"
        >
          &larr; Back to collections
        </Link>
      </div>
      <h1 className="text-xl font-light tracking-wide text-stone-800 mb-8">New Collection</h1>
      <DropForm />
    </div>
  );
}
