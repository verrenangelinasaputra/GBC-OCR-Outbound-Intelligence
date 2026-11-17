import { jsonError, requireApiSession } from "@/lib/api/auth-context";
import { getOutboundSjDocument } from "@/lib/outbound-sj/sheet-store";
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
    return Response.json({ document: doc });
  } catch (e) {
    return jsonError(e);
  }
}