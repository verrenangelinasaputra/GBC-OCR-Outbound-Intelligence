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
    return <SpreadsheetModePage title="Katalog SKUS" />;
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
        title="Katalog SKUS"
        description="Daftar keluarga SKUS dari tab REKAP SKUS (generator master)."
      >
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Anda tidak punya akses. Minta admin mencentang modul <strong>Product SKU Mapping</strong> atau{" "}
          <strong>Generator SKU</strong> di User &amp; Role Management.
        </p>
      </ModuleListPage>
    );
  }

  return (
    <ModuleListPage
      title="Katalog SKUS"
      description="Read-only — tab REKAP SKUS pada generator master SKU GBC."
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