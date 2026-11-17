"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { OutboundSjLine } from "@/lib/outbound-sj/types";
import { SUPPLIER_GUDANG_WAREHOUSE_OPTIONS } from "@/lib/config/supplier-gudang";

const emptyLine = (): OutboundSjLine => ({
  banyaknya: "",
  isi: "",
  namaBarang: "",
  jumlah: "",
  keterangan: "",
  skuLengkap: "",
  skus: "",
});

type ProductHit = {
  skuLengkap: string;
  namaProdukAcuan: string;
  namaInternalAccurate: string;
  skus: string;
};

export function OutboundSjForm() {
  const router = useRouter();
  const [gudang, setGudang] = useState<string>(SUPPLIER_GUDANG_WAREHOUSE_OPTIONS[0] ?? "");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [noSj, setNoSj] = useState("");
  const [noPo, setNoPo] = useState("");
  const [noKend, setNoKend] = useState("");
  const [kepada, setKepada] = useState("");
  const [alamat, setAlamat] = useState("");
  const [lines, setLines] = useState<OutboundSjLine[]>([emptyLine()]);
  const [productQuery, setProductQuery] = useState("");
  const [productHits, setProductHits] = useState<ProductHit[]>([]);
  const [activeLine, setActiveLine] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchProducts = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setProductHits([]);
      return;
    }
    const res = await fetch(`/api/outbound-sj/products?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (res.ok) setProductHits(data.products ?? []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void searchProducts(productQuery), 300);
    return () => clearTimeout(t);
  }, [productQuery, searchProducts]);

  function applyProduct(hit: ProductHit) {
    setLines((prev) => {
      const next = [...prev];
      const line = { ...next[activeLine] };
      line.namaBarang = hit.namaProdukAcuan || hit.namaInternalAccurate;
      line.skuLengkap = hit.skuLengkap;
      line.skus = hit.skus;
      next[activeLine] = line;
      return next;
    });
    setProductHits([]);
    setProductQuery("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/outbound-sj", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gudang, tanggal, noSj, noPo, noKend, kepada, alamat, lines }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Gagal menyimpan.");
      return;
    }
    const id = data.document?.docId;
    if (id) router.push(`/outbound-sj/${id}`);
    else router.refresh();
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <Field label="Gudang">
          <select className={inputClass} value={gudang} onChange={(e) => setGudang(e.target.value)} required>
            {SUPPLIER_GUDANG_WAREHOUSE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tanggal">
          <input type="date" className={inputClass} value={tanggal} onChange={(e) => setTanggal(e.target.value)} required />
        </Field>
        <Field label="No. Surat Jalan">
          <input className={inputClass} value={noSj} onChange={(e) => setNoSj(e.target.value)} required />
        </Field>
        <Field label="No. PO">
          <input className={inputClass} value={noPo} onChange={(e) => setNoPo(e.target.value)} />
        </Field>
        <Field label="No. Kendaraan">
          <input className={inputClass} value={noKend} onChange={(e) => setNoKend(e.target.value)} />
        </Field>
        <Field label="Kepada Yth">
          <input className={inputClass} value={kepada} onChange={(e) => setKepada(e.target.value)} required />
        </Field>
        <Field label="Alamat" className="sm:col-span-2">
          <textarea className={inputClass} rows={2} value={alamat} onChange={(e) => setAlamat(e.target.value)} />
        </Field>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Cari produk (REKAP SKUL)</p>
        <input
          className={`${inputClass} bg-white`}
          placeholder="Ketik nama barang customer / SKU…"
          value={productQuery}
          onChange={(e) => setProductQuery(e.target.value)}
        />
        {productHits.length > 0 && (
          <ul className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white text-sm shadow-sm">
            {productHits.map((hit) => (
              <li key={hit.skuLengkap}>
                <button
                  type="button"
                  className="w-full border-b border-slate-100 px-3 py-2 text-left hover:bg-blue-50"
                  onClick={() => applyProduct(hit)}
                >
                  <span className="font-medium">{hit.namaProdukAcuan}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {hit.skuLengkap} · SKUS {hit.skus}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Baris barang</h2>
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setLines((l) => [...l, emptyLine()])}
          >
            + Tambah baris
          </button>
        </div>
        {lines.map((line, index) => (
          <div
            key={index}
            className={`grid gap-2 rounded-lg border p-3 sm:grid-cols-6 ${
              activeLine === index ? "border-blue-400 bg-blue-50/40" : "border-slate-200 bg-white"
            }`}
            onFocus={() => setActiveLine(index)}
          >
            <MiniField label="Banyaknya" value={line.banyaknya} onChange={(v) => patchLine(index, "banyaknya", v)} />
            <MiniField label="Isi" value={line.isi} onChange={(v) => patchLine(index, "isi", v)} />
            <MiniField
              label="Nama barang"
              value={line.namaBarang}
              onChange={(v) => patchLine(index, "namaBarang", v)}
              className="sm:col-span-2"
            />
            <MiniField label="Jumlah" value={line.jumlah} onChange={(v) => patchLine(index, "jumlah", v)} />
            <MiniField label="Keterangan" value={line.keterangan} onChange={(v) => patchLine(index, "keterangan", v)} />
          </div>
        ))}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Simpan draft SKUS"}
      </button>
    </form>
  );

  function patchLine(index: number, key: keyof OutboundSjLine, value: string) {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  }
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm text-slate-700 ${className}`}>
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function MiniField({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-xs text-slate-600 ${className}`}>
      {label}
      <input
        className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}