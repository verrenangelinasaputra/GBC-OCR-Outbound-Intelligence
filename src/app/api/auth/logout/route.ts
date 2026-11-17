import { clearSessionCookie, getSession } from "@/lib/auth/session";
import { isSheetOnlyMode } from "@/lib/config/app-mode";
import { writeAuditLog } from "@/lib/services/audit";
import { SUPPLIER_PORTAL_ENABLED } from "@/lib/config/product";
import { redirect } from "next/navigation";

export async function POST() {
  const session = await getSession();
  const sheetOnly = isSheetOnlyMode();
  const supplier = session?.roles.includes("SUPPLIER_USER") && !session.roles.includes("SUPER_ADMIN");
  if (session && !sheetOnly && !session.userId.startsWith("wa:")) {
    await writeAuditLog({
      actorId: session.userId,
      action: "auth.logout",
      entityType: "User",
      entityId: session.userId,
    });
  }
  await clearSessionCookie();
  const supplierLogout =
    SUPPLIER_PORTAL_ENABLED && supplier && sheetOnly;
  redirect(supplierLogout ? "/supplier/login" : "/login");
}
