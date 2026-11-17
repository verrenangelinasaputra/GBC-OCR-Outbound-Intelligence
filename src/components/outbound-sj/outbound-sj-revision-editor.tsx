"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OutboundSjDocument, OutboundSjLine } from "@/lib/outbound-sj/types";

export function OutboundSjRevisionEditor({ doc }: { doc: OutboundSjDocument }) {
  const router = useRouter();
  const [lines, setLines] = useState<OutboundSjLine[]>(() => doc.lines.map((l) => ({ ...l, unavailable: false })));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function patchLine(index: number, patch: Partial<OutboundSjLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function saveAndResubmit() {
    setLoading(true);
    setMessage("");
    setError("");
    const patchRes = await fetch(`/api/outbound-sj/${doc.docId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines }),
    });
    const patchData = await patchRes.json();
    if (!patchRes.ok) {
      setLoading(false);
      setError(patchData.error ?? "Gagal menyimpan perubahan.");
      return;
    }
    const submitRes = await fetch(`/api/outbound-sj/${doc.docId}/submit`, { method: "POST" });
    const submitData = await submitRes.json();
    setLoading(false);
    if (!submitRes.ok) {
      setError(submitData.error ?? "Gagal kirim ulang.");
      return;
    }
    setMessage("Perubahan disimpan dan dikirim ulang ke verifikasi gudang utama.");
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
      <h2 className="text-sm font-semibold text-amber-950">Revisi dari gudang utama</h2>
      <p className="mt-1 text-xs text-amber-900/90">
        Sesuaikan barang/jumlah sesuai catatan revisi, lalu kirim ulang. Gambar SKUS baru akan dibuat saat kirim.
      </p>
      {doc.revisionDriveUrl ? (
        <a
          href={doc.revisionDriveUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm text-blue-700 hover:underline"
        >
          Lihat gambar revisi (coret) di Drive
        </a>
      ) : null}
      <ul className="mt-3 space-y-3">
        {lines.map((line, i) => (
          <li key={i} className="rounded-lg border border-amber-100 bg-white p-3 text-sm">
            <p className="font-medium text-slate-900">{line.namaBarang || `Baris ${i + 1}`}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="block text-xs text-slate-600">
                Jumlah
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                  value={line.jumlah}
                  onChange={(e) => patchLine(i, { jumlah: e.target.value })}
                />
              </label>
              <label className="block text-xs text-slate-600">
                Keterangan
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1"
                  value={line.keterangan}
                  onChange={(e) => patchLine(i, { keterangan: e.target.value })}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={loading}
        onClick={() => void saveAndResubmit()}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Simpan & kirim ulang verifikasi
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}