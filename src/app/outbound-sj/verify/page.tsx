import { ModuleListPage } from "@/components/layout/module-list-page";
import { OutboundSjVerifyList } from "@/components/outbound-sj/outbound-sj-verify-list";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/rbac/permissions";
import { modulesForSession } from "@/lib/rbac/session-modules";
import { getPortalAudience } from "@/lib/portal/audience";

export default async function OutboundSjVerifyPage() {
  const audience = await getPortalAudience();
  const session = await getSession();
  const mods = modulesForSession(session, audience);
  const canView =
    session &&
    (hasPermission(session.roles, "outbound_sj", "APPROVE", mods) ||
      hasPermission(session.roles, "outbound_sj", "VIEW", mods));

  if (!canView) {
    return (
      <ModuleListPage title="Pengecekkan Gudang Utama" description="Verifikasi SKUS → SKUL.">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Anda tidak punya akses verifikasi gudang utama.
        </p>
      </ModuleListPage>
    );
  }

  return (
    <ModuleListPage
      title="Pengecekkan Gudang Utama"
      description="Antrian surat keluar SKUS menunggu disetujui dan dikonversi ke SKUL."
    >
      <OutboundSjVerifyList />
    </ModuleListPage>
  );
}