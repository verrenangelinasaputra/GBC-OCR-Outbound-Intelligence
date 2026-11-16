"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SkuMasterRekapSkusRow } from "@/lib/sku-master/types";

export function RekapSkusCatalog() {
  const [rows, setRows] = useState<SkuMasterRekapSkusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.skus.toLowerCase().includes(q) ||
        r.namaInternal.toLowerCase().includes(q) ||
        r.sourceTab.toLowerCase().includes(q)
    );
  }, [query, rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari SKUS, nama internal, atau sumber…"
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void load(true)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? "Memuat…" : "Refresh dari spreadsheet"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading && rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Memuat REKAP SKUS…</p>
        ) : (
          <RekapSkusTable rows={filtered} />
        )}
      </div>

      <p className="text-xs text-slate-500">
        Menampilkan {filtered.length} dari {rows.length} baris (cache server ±5 menit).
      </p>
    </div>
  );
}

function RekapSkusTable({ rows }: { rows: SkuMasterRekapSkusRow[] }) {
  if (rows.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-slate-500">REKAP SKUS kosong atau tidak cocok filter.</p>;
  }
  return (
    <table className="min-w-full text-left text-sm">
      <thead className="bg-slate-50 text-slate-600">
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
            <td className="px-3 py-2 tabular-nums text-slate-500">{r.rowNo || index + 1}</td>
            <td className="px-3 py-2 font-mono text-xs">{r.skus}</td>
            <td className="px-3 py-2">{r.namaInternal || "—"}</td>
            <td className="px-3 py-2 tabular-nums">{r.variantCount || "—"}</td>
            <td className="px-3 py-2 text-slate-600">{r.sourceTab || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}