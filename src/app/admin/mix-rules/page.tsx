"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FAMILIES, FAMILY_ORDER, TAGS, keyLabel } from "@/lib/mix";

interface Rule {
  id: string;
  familyA: string;
  familyB: string;
  reason: string | null;
}
interface Setting {
  minTeas: number;
  maxTeas: number;
  price: number;
  isEnabled: boolean;
}
interface Tea {
  id: string;
  inventoryNo: number | null;
  name: string;
  category: string | null;
  inStock: boolean;
  mixFamily: string | null;
  autoFamily: string;
}

const KEYS = [...FAMILY_ORDER, ...Object.keys(TAGS)];

async function post(body: object) {
  const res = await fetch("/api/admin/mix-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed");
  return data;
}

export default function MixRulesAdmin() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [setting, setSetting] = useState<Setting>({ minTeas: 2, maxTeas: 3, price: 1600, isEnabled: true });
  const [teas, setTeas] = useState<Tea[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [newRule, setNewRule] = useState({ familyA: "green", familyB: "black", reason: "" });

  const load = () =>
    fetch("/api/admin/mix-rules")
      .then((r) => {
        if (!r.ok) {
          window.location.href = "/admin";
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setRules(d.rules);
        setSetting(d.setting);
        setTeas(d.teas);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const run = async (body: object, done: string) => {
    setMsg("");
    try {
      await post(body);
      setMsg(done);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-stone-500 text-sm">Loading...</p>
      </div>
    );
  }

  const field = "border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
      <div>
        <h1 className="text-xl font-light tracking-wide text-stone-800 mb-1">Make a Mix: rules</h1>
        <p className="text-xs text-stone-500">
          Controls the public builder at <Link href="/mix" className="underline">/mix</Link>. Changes go live straight away.
        </p>
        {msg && <p role="status" className="text-xs text-[#5b4532] mt-3">{msg}</p>}
      </div>

      <section>
        <h2 className="text-sm font-medium text-stone-800 mb-3">Mix settings</h2>
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run({ action: "saveSetting", ...setting }, "Settings saved.");
          }}
        >
          <label className="text-xs text-stone-500 flex flex-col gap-1">
            Min teas
            <input type="number" min={1} max={6} className={field} value={setting.minTeas} onChange={(e) => setSetting({ ...setting, minTeas: Number(e.target.value) })} />
          </label>
          <label className="text-xs text-stone-500 flex flex-col gap-1">
            Max teas
            <input type="number" min={1} max={6} className={field} value={setting.maxTeas} onChange={(e) => setSetting({ ...setting, maxTeas: Number(e.target.value) })} />
          </label>
          <label className="text-xs text-stone-500 flex flex-col gap-1">
            Price ($)
            <input type="number" min={1} step="0.01" className={field} value={(setting.price / 100).toFixed(2)} onChange={(e) => setSetting({ ...setting, price: Math.round(Number(e.target.value) * 100) })} />
          </label>
          <label className="text-xs text-stone-500 flex items-center gap-2 pb-2">
            <input type="checkbox" checked={setting.isEnabled} onChange={(e) => setSetting({ ...setting, isEnabled: e.target.checked })} />
            Builder open
          </label>
          <button type="submit" className="bg-[#3d4a3a] text-white px-5 py-2.5 rounded-full text-xs tracking-widest uppercase hover:bg-[#2b3a28]">
            Save
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-stone-800 mb-3">Pairs that can&apos;t be mixed</h2>
        <ul className="space-y-2 mb-6">
          {rules.map((r) => (
            <li key={r.id} className="border border-stone-200 rounded-lg p-3 flex items-start justify-between gap-4 text-sm">
              <div>
                <p className="text-stone-800">
                  {keyLabel(r.familyA)} <span className="text-stone-500">×</span> {keyLabel(r.familyB)}
                </p>
                {r.reason && <p className="text-xs text-stone-500 mt-0.5">{r.reason}</p>}
              </div>
              <button
                type="button"
                onClick={() => run({ action: "deleteRule", id: r.id }, "Rule removed.")}
                className="text-xs px-3 py-1.5 border border-red-200 text-red-700 rounded-full hover:border-red-400"
              >
                Remove
              </button>
            </li>
          ))}
          {rules.length === 0 && <li className="text-sm text-stone-500">No rules: any teas can be mixed.</li>}
        </ul>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            run({ action: "addRule", ...newRule }, "Rule added.");
            setNewRule({ ...newRule, reason: "" });
          }}
        >
          <label className="text-xs text-stone-500 flex flex-col gap-1">
            This
            <select className={field} value={newRule.familyA} onChange={(e) => setNewRule({ ...newRule, familyA: e.target.value })}>
              {KEYS.map((k) => (
                <option key={k} value={k}>{keyLabel(k)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-stone-500 flex flex-col gap-1">
            can&apos;t mix with
            <select className={field} value={newRule.familyB} onChange={(e) => setNewRule({ ...newRule, familyB: e.target.value })}>
              {KEYS.map((k) => (
                <option key={k} value={k}>{keyLabel(k)}</option>
              ))}
              <option value="*">Anything (poured on its own)</option>
            </select>
          </label>
          <label className="text-xs text-stone-500 flex flex-col gap-1 flex-1 min-w-[200px]">
            Reason shown to customers
            <input className={field} value={newRule.reason} onChange={(e) => setNewRule({ ...newRule, reason: e.target.value })} placeholder="e.g. they steep at different temperatures." />
          </label>
          <button type="submit" className="bg-[#3d4a3a] text-white px-5 py-2.5 rounded-full text-xs tracking-widest uppercase hover:bg-[#2b3a28]">
            Add rule
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-medium text-stone-800 mb-1">Which family each tea is in</h2>
        <p className="text-xs text-stone-500 mb-4">
          Worked out from each tea&apos;s type. Override it here, or pick &quot;Hide from mixes&quot;. Out-of-stock teas never show publicly.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-stone-500 border-b border-stone-200">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Tea</th>
                <th className="py-2 pr-3">Type</th>
                <th className="py-2">Family</th>
              </tr>
            </thead>
            <tbody>
              {teas.map((t) => (
                <tr key={t.id} className={`border-b border-stone-100 ${t.inStock ? "" : "opacity-60"}`}>
                  <td className="py-2 pr-3 text-stone-500">{t.inventoryNo}</td>
                  <td className="py-2 pr-3 text-stone-800">{t.name}</td>
                  <td className="py-2 pr-3 text-stone-500">{t.category}</td>
                  <td className="py-2">
                    <select
                      aria-label={`Family for ${t.name}`}
                      className={field}
                      value={t.mixFamily || ""}
                      onChange={(e) => run({ action: "setFamily", id: t.id, mixFamily: e.target.value || null }, `${t.name} updated.`)}
                    >
                      <option value="">Auto: {FAMILIES[t.autoFamily]?.label || t.autoFamily}</option>
                      {FAMILY_ORDER.map((f) => (
                        <option key={f} value={f}>{FAMILIES[f].label}</option>
                      ))}
                      <option value="none">Hide from mixes</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Link href="/admin" className="inline-block text-xs text-stone-500 hover:text-stone-800">
        &larr; Back to dashboard
      </Link>
    </div>
  );
}
