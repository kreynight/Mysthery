"use client";

import { useEffect, useMemo, useState } from "react";
import { FAMILIES, FAMILY_TINT, validateMix, type MixSettingLike, type PublicTea, type RuleLike } from "@/lib/mix";
import {
  CAFFEINE_PREFS,
  FLAVORS,
  MOODS,
  TIME_PREFS,
  addOptions,
  generateMix,
  mixName,
  mixSummary,
  swapOptions,
  type GeneratedItem,
  type GeneratorInput,
} from "@/lib/generator";
import { buildOrderRecipe, packLabel } from "@/lib/recipe";
import { formatPrice } from "@/lib/format";

interface Props {
  teas: PublicTea[];
  rules: RuleLike[];
  setting: MixSettingLike;
}

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[11px] tracking-[0.25em] uppercase text-[#7a5a3c] mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={value === o.key}
            onClick={() => onChange(o.key)}
            className={`rounded-full px-4 py-2 text-sm ring-1 transition-colors ${
              value === o.key
                ? "bg-[#3d4a3a] ring-[#3d4a3a] text-[#f5f7ef]"
                : "bg-[#f5f7ef] ring-stone-300 text-[#2b3a28] hover:ring-[#5e7a4c]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

const MOOD_OPTIONS = [...Object.entries(MOODS).map(([key, m]) => ({ key, label: m.label })), { key: "any", label: "Surprise me" }];
const FLAVOR_OPTIONS = [...Object.entries(FLAVORS).map(([key, f]) => ({ key, label: f.label })), { key: "any", label: "Surprise me" }];

export default function MixGenerator({ teas, rules, setting }: Props) {
  const [input, setInput] = useState<GeneratorInput>({ mood: "any", flavor: "any", caffeine: "any", time: "any" });
  const [items, setItems] = useState<GeneratedItem[] | null>(null);
  const [noMatch, setNoMatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function generate(next: GeneratorInput = input) {
    setError("");
    const result = generateMix(teas, rules, setting, next);
    setNoMatch(!result);
    if (result) setItems(result);
  }

  // First blend appears once the page is in the browser, so every visit starts with a surprise.
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(patch: Partial<GeneratorInput>) {
    const next = { ...input, ...patch };
    setInput(next);
    generate(next);
  }

  const current = items?.map((i) => i.tea) || [];
  const invalid = items ? validateMix(current, rules, setting) : "Generate a mix first.";
  const recipe = useMemo(
    () =>
      items
        ? buildOrderRecipe(
            items.map((i) => ({ inventoryNo: i.tea.inventoryNo, name: i.tea.name, brand: null, parts: i.parts })),
            setting.packGrams,
            1
          )
        : null,
    [items, setting.packGrams]
  );

  function setTeas(next: PublicTea[]) {
    setError("");
    setItems(next.map((tea, i) => ({ tea, parts: i === 0 && next.length > 1 ? 2 : 1 })));
  }

  function swap(index: number, id: string) {
    const tea = teas.find((t) => t.id === id);
    if (!tea) return;
    setTeas(current.map((t, i) => (i === index ? tea : t)));
  }

  function makeLead(index: number) {
    setTeas([current[index], ...current.filter((_, i) => i !== index)]);
  }

  async function checkout() {
    if (!items) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mix: items.map((i) => ({ id: i.tea.id, parts: i.parts })) }),
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

  const canAdd = !!items && items.length < setting.maxTeas;
  const canRemove = !!items && items.length > setting.minTeas;
  const adds = items && canAdd ? addOptions(current, teas, rules, input).slice(0, 10) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-8 items-start">
      <section className="rounded-3xl bg-[#e1e9d6] p-6 md:p-8 space-y-6" aria-label="Your choices">
        <div>
          <h2 className="font-display text-2xl font-light text-[#2b3a28]">Tell us how you want it</h2>
          <p className="text-sm text-stone-600 mt-1">
            We pull {setting.minTeas} to {setting.maxTeas} teas from the shelf that brew well together.
          </p>
        </div>
        <Chips label="Mood" options={MOOD_OPTIONS} value={input.mood} onChange={(mood) => update({ mood })} />
        <Chips label="Flavor" options={FLAVOR_OPTIONS} value={input.flavor} onChange={(flavor) => update({ flavor })} />
        <Chips label="Caffeine" options={CAFFEINE_PREFS} value={input.caffeine} onChange={(caffeine) => update({ caffeine })} />
        <Chips label="Time of day" options={TIME_PREFS} value={input.time} onChange={(time) => update({ time })} />
      </section>

      <aside className="w-full lg:sticky lg:top-6 rounded-3xl bg-[#2b3a28] text-[#f5f7ef] p-6" aria-live="polite">
        <p className="text-[11px] tracking-[0.3em] uppercase text-[#d9c3a5] mb-2">Your mix</p>
        {noMatch ? (
          <p className="text-sm text-[#d3dec6] mb-5">
            Nothing on the shelf fits all of that right now. Try loosening one choice.
          </p>
        ) : !items ? (
          <p className="text-sm text-[#d3dec6] mb-5">Pouring...</p>
        ) : (
          <>
            <h3 className="font-display text-3xl font-light mb-1">{mixName(items, input)}</h3>
            <p className="text-sm text-[#d3dec6] mb-5">{mixSummary(items)}</p>
            <ul className="space-y-4 mb-4">
              {items.map((item, idx) => {
                const options = swapOptions(current, idx, teas, rules, input).slice(0, 10);
                const grams = recipe?.lines[idx]?.grams;
                return (
                  <li key={item.tea.id} className="rounded-2xl bg-[#3d4a3a] p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-[#f5f7ef]/40"
                        style={{ backgroundColor: FAMILY_TINT[item.tea.family] }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{item.tea.name}</p>
                        <p className="text-xs text-[#d3dec6] mt-0.5">
                          {FAMILIES[item.tea.family]?.label.replace(/s$/, "") || "Tea"} · {item.parts}{" "}
                          {item.parts === 1 ? "part" : "parts"}
                          {grams ? ` · ${grams} g` : ""}
                          {idx === 0 && items.length > 1 ? " · the lead" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                      {options.length > 0 && (
                        <label className="flex items-center gap-2">
                          <span className="sr-only">Swap {item.tea.name} for</span>
                          <select
                            value=""
                            onChange={(e) => swap(idx, e.target.value)}
                            className="rounded-full bg-[#2b3a28] text-[#f5f7ef] ring-1 ring-[#f5f7ef]/30 px-3 py-1.5 max-w-[12rem]"
                          >
                            <option value="">Swap for...</option>
                            {options.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      {idx > 0 && (
                        <button type="button" onClick={() => makeLead(idx)} className="underline underline-offset-2 text-[#d3dec6] hover:text-white">
                          Make lead
                        </button>
                      )}
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => setTeas(current.filter((_, i) => i !== idx))}
                          className="underline underline-offset-2 text-[#d3dec6] hover:text-white"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {canAdd && adds.length > 0 && (
              <label className="block mb-4 text-xs">
                <span className="sr-only">Add a tea</span>
                <select
                  value=""
                  onChange={(e) => {
                    const tea = teas.find((t) => t.id === e.target.value);
                    if (tea) setTeas([...current, tea]);
                  }}
                  className="w-full rounded-full bg-[#2b3a28] text-[#f5f7ef] ring-1 ring-[#f5f7ef]/30 px-4 py-2"
                >
                  <option value="">Add a tea...</option>
                  {adds.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="text-xs text-[#d3dec6] mb-5">One {packLabel(setting.packGrams)}.</p>
          </>
        )}
        <button
          type="button"
          onClick={() => generate()}
          className="w-full rounded-full border border-[#f5f7ef]/60 py-3 text-xs tracking-widest uppercase font-semibold hover:bg-[#f5f7ef]/10 transition-colors mb-3"
        >
          {items ? "Generate another" : "Generate my mix"}
        </button>
        <button
          type="button"
          onClick={checkout}
          disabled={!!invalid || loading || noMatch}
          className="w-full rounded-full bg-[#f5f7ef] text-[#2b3a28] py-3.5 text-xs tracking-widest uppercase font-semibold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Opening checkout..." : `Buy this mix · ${formatPrice(setting.price)}`}
        </button>
        {items && invalid && <p className="text-xs text-[#e5cfae] mt-3">{invalid}</p>}
        {error && (
          <p role="alert" className="text-xs text-[#f2c4b8] mt-3">
            {error}
          </p>
        )}
      </aside>
    </div>
  );
}
