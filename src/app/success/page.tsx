import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function SuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-3">
        Order Confirmed
      </p>
      <h1 className="text-2xl font-light tracking-wide text-stone-800 mb-4">
        Thank you.
      </h1>
      <p className="text-sm text-stone-500 mb-8 leading-relaxed">
        Your mystery tea is on its way. You&apos;ll receive a confirmation email from Stripe
        with your receipt. We&apos;ll ship within 3–5 business days.
      </p>
      <Link
        href="/"
        className="inline-block border border-[#3d4a3a] px-8 py-3 text-xs tracking-widest uppercase text-[#3d4a3a] hover:bg-[#3d4a3a] hover:text-white transition-colors"
      >
        Back to {SITE_NAME}
      </Link>
    </div>
  );
}
