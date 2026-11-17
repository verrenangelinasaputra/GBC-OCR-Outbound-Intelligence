"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { OutboundSjDocument } from "@/lib/outbound-sj/types";

export function OutboundSjVerifyList() {
  const [docs, setDocs] = useState<OutboundSjDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/outbound-sj?scope=verify");
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal memuat.");
      return;
    }
    setDocs(data.documents ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      {loading && <p className="text-sm text-slate-500">Memuat antrian verifikasi…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && docs.length === 0 && (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Tidak ada SKUS menunggu verifikasi gudang utama.
        </p>
      )}
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {docs.map((doc) => (
          <li key={doc.docId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium text-slate-900">
                {doc.noSj} · {doc.kepada}
              </p>
              <p className="text-xs text-slate-500">
                {doc.gudang} · {doc.tanggal} · oleh {doc.createdBy}
              </p>
            </div>
            <Link href={`/outbound-sj/${doc.docId}`} className="text-sm font-medium text-blue-600 hover:underline">
              Buka & verifikasi →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}