import { jsonError, requireApiSession } from "@/lib/api/auth-context";
import { submitOutboundSjForVerification } from "@/lib/outbound-sj/sheet-store";
import { hasPermission } from "@/lib/rbac/permissions";

export async function POST(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiSession();
    if (!hasPermission(session.roles, "outbound_sj", "SUBMIT", session.allowedModules)) {
      return jsonError(new Error("FORBIDDEN"), 403);
    }
    const { id } = await ctx.params;
    const doc = await submitOutboundSjForVerification(id);
    return Response.json({ document: doc });
  } catch (e) {
    return jsonError(e);
  }
}