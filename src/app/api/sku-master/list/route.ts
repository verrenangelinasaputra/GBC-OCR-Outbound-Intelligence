import { jsonError, requireApiSession } from "@/lib/api/auth-context";
import { hasPermission } from "@/lib/rbac/permissions";
import { skuMasterApiEnabled } from "@/lib/sku-master/api-enabled";
import { SHEET_QUOTA_USER_MESSAGE } from "@/lib/google-sheets/sheet-values";
import {
  listSkuMasterRekapSkulRows,
  listSkuMasterRekapSkusRows,
  listSkuMasterTableRows,
} from "@/lib/services/sku-master-sheet";

export async function GET(request: Request) {
  if (!skuMasterApiEnabled()) return jsonError(new Error("Mode spreadsheet tidak aktif"), 404);
  try {
    const session = await requireApiSession();
    const url = new URL(request.url);
    const view = String(url.searchParams.get("view") ?? "table").trim();

    const canMaster = hasPermission(session.roles, "master_mapping", "VIEW", session.allowedModules);
    const canSkuMapping = hasPermission(session.roles, "sku_mapping", "VIEW", session.allowedModules);
    const canRekapSkusOnly = view === "rekap-skus" && (canMaster || canSkuMapping);

    if (view === "rekap-skus") {
      if (!canRekapSkusOnly) {
        return jsonError(new Error("FORBIDDEN"), 403);
      }
    } else if (!canMaster) {
      return jsonError(new Error("FORBIDDEN"), 403);
    }
    const categoryTab = String(url.searchParams.get("tab") ?? "").trim();
    const force = url.searchParams.get("refresh") === "1";

    if (view === "rekap-skul") {
      const rows = await listSkuMasterRekapSkulRows(force);
      return Response.json({ view, rows });
    }

    if (view === "rekap-skus") {
      const rows = await listSkuMasterRekapSkusRows(force);
      return Response.json({ view, rows });
    }

    if (!categoryTab) {
      return jsonError(new Error("Parameter tab wajib untuk view=table"), 400);
    }

    const rows = await listSkuMasterTableRows(categoryTab, force);
    return Response.json({ view: "table", categoryTab, rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown";
    if (message === SHEET_QUOTA_USER_MESSAGE) {
      return Response.json({ error: message }, { status: 429 });
    }
    return jsonError(e);
  }
}