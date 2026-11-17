"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OutboundSjDocument, OutboundSjLine } from "@/lib/outbound-sj/types";

export function OutboundSjMainVerifyPanel({ doc }: { doc: OutboundSjDocument }) {
  const router = useRouter();
  const [lines, setLines] = useState<OutboundSjLine[]>(() => doc.lines.map((l) => ({ ...l })));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function patchLine(index: number, patch: Partial<OutboundSjLine>) {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function postDecision(decision: "approve" | "revise") {
    setLoading(true);
    setMessage("");
    setError("");
    const payload = {
      decision,
      lines: lines.map((l, lineIndex) => ({
        lineIndex,
        unavailable: Boolean(l.unavailable),
        keterangan: l.keterangan,
      })),
    };
    const res = await fetch(`/api/outbound-sj/${doc.docId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal memproses.");
      return;
    }
    if (decision === "approve") {
      setMessage("Disetujui SKUL — gambar SKUL tersimpan di Drive dan spreadsheet diperbarui.");
    } else {
      setMessage(
        "Revisi dikirim ke gudang asal — gambar ber-coret tersimpan di Drive. Gudang bisa perbaiki data lalu kirim ulang verifikasi."
      );
    }
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Pengecekan gudang utama</h2>
      <p className="mt-1 text-xs text-slate-600">
        Bukan OCR foto — centang barang <strong>tidak tersedia</strong>, isi keterangan, lalu kirim revisi (gambar
        dicoret) atau setujui semua menjadi SKUL.
      </p>
      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Nama barang</th>
              <th className="px-2 py-2">Jumlah</th>
              <th className="px-2 py-2">Tidak tersedia</th>
              <th className="px-2 py-2">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, i) => (
              <tr key={i} className={line.unavailable ? "bg-red-50/60" : undefined}>
                <td className="px-2 py-2 text-slate-500">{i + 1}</td>
                <td className="px-2 py-2">{line.namaBarang || "—"}</td>
                <td className="px-2 py-2 whitespace-nowrap">{line.jumlah || "—"}</td>
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={Boolean(line.unavailable)}
                    onChange={(e) => patchLine(i, { unavailable: e.target.checked })}
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    className="w-full min-w-[12rem] rounded border border-slate-300 px-2 py-1 text-sm"
                    value={line.keterangan}
                    placeholder={line.unavailable ? "Wajib: alasan tidak tersedia" : "Opsional"}
                    onChange={(e) => patchLine(i, { keterangan: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void postDecision("approve")}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Setujui → SKUL
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void postDecision("revise")}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          Kirim revisi ke gudang
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-slate-700">{message}</p> : null}
    </section>
  );
}