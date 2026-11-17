import { jsonError, requireApiSession } from "@/lib/api/auth-context";
import { createOutboundSjDocument, listOutboundSjDocuments } from "@/lib/outbound-sj/sheet-store";
import type { OutboundSjCreateInput, OutboundSjLine } from "@/lib/outbound-sj/types";
import { hasPermission } from "@/lib/rbac/permissions";

function parseLines(raw: unknown): OutboundSjLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = item as Record<string, unknown>;
    return {
      banyaknya: String(o.banyaknya ?? ""),
      isi: String(o.isi ?? ""),
      namaBarang: String(o.namaBarang ?? ""),
      jumlah: String(o.jumlah ?? ""),
      keterangan: String(o.keterangan ?? ""),
      skuLengkap: String(o.skuLengkap ?? ""),
      skus: String(o.skus ?? ""),
    };
  });
}

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    if (!hasPermission(session.roles, "outbound_sj", "VIEW", session.allowedModules)) {
      return jsonError(new Error("FORBIDDEN"), 403);
    }
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") ?? "mine";
    let docs = await listOutboundSjDocuments();
    if (scope === "verify") {
      docs = docs.filter((d) => d.status === "SKUS_SUBMITTED");
    } else if (scope === "mine") {
      docs = docs.filter((d) => d.createdBy === session.username);
    }
    return Response.json({ documents: docs });
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireApiSession();
    if (!hasPermission(session.roles, "outbound_sj", "CREATE", session.allowedModules)) {
      return jsonError(new Error("FORBIDDEN"), 403);
    }
    const body = await request.json();
    const input: OutboundSjCreateInput = {
      gudang: String(body.gudang ?? "").trim(),
      tanggal: String(body.tanggal ?? "").trim(),
      noSj: String(body.noSj ?? "").trim(),
      noPo: String(body.noPo ?? "").trim(),
      noKend: String(body.noKend ?? "").trim(),
      kepada: String(body.kepada ?? "").trim(),
      alamat: String(body.alamat ?? "").trim(),
      lines: parseLines(body.lines),
    };
    if (!input.gudang || !input.tanggal || !input.noSj || !input.kepada) {
      return jsonError(new Error("Gudang, tanggal, nomor SJ, dan penerima wajib diisi."), 400);
    }
    if (!input.lines.length) {
      return jsonError(new Error("Minimal satu baris barang."), 400);
    }
    const doc = await createOutboundSjDocument(input, session.username);
    return Response.json({ document: doc });
  } catch (e) {
    return jsonError(e);
  }
}