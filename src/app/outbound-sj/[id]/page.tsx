import { ModuleListPage } from "@/components/layout/module-list-page";
import { OutboundSjDetailActions } from "@/components/outbound-sj/outbound-sj-detail-actions";
import { getSession } from "@/lib/auth/session";
import { getOutboundSjDocument } from "@/lib/outbound-sj/sheet-store";
import { hasPermission } from "@/lib/rbac/permissions";
import { modulesForSession } from "@/lib/rbac/session-modules";
import { getPortalAudience } from "@/lib/portal/audience";
import { notFound } from "next/navigation";

const STATUS_LABEL: Record<string, string> = {
  SKUS_DRAFT: "SKUS (draft)",
  SKUS_SUBMITTED: "SKUS menunggu verifikasi",
  SKUL: "SKUL (disetujui)",
};

export default async function OutboundSjDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const audience = await getPortalAudience();
  const session = await getSession();
  const mods = modulesForSession(session, audience);
  if (!session || !hasPermission(session.roles, "outbound_sj", "VIEW", mods)) {
    return (
      <ModuleListPage title="Surat Keluar" description="">
        <p className="text-sm text-amber-800">Tidak punya akses.</p>
      </ModuleListPage>
    );
  }

  const doc = await getOutboundSjDocument(id);
  if (!doc) notFound();

  return (
    <ModuleListPage title={`Surat Keluar ${doc.noSj}`} description={STATUS_LABEL[doc.status] ?? doc.status}>
      <div className="space-y-4">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Gudang</dt>
            <dd className="font-medium">{doc.gudang}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Tanggal</dt>
            <dd className="font-medium">{doc.tanggal}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Penerima</dt>
            <dd className="font-medium">{doc.kepada}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Dibuat oleh</dt>
            <dd className="font-medium">{doc.createdBy}</dd>
          </div>
          {doc.skusDriveUrl ? (
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Drive (SKUS)</dt>
              <dd>
                <a href={doc.skusDriveUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                  Buka folder / file di Google Drive
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
        <OutboundSjDetailActions doc={doc} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/outbound-sj/${doc.docId}/image`}
          alt={`Preview surat keluar ${doc.noSj}`}
          className="max-w-full rounded-xl border border-slate-200 shadow-sm"
        />
      </div>
    </ModuleListPage>
  );
}