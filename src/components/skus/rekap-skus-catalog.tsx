"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { SkuMasterRekapSkusRow } from "@/lib/sku-master/types";

function rowSearchBlob(r: SkuMasterRekapSkusRow): string {
  return [
    r.rowNo,
    r.skus,
    r.namaInternal,
    String(r.variantCount),
    r.sourceTab,
  ]
    .join(" ")
    .toLowerCase();
}

function tokensMatch(blob: string, tokens: string[]): boolean {
  return tokens.every((t) => blob.includes(t));
}

function highlightParts(text: string, tokens: string[]): ReactNode {
  if (!tokens.length || !text) return text || "—";
  const lower = text.toLowerCase();
  const spans: { start: number; end: number }[] = [];
  for (const token of tokens) {
    let from = 0;
    while (token) {
      const idx = lower.indexOf(token, from);
      if (idx === -1) break;
      spans.push({ start: idx, end: idx + token.length });
      from = idx + token.length;
    }
  }
  if (!spans.length) return text;
  spans.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s.start <= last.end) last.end = Math.max(last.end, s.end);
    else merged.push({ ...s });
  }
  const out: ReactNode[] = [];
  let cursor = 0;
  merged.forEach((m, i) => {
    if (cursor < m.start) out.push(text.slice(cursor, m.start));
    out.push(
      <mark key={`${m.start}-${i}`} className="rounded bg-amber-200/90 px-0.5 text-inherit">
        {text.slice(m.start, m.end)}
      </mark>
    );
    cursor = m.end;
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

export function RekapSkusCatalog() {
  const [rows, setRows] = useState<SkuMasterRekapSkusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sourceTab, setSourceTab] = useState("");

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError("");
    const qs = refresh ? "?view=rekap-skus&refresh=1" : "?view=rekap-skus";
    const res = await fetch(`/api/sku-master/list${qs}`);
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal memuat REKAP SKUS.");
      setRows([]);
      return;
    }
    setRows(Array.isArray(data.rows) ? data.rows : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sourceTabOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const t = r.sourceTab.trim();
      if (t) set.add(t);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "id"));
  }, [rows]);

  const searchTokens = useMemo(() => {
    return query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
  }, [query]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (sourceTab && r.sourceTab.trim() !== sourceTab) return false;
      if (!searchTokens.length) return true;
      return tokensMatch(rowSearchBlob(r), searchTokens);
    });
  }, [rows, searchTokens, sourceTab]);

  const filterActive = searchTokens.length > 0 || sourceTab !== "";

  function clearFilters() {
    setQuery("");
    setSourceTab("");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-semibold text-slate-800">Cari di tabel</p>
        <p className="mt-1 text-xs text-slate-500">
          Pisahkan kata dengan spasi — semua kata harus cocok (AND).
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_11.5rem_auto] md:items-end">
          <label className="block min-w-0">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Kata kunci</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SKUS, nama internal, no, jumlah varian…"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoComplete="off"
            />
          </label>
          <label className="block min-w-0">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Sumber tab</span>
            <select
              value={sourceTab}
              onChange={(e) => setSourceTab(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Semua tab</option>
              {sourceTabOptions.map((tab) => (
                <option key={tab} value={tab}>
                  {tab}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2 md:min-w-[12.5rem]">
            <span className="mb-1.5 hidden text-sm font-medium text-slate-700 md:block md:invisible" aria-hidden>
              Aksi
            </span>
            <div className="flex flex-wrap gap-2">
              {filterActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-10 shrink-0 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hapus filter
                </button>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={() => void load(true)}
                className="h-10 shrink-0 rounded-lg border border-slate-300 bg-slate-50 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {loading ? "Memuat…" : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <div className="max-h-[min(70vh,720px)] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading && rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Memuat REKAP SKUS…</p>
        ) : (
          <RekapSkusTable rows={filtered} highlightTokens={searchTokens} />
        )}
      </div>

      <p className="text-xs text-slate-500">
        Menampilkan <strong>{filtered.length}</strong> dari <strong>{rows.length}</strong> baris
        {filterActive ? " (hasil filter)" : ""} · cache server ±5 menit.
      </p>
    </div>
  );
}

function RekapSkusTable({
  rows,
  highlightTokens,
}: {
  rows: SkuMasterRekapSkusRow[];
  highlightTokens: string[];
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-slate-500">
        Tidak ada baris yang cocok. Coba kata kunci lain atau hapus filter.
      </p>
    );
  }
  return (
    <table className="min-w-full text-left text-sm">
      <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 shadow-sm">
        <tr>
          <th className="px-3 py-2.5 font-medium">No</th>
          <th className="px-3 py-2.5 font-medium">SKUS</th>
          <th className="px-3 py-2.5 font-medium">Nama internal</th>
          <th className="px-3 py-2.5 font-medium">Jumlah varian</th>
          <th className="px-3 py-2.5 font-medium">Sumber tab</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-800">
        {rows.map((r, index) => (
          <tr key={`${r.skus}-${r.sourceTab}-${index}`} className="hover:bg-slate-50/80">
            <td className="px-3 py-2 tabular-nums text-slate-500">
              {highlightParts(r.rowNo || String(index + 1), highlightTokens)}
            </td>
            <td className="px-3 py-2 font-mono text-xs">{highlightParts(r.skus, highlightTokens)}</td>
            <td className="px-3 py-2">{highlightParts(r.namaInternal, highlightTokens)}</td>
            <td className="px-3 py-2 tabular-nums">
              {highlightParts(String(r.variantCount || "—"), highlightTokens)}
            </td>
            <td className="px-3 py-2 text-slate-600">{highlightParts(r.sourceTab, highlightTokens)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}