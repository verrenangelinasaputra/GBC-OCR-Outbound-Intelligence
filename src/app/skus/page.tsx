import { ModuleListPage } from "@/components/layout/module-list-page";
import { SpreadsheetModePage, spreadsheetModeActive } from "@/components/layout/spreadsheet-mode-page";
import { PortalAudienceBanner } from "@/components/layout/portal-audience-banner";
import { RekapSkusCatalog } from "@/components/skus/rekap-skus-catalog";
import { getSession } from "@/lib/auth/session";
import {
  getSkuMasterSheetId,
  getSkuRekapSkusSpreadsheetEditUrl,
} from "@/lib/config/sku-mapping-sheets";
import { getPortalAudience } from "@/lib/portal/audience";
import { hasPermission } from "@/lib/rbac/permissions";
import { modulesForSession } from "@/lib/rbac/session-modules";

export default async function SkusCatalogPage() {
  const audience = await getPortalAudience();

  if (!spreadsheetModeActive()) {
    return <SpreadsheetModePage title="Rekap Barang Keluar" />;
  }

  const session = await getSession();
  const accessMods = modulesForSession(session, audience);
  const canViewSkuMapping = session
    ? hasPermission(session.roles, "sku_mapping", "VIEW", accessMods)
    : false;
  const canViewMaster = session
    ? hasPermission(session.roles, "master_mapping", "VIEW", accessMods)
    : false;

  if (!canViewSkuMapping && !canViewMaster) {
    return (
      <ModuleListPage
        title="Rekap Barang Keluar"
        description="Tabel SKUS dari spreadsheet generator master."
      >
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Anda tidak punya akses halaman <strong>Rekap Barang Keluar</strong>. Minta admin mengaktifkan modul ini di
          spreadsheet Users (kolom allowed modules).
        </p>
      </ModuleListPage>
    );
  }

  return (
    <ModuleListPage
      title="Rekap Barang Keluar"
      description="Tabel SKUS (tab REKAP SKUS) — read-only."
    >
      <PortalAudienceBanner audience={audience} />
      <p className="mb-4 text-sm text-slate-600">
        Sumber data: tab <strong>REKAP SKUS</strong> di{" "}
        <a
          href={getSkuRekapSkusSpreadsheetEditUrl()}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          spreadsheet master SKU
        </a>{" "}
        (<code className="text-xs">{getSkuMasterSheetId()}</code>). Service account perlu akses{" "}
        <strong>Editor</strong>.
      </p>
      <RekapSkusCatalog />
    </ModuleListPage>
  );
}