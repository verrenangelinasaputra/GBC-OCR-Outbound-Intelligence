import { jsonError, requireApiSession } from "@/lib/api/auth-context";
import { uploadOutboundSkusSuratKeluarToDrive } from "@/lib/outbound-sj/drive-export";
import { getOutboundSjDocument, submitOutboundSjForVerification } from "@/lib/outbound-sj/sheet-store";
import { hasPermission } from "@/lib/rbac/permissions";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession();
    if (!hasPermission(session.roles, "outbound_sj", "SUBMIT", session.allowedModules)) {
      return jsonError(new Error("FORBIDDEN"), 403);
    }
    const { id } = await ctx.params;
    const existing = await getOutboundSjDocument(id);
    if (!existing) return jsonError(new Error("Dokumen tidak ditemukan."), 404);
    const drive = await uploadOutboundSkusSuratKeluarToDrive(existing);
    const doc = await submitOutboundSjForVerification(id, { skusDriveUrl: drive.fileUrl });
    return Response.json({ document: doc, drive });
  } catch (e) {
    return jsonError(e);
  }
}