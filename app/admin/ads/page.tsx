"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { AD_ZONES, DEVICE_OPTIONS, ROUTE_SCOPES, type AdUnitRow } from "@/lib/ads-types";
import type { SupabaseClient } from "@supabase/supabase-js";

const PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-7776844434912624";

type FormState = {
  name: string;
  code: string;
  zone: string;
  routeScope: string;
  routePath: string;
  device: string;
  priority: string;
  enabled: boolean;
};

const INITIAL_FORM: FormState = {
  name: "",
  code: "",
  zone: "after-header",
  routeScope: "all",
  routePath: "",
  device: "all",
  priority: "50",
  enabled: true,
};

export default function AdsManagerPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [configError, setConfigError] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [units, setUnits] = useState<AdUnitRow[]>([]);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    try {
      const client = createSupabaseBrowserClient();
      if (!alive) return;
      setSupabase(client);
      client.auth.getSession().then(({ data }) => {
        if (!alive) return;
        setSessionToken(data.session?.access_token ?? null);
        setAdminEmail(data.session?.user.email ?? "");
        setLoading(false);
      }).catch((reason) => {
        if (alive) {
          setError(reason instanceof Error ? reason.message : "Could not read Supabase session.");
          setLoading(false);
        }
      });
      const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
        if (!alive) return;
        setSessionToken(session?.access_token ?? null);
        setAdminEmail(session?.user.email ?? "");
      });
      return () => {
        alive = false;
        listener.subscription.unsubscribe();
      };
    } catch (reason) {
      setConfigError(reason instanceof Error ? reason.message : "Supabase browser configuration is missing.");
      setLoading(false);
    }
    return () => { alive = false; };
  }, []);

  const request = useCallback(async (url: string, init: RequestInit = {}) => {
    if (!supabase) throw new Error("Supabase client is not ready.");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Your session has expired. Please sign in again.");
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
    return payload;
  }, [supabase]);

  const loadUnits = useCallback(async () => {
    const payload = await request("/api/ads/admin/units");
    setUnits(Array.isArray(payload.units) ? payload.units as AdUnitRow[] : []);
  }, [request]);

  useEffect(() => {
    if (!sessionToken) {
      setUnits([]);
      return;
    }
    loadUnits().catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load units."));
  }, [sessionToken, loadUnits]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (signInError) { setError(signInError.message); return; }
    setSessionToken(data.session?.access_token ?? null);
    setAdminEmail(data.user.email ?? email.trim());
    setPassword("");
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSessionToken(null); setAdminEmail(""); setUnits([]); setMessage("Signed out.");
  }

  async function saveAd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      await request("/api/ads/admin/units", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          zone: form.zone,
          routeScope: form.routeScope,
          routePath: form.routePath,
          device: form.device,
          priority: Number(form.priority),
          enabled: form.enabled,
        }),
      });
      setForm(INITIAL_FORM);
      setMessage("Ad unit saved. It will appear on matching public pages if Google serves an ad.");
      await loadUnits();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this ad unit.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleUnit(unit: AdUnitRow) {
    setError(""); setMessage("");
    try {
      await request(`/api/ads/admin/units/${unit.id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled: !unit.enabled }),
      });
      await loadUnits();
      setMessage(`${unit.name} ${unit.enabled ? "disabled" : "enabled"}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update unit.");
    }
  }

  async function deleteUnit(unit: AdUnitRow) {
    if (!window.confirm(`Delete "${unit.name}"?`)) return;
    setError(""); setMessage("");
    try {
      await request(`/api/ads/admin/units/${unit.id}`, { method: "DELETE" });
      await loadUnits();
      setMessage("Ad unit deleted.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete unit.");
    }
  }

  if (loading) return <main className="mx-auto max-w-5xl p-8 text-sm text-slate-500">Loading Ad Manager…</main>;

  if (configError) return (
    <main className="mx-auto max-w-3xl p-5 sm:p-8">
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
        <h1 className="text-2xl font-bold">Supabase setup required</h1>
        <p className="mt-3 text-sm">{configError}</p>
        <p className="mt-3 text-sm">Set the public Supabase URL and anon/publishable key, then restart the app.</p>
      </section>
    </main>
  );

  if (!sessionToken) return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <form onSubmit={signIn} className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Convia Control Center</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">AdSense Manager</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in using an admin account created in Supabase Authentication.</p>
        <label className="mt-6 block text-sm font-semibold">Admin email</label>
        <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" />
        <label className="mt-4 block text-sm font-semibold">Password</label>
        <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950" />
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        <button disabled={busy || !supabase} className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
        <p className="mt-4 text-xs leading-5 text-slate-500">Access is limited to email addresses listed in the server-side CONVIA_ADS_ADMIN_EMAILS variable.</p>
      </form>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Convia Control Center</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">AdSense Manager</h1>
            <p className="mt-1 text-sm text-slate-500">Add one ad unit once, choose placements and manage it without editing page code.</p>
            <p className="mt-1 text-xs text-slate-400">Signed in as {adminEmail}</p>
          </div>
          <button onClick={signOut} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700">Sign out</button>
        </header>

        <section className="mt-7 grid gap-3 sm:grid-cols-3">
          <Stat label="Total units" value={String(units.length)} />
          <Stat label="Enabled units" value={String(units.filter((unit) => unit.enabled).length)} />
          <Stat label="Disabled units" value={String(units.filter((unit) => !unit.enabled).length)} />
        </section>

        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Add AdSense code</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Paste one complete AdSense ad-unit snippet. The manager extracts only the safe &lt;ins&gt; attributes. Script tags and pasted JavaScript are ignored and never executed.</p>
          <div className="mt-4 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">Expected Publisher ID: <strong>{PUBLISHER_ID}</strong>. One ad unit per save.</div>
          <form onSubmit={saveAd} className="mt-5 space-y-4">
            <Field label="Ad name"><input required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Responsive content banner" className={inputClass} /></Field>
            <Field label="Complete AdSense ad-unit code"><textarea required rows={8} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder={'<ins class="adsbygoogle" ... data-ad-client="ca-pub-..." data-ad-slot="1234567890"></ins>\n<script>...</script>'} className={`${inputClass} font-mono text-xs`} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Placement"><select value={form.zone} onChange={(event) => setForm({ ...form, zone: event.target.value })} className={inputClass}>{AD_ZONES.map((zone) => <option key={zone.value} value={zone.value}>{zone.label}</option>)}</select></Field>
              <Field label="Pages"><select value={form.routeScope} onChange={(event) => setForm({ ...form, routeScope: event.target.value })} className={inputClass}>{ROUTE_SCOPES.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}</select></Field>
              {form.routeScope === "exact" && <Field label="Exact route"><input required value={form.routePath} onChange={(event) => setForm({ ...form, routePath: event.target.value })} placeholder="/pdf/compress" className={inputClass} /></Field>}
              <Field label="Device"><select value={form.device} onChange={(event) => setForm({ ...form, device: event.target.value })} className={inputClass}>{DEVICE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
              <Field label="Priority (lower number appears first)"><input type="number" min="0" max="1000" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className={inputClass} /></Field>
            </div>
            <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /> Enable this unit immediately after saving</label>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"><strong>Important:</strong> Anchor and Vignette Auto Ads are controlled in the Google AdSense dashboard, not pasted here. This manager handles manual ad-unit snippets such as Display, In-article and Multiplex.</div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}
            <button disabled={busy} className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? "Saving…" : "Save Ad Unit"}</button>
          </form>
        </section>

        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-slate-950 dark:text-white">Configured Ad Units</h2><button onClick={() => loadUnits().catch((reason) => setError(reason instanceof Error ? reason.message : "Refresh failed."))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700">Refresh</button></div>
          {units.length === 0 ? <p className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-800">No ad units saved yet. Paste your first AdSense unit above.</p> : <div className="mt-5 space-y-3">{units.map((unit) => <article key={unit.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-950 dark:text-white">{unit.name}</h3><span className={`rounded-full px-2 py-1 text-xs font-semibold ${unit.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{unit.enabled ? "Enabled" : "Disabled"}</span></div><p className="mt-1 break-all text-xs text-slate-500">Slot {unit.slot_id} · {unit.ad_format || "fixed/default"} · {unit.zone} · {unit.route_scope}{unit.route_path ? ` (${unit.route_path})` : ""} · {unit.device}</p></div><div className="flex shrink-0 gap-2"><button onClick={() => toggleUnit(unit)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700">{unit.enabled ? "Disable" : "Enable"}</button><button onClick={() => deleteUnit(unit)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Delete</button></div></article>)}</div>}
        </section>

        <p className="mt-6 text-xs leading-5 text-slate-500">Security: Supabase Auth verifies admin identity, an email allowlist restricts access, and the service key stays on the server. The public API returns only enabled ad attributes. Actual ad serving depends on AdSense eligibility, consent, inventory and policy.</p>
      </div>
    </main>
  );
}

const inputClass = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">{label}{children}</label>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</p></div>;
}
