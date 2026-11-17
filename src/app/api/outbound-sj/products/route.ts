import { jsonError, requireApiSession } from "@/lib/api/auth-context";
import { searchRekapSkulProducts } from "@/lib/outbound-sj/product-search";
import { hasPermission } from "@/lib/rbac/permissions";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession();
    if (!hasPermission(session.roles, "outbound_sj", "VIEW", session.allowedModules)) {
      return jsonError(new Error("FORBIDDEN"), 403);
    }
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const products = await searchRekapSkulProducts(q);
    return Response.json({ products });
  } catch (e) {
    return jsonError(e);
  }
}