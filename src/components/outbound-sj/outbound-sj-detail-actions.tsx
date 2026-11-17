"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OutboundSjDocument } from "@/lib/outbound-sj/types";

export function OutboundSjDetailActions({ doc }: { doc: OutboundSjDocument }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitVerification() {
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/outbound-sj/${doc.docId}/submit`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Gagal mengirim.");
      return;
    }
    setMessage("Dikirim ke Pengecekkan Gudang Utama.");
    router.refresh();
  }

  async function approveSkul() {
    setLoading(true);
    setMessage("");
    const res = await fetch(`/api/outbound-sj/${doc.docId}/verify`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Gagal verifikasi.");
      return;
    }
    setMessage("Disetujui — status SKUL.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {doc.status === "SKUS_DRAFT" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void submitVerification()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Kirim ke verifikasi gudang utama
        </button>
      )}
      {doc.status === "SKUS_SUBMITTED" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => void approveSkul()}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Setujui → konversi SKUL
        </button>
      )}
      <a
        href={`/api/outbound-sj/${doc.docId}/image`}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Unduh / lihat gambar SJ
      </a>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}