import { jsonError, requireApiSession } from "@/lib/api/auth-context";
import {
  buildOutboundSuratKeluarDriveFileName,
  OUTBOUND_SURAT_KELUAR_DRAFT_IMAGE_NAME,
} from "@/lib/outbound-sj/drive-export";
import { getOutboundSjDocument } from "@/lib/outbound-sj/sheet-store";
import { renderOutboundSuratKeluarPng } from "@/lib/outbound-sj/render";
import { hasPermission } from "@/lib/rbac/permissions";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession();
    if (!hasPermission(session.roles, "outbound_sj", "VIEW", session.allowedModules)) {
      return jsonError(new Error("FORBIDDEN"), 403);
    }
    const { id } = await ctx.params;
    const doc = await getOutboundSjDocument(id);
    if (!doc) return jsonError(new Error("Dokumen tidak ditemukan."), 404);
    const png = await renderOutboundSuratKeluarPng(doc);
    const downloadName =
      doc.status === "SKUS_DRAFT"
        ? OUTBOUND_SURAT_KELUAR_DRAFT_IMAGE_NAME
        : buildOutboundSuratKeluarDriveFileName(doc);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `inline; filename="${downloadName.replace(/"/g, "")}"`,
      },
    });
  } catch (e) {
    return jsonError(e);
  }
}