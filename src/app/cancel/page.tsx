import Link from "next/link";

export default function CancelPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-3">
        Order Cancelled
      </p>
      <h1 className="text-2xl font-light tracking-wide text-stone-800 mb-4">
        No worries.
      </h1>
      <p className="text-sm text-stone-500 mb-8 leading-relaxed">
        Your order was cancelled and you were not charged. The drop is still available if
        you change your mind.
      </p>
      <Link
        href="/"
        className="inline-block border border-[#3d4a3a] px-8 py-3 text-xs tracking-widest uppercase text-[#3d4a3a] hover:bg-[#3d4a3a] hover:text-white transition-colors"
      >
        Browse Drops
      </Link>
    </div>
  );
}
