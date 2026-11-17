import { ModuleListPage } from "@/components/layout/module-list-page";
import { OutboundSjForm } from "@/components/outbound-sj/outbound-sj-form";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/rbac/permissions";
import { modulesForSession } from "@/lib/rbac/session-modules";
import { getPortalAudience } from "@/lib/portal/audience";
import { getOutboundSjSpreadsheetEditUrl } from "@/lib/config/outbound-sj-sheet";

export default async function OutboundSjNewPage() {
  const audience = await getPortalAudience();
  const session = await getSession();
  const mods = modulesForSession(session, audience);
  const canCreate = session && hasPermission(session.roles, "outbound_sj", "CREATE", mods);

  if (!canCreate) {
    return (
      <ModuleListPage title="Buat Surat Keluar (SKUS)" description="Draft surat keluar untuk customer.">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Anda tidak punya akses modul surat keluar.
        </p>
      </ModuleListPage>
    );
  }

  return (
    <ModuleListPage
      title="Buat Surat Keluar (SKUS)"
      description="Cari produk dari REKAP SKUL, isi seperti Surat Jalan, simpan sebagai SKUS."
    >
      <p className="mb-4 text-sm text-slate-600">
        Data draft tersimpan di tab <strong>Outbound Surat Keluar</strong> pada{" "}
        <a href={getOutboundSjSpreadsheetEditUrl()} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
          spreadsheet outbound GBC
        </a>
        .
      </p>
      <OutboundSjForm />
    </ModuleListPage>
  );
}