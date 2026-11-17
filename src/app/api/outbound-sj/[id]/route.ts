import { jsonError, requireApiSession } from "@/lib/api/auth-context";
import { getOutboundSjDocument, updateOutboundSjDocumentContent } from "@/lib/outbound-sj/sheet-store";
import type { OutboundSjLine } from "@/lib/outbound-sj/types";
import { hasPermission } from "@/lib/rbac/permissions";

function parseLines(raw: unknown): OutboundSjLine[] | undefined {
  if (!Array.isArray(raw)) return undefined;
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
      unavailable: Boolean(o.unavailable),
    };
  });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession();
    if (!hasPermission(session.roles, "outbound_sj", "EDIT", session.allowedModules)) {
      return jsonError(new Error("FORBIDDEN"), 403);
    }
    const { id } = await ctx.params;
    const doc = await getOutboundSjDocument(id);
    if (!doc) return jsonError(new Error("Dokumen tidak ditemukan."), 404);
    if (doc.status === "SKUS_REVISION_REQUESTED" && doc.createdBy !== session.username) {
      if (!session.roles.includes("SUPER_ADMIN")) {
        return jsonError(new Error("Hanya pembuat dokumen yang boleh mengedit revisi."), 403);
      }
    }
    const body = await request.json();
    const lines = parseLines(body.lines);
    const updated = await updateOutboundSjDocumentContent(id, {
      lines,
      kepada: body.kepada !== undefined ? String(body.kepada) : undefined,
      alamat: body.alamat !== undefined ? String(body.alamat) : undefined,
    });
    return Response.json({ document: updated });
  } catch (e) {
    return jsonError(e);
  }
}