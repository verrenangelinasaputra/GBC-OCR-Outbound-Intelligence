import "server-only";

import { getOutboundSuratKeluarDriveRootId } from "@/lib/config/outbound-surat-keluar-drive";
import { getOutboundSjSpreadsheetId, getOutboundSjTabName } from "@/lib/config/outbound-sj-sheet";
import { SUPPLIER_CUSTOMER_DESTINATION, SUPPLIER_GUDANG_WAREHOUSE_OPTIONS } from "@/lib/config/supplier-gudang";
import type { GoogleExportConfig } from "@/lib/providers/google-workspace/config";
import { loadServiceAccountCredentials } from "@/lib/providers/google-workspace/config";
import { uploadSuratJalanToGudangDrive } from "@/lib/providers/google-workspace/client";
import { renderOutboundSuratKeluarPng } from "@/lib/outbound-sj/render";
import type { OutboundSjDocument } from "@/lib/outbound-sj/types";

function normalizeTanggalIso(tanggal: string): string {
  const t = tanggal.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const slash = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (slash) {
    const d = slash[1].padStart(2, "0");
    const m = slash[2].padStart(2, "0");
    return `${slash[3]}-${m}-${d}`;
  }
  return t.replace(/\//g, "-");
}

function sanitizeFileToken(value: string): string {
  return value.trim().replace(/[/\\?%*:|"<>]/g, "_") || "UNKNOWN";
}

/** Folder di dalam gudang: `[2026-11-17] - 1234` */
export function buildOutboundSuratKeluarDriveSubfolderName(doc: OutboundSjDocument): string {
  const dateLabel = normalizeTanggalIso(doc.tanggal);
  const noSj = sanitizeFileToken(doc.noSj || "UNKNOWN");
  return `${dateLabel} - ${noSj}`;
}

/** File di Drive setelah kirim verifikasi: `SK_2026-11-17_1234_Gudang Karanggan.png` */
export function buildOutboundSuratKeluarDriveFileName(doc: OutboundSjDocument): string {
  const dateLabel = normalizeTanggalIso(doc.tanggal);
  const noSj = sanitizeFileToken(doc.noSj || "UNKNOWN");
  const gudang = (doc.gudang || "Gudang").trim();
  return `SK_${dateLabel}_${noSj}_${gudang}.png`;
}

/** Nama unduh/preview saat masih draft. */
export const OUTBOUND_SURAT_KELUAR_DRAFT_IMAGE_NAME = "Surat Keluar.png";

function getOutboundDriveExportConfig(): GoogleExportConfig {
  const creds = loadServiceAccountCredentials();
  if (!creds) {
    throw new Error(
      "Service account Google belum diatur (GOOGLE_SERVICE_ACCOUNT_JSON). Diperlukan untuk simpan gambar ke Drive."
    );
  }
  return {
    enabled: true,
    driveFolderId: getOutboundSuratKeluarDriveRootId(),
    sheetId: getOutboundSjSpreadsheetId(),
    sheetTab: getOutboundSjTabName(),
    credentials: creds,
  };
}

function assertWarehouseGudang(gudang: string): void {
  const g = gudang.trim();
  if (!g || g === SUPPLIER_CUSTOMER_DESTINATION) {
    throw new Error("Pilih gudang tujuan yang valid (bukan Customer) sebelum kirim ke verifikasi.");
  }
  if (!SUPPLIER_GUDANG_WAREHOUSE_OPTIONS.includes(g as (typeof SUPPLIER_GUDANG_WAREHOUSE_OPTIONS)[number])) {
    throw new Error(`Gudang "${g}" tidak dikenali. Sesuaikan dengan folder Drive di dalam folder root outbound.`);
  }
}

async function uploadOutboundPngToGudangDrive(
  doc: OutboundSjDocument,
  buffer: Buffer,
  fileName: string
): Promise<{ fileId: string; fileUrl: string; fileName: string }> {
  assertWarehouseGudang(doc.gudang);
  const config = getOutboundDriveExportConfig();
  const subfolderName = buildOutboundSuratKeluarDriveSubfolderName(doc);
  const rootId = getOutboundSuratKeluarDriveRootId();
  const uploaded = await uploadSuratJalanToGudangDrive({
    config,
    buffer,
    fileName,
    mimeType: "image/png",
    gudang: doc.gudang.trim(),
    subfolderName,
    rootFolderId: rootId,
  });
  return { ...uploaded, fileName };
}

export async function uploadOutboundSkusSuratKeluarToDrive(
  doc: OutboundSjDocument
): Promise<{ fileId: string; fileUrl: string; fileName: string }> {
  const buffer = await renderOutboundSuratKeluarPng(doc);
  const fileName = buildOutboundSuratKeluarDriveFileName(doc);
  return uploadOutboundPngToGudangDrive(doc, buffer, fileName);
}

export function buildOutboundSkulDriveFileName(doc: OutboundSjDocument): string {
  const dateLabel = normalizeTanggalIso(doc.tanggal);
  const noSj = sanitizeFileToken(doc.noSj || "UNKNOWN");
  const gudang = (doc.gudang || "Gudang").trim();
  return `SKUL_${dateLabel}_${noSj}_${gudang}.png`;
}

export function buildOutboundRevisionDriveFileName(doc: OutboundSjDocument, sequence: number): string {
  const dateLabel = normalizeTanggalIso(doc.tanggal);
  const noSj = sanitizeFileToken(doc.noSj || "UNKNOWN");
  const gudang = (doc.gudang || "Gudang").trim();
  const n = Math.max(1, sequence);
  return `SK_REV${n}_${dateLabel}_${noSj}_${gudang}.png`;
}

export async function uploadOutboundSkulSuratKeluarToDrive(
  doc: OutboundSjDocument
): Promise<{ fileId: string; fileUrl: string; fileName: string }> {
  const skulDoc = { ...doc, status: "SKUL" as const };
  const buffer = await renderOutboundSuratKeluarPng(skulDoc);
  const fileName = buildOutboundSkulDriveFileName(doc);
  return uploadOutboundPngToGudangDrive(doc, buffer, fileName);
}

export async function uploadOutboundRevisionSuratKeluarToDrive(
  doc: OutboundSjDocument,
  sequence: number
): Promise<{ fileId: string; fileUrl: string; fileName: string }> {
  const buffer = await renderOutboundSuratKeluarPng(doc, { revisionSequence: sequence });
  const fileName = buildOutboundRevisionDriveFileName(doc, sequence);
  return uploadOutboundPngToGudangDrive(doc, buffer, fileName);
}