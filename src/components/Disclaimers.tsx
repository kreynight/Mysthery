import { DISCLAIMERS } from "@/lib/constants";

export default function Disclaimers() {
  return (
    <div className="border-t border-stone-200/60 pt-6 mt-10 space-y-2">
      {DISCLAIMERS.map((d, i) => (
        <p key={i} className="text-[10px] leading-relaxed text-stone-400">
          {d}
        </p>
      ))}
    </div>
  );
}
