"use client";

import { useMemo, useState } from "react";
import {
  FAMILIES,
  FAMILY_ORDER,
  FAMILY_TINT,
  blockingRule,
  validateMix,
  type MixSettingLike,
  type PublicTea,
  type RuleLike,
} from "@/lib/mix";
import { formatPrice } from "@/lib/format";

interface Props {
  teas: PublicTea[];
  rules: RuleLike[];
  setting: MixSettingLike;
}

export default function MixBuilder({ teas, rules, setting }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const byId = useMemo(() => new Map(teas.map((t) => [t.id, t])), [teas]);
  const pickedTeas = picked.map((id) => byId.get(id)).filter(Boolean) as PublicTea[];
  const full = picked.length >= setting.maxTeas;

  function blockReason(tea: PublicTea): string | null {
    for (const p of pickedTeas) {
      if (p.id === tea.id) continue;
      const r = blockingRule(tea, p, rules);
      if (r) return `Doesn't pair with ${p.name}${r.reason ? `: ${r.reason}` : "."}`;
    }
    return null;
  }

  function toggle(id: string) {
    setError("");
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= setting.maxTeas ? cur : [...cur, id]));
  }

  const invalid = validateMix(pickedTeas, rules, setting);

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mix: picked }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "Something went wrong. Please try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  const groups = FAMILY_ORDER.map((f) => ({ family: f, teas: teas.filter((t) => t.family === f) })).filter(
    (g) => g.teas.length > 0
  );

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-8 items-start">
      <div className="flex-1 min-w-0 space-y-10">
        {groups.map((g) => (
          <section key={g.family}>
            <h2 className="font-display text-2xl font-light text-[#2b3a28] mb-1">{FAMILIES[g.family]?.label}</h2>
            <p className="text-sm text-stone-500 mb-4">{FAMILIES[g.family]?.blurb}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {g.teas.map((t) => {
                const isPicked = picked.includes(t.id);
                const reason = isPicked ? null : blockReason(t);
                const disabled = !isPicked && (!!reason || full);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => toggle(t.id)}
                      disabled={disabled}
                      aria-pressed={isPicked}
                      className={`w-full text-left rounded-2xl p-4 ring-1 transition-colors ${
                        isPicked
                          ? "bg-[#3d4a3a] ring-[#3d4a3a] text-[#f5f7ef]"
                          : disabled
                          ? "bg-[#f5f7ef]/60 ring-stone-200 text-stone-500 cursor-not-allowed"
                          : "bg-[#f5f7ef] ring-stone-200 hover:ring-[#5e7a4c] text-[#2b3a28]"
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <span
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: isPicked ? "#d3dec6" : FAMILY_TINT[t.family] }}
                          aria-hidden="true"
                        />
                        <span className="min-w-0">
                          <span className="block font-medium">{t.name}</span>
                          {t.flavorNotes && (
                            <span className={`block text-xs mt-0.5 ${isPicked ? "text-[#d3dec6]" : "text-stone-500"}`}>
                              {t.flavorNotes}
                            </span>
                          )}
                          {reason && <span className="block text-xs mt-1.5 text-[#7a5a3c]">{reason}</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <aside className="w-full lg:w-80 lg:sticky lg:top-6 rounded-3xl bg-[#2b3a28] text-[#f5f7ef] p-6">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#d9c3a5] mb-2">Your mix</p>
        {pickedTeas.length === 0 ? (
          <p className="text-sm text-[#d3dec6] mb-4">
            Pick {setting.minTeas} to {setting.maxTeas} teas to start.
          </p>
        ) : (
          <ul className="space-y-2 mb-4">
            {pickedTeas.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{t.name}</span>
                <button
                  type="button"
                  onClick={() => toggle(t.id)}
                  className="text-xs text-[#d3dec6] underline underline-offset-2 hover:text-white"
                  aria-label={`Remove ${t.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-[#d3dec6] mb-5">
          {picked.length} of {setting.maxTeas} picked · one pouch
        </p>
        <button
          type="button"
          onClick={checkout}
          disabled={!!invalid || loading}
          className="w-full rounded-full bg-[#f5f7ef] text-[#2b3a28] py-3.5 text-xs tracking-widest uppercase font-semibold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Opening checkout..." : `Buy this mix · ${formatPrice(setting.price)}`}
        </button>
        {invalid && pickedTeas.length > 0 && <p className="text-xs text-[#e5cfae] mt-3">{invalid}</p>}
        {error && (
          <p role="alert" className="text-xs text-[#f2c4b8] mt-3">
            {error}
          </p>
        )}
      </aside>
    </div>
  );
}
