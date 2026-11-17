import "server-only";

import { randomUUID } from "node:crypto";
import { google } from "googleapis";
import { getOutboundSjSpreadsheetId, getOutboundSjTabName } from "@/lib/config/outbound-sj-sheet";
import { mapSheetApiError } from "@/lib/google-sheets/sheet-values";
import { createGoogleSheetsAuthClient } from "@/lib/providers/google-workspace/client";
import { getGoogleExportConfigOptional } from "@/lib/providers/google-workspace/config";
import { googleConfigForSpreadsheet } from "@/lib/services/sku-rekap-catalog";
import type {
  OutboundSjCreateInput,
  OutboundSjDocument,
  OutboundSjLinePatch,
  OutboundSjStatus,
} from "@/lib/outbound-sj/types";

const HEADERS = [
  "doc_id",
  "status",
  "created_at",
  "created_by",
  "verified_at",
  "verified_by",
  "gudang",
  "tanggal",
  "no_sj",
  "no_po",
  "no_kend",
  "kepada",
  "alamat",
  "lines_json",
  "skus_drive_url",
  "skul_drive_url",
  "revision_drive_url",
  "revision_count",
] as const;

const COL_RANGE = "A:R";

function quoteTab(tab: string): string {
  return `'${tab.replace(/'/g, "''")}'`;
}

async function sheetsClient() {
  const base = getGoogleExportConfigOptional();
  const sheetId = getOutboundSjSpreadsheetId();
  const cfg = googleConfigForSpreadsheet(sheetId) ?? base;
  if (!cfg) {
    throw new Error("Google export belum dikonfigurasi (service account + sheet).");
  }
  return {
    sheets: google.sheets({ version: "v4", auth: createGoogleSheetsAuthClient(cfg) }),
    sheetId,
    tab: getOutboundSjTabName(),
  };
}

async function ensureTab(sheets: ReturnType<typeof google.sheets>, sheetId: string, tab: string) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId, fields: "sheets.properties.title" });
  if (!meta.data.sheets?.some((s) => s.properties?.title === tab)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
    });
  }
  const head = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${quoteTab(tab)}!A1:${String.fromCharCode("A".charCodeAt(0) + HEADERS.length - 1)}1`,
  });
  const first = String(head.data.values?.[0]?.[0] ?? "").trim().toLowerCase();
  if (first !== "doc_id") {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${quoteTab(tab)}!A1:${String.fromCharCode("A".charCodeAt(0) + HEADERS.length - 1)}1`,
      valueInputOption: "RAW",
      requestBody: { values: [Array.from(HEADERS)] },
    });
    return;
  }
  const headerRow = head.data.values?.[0] ?? [];
  const headers = Array.from(HEADERS);
  for (let i = 0; i < headers.length; i += 1) {
    const want = headers[i]!.toLowerCase();
    if (String(headerRow[i] ?? "").trim().toLowerCase() === want) continue;
    const col = String.fromCharCode("A".charCodeAt(0) + i);
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${quoteTab(tab)}!${col}1`,
      valueInputOption: "RAW",
      requestBody: { values: [[headers[i]]] },
    });
  }
}

function parseRow(rowNumber: number, row: string[]): OutboundSjDocument | null {
  const docId = String(row[0] ?? "").trim();
  if (!docId) return null;
  let lines: OutboundSjDocument["lines"] = [];
  try {
    lines = JSON.parse(String(row[13] ?? "[]")) as OutboundSjDocument["lines"];
  } catch {
    lines = [];
  }
  return {
    rowNumber,
    docId,
    status: (String(row[1] ?? "SKUS_DRAFT").trim() as OutboundSjStatus) || "SKUS_DRAFT",
    createdAt: String(row[2] ?? ""),
    createdBy: String(row[3] ?? ""),
    verifiedAt: String(row[4] ?? ""),
    verifiedBy: String(row[5] ?? ""),
    gudang: String(row[6] ?? ""),
    tanggal: String(row[7] ?? ""),
    noSj: String(row[8] ?? ""),
    noPo: String(row[9] ?? ""),
    noKend: String(row[10] ?? ""),
    kepada: String(row[11] ?? ""),
    alamat: String(row[12] ?? ""),
    lines,
    skusDriveUrl: String(row[14] ?? "").trim(),
    skulDriveUrl: String(row[15] ?? "").trim(),
    revisionDriveUrl: String(row[16] ?? "").trim(),
    revisionCount: Number.parseInt(String(row[17] ?? "0"), 10) || 0,
  };
}

function toValues(doc: OutboundSjDocument): string[] {
  return [
    doc.docId,
    doc.status,
    doc.createdAt,
    doc.createdBy,
    doc.verifiedAt,
    doc.verifiedBy,
    doc.gudang,
    doc.tanggal,
    doc.noSj,
    doc.noPo,
    doc.noKend,
    doc.kepada,
    doc.alamat,
    JSON.stringify(doc.lines),
    doc.skusDriveUrl ?? "",
    doc.skulDriveUrl ?? "",
    doc.revisionDriveUrl ?? "",
    String(doc.revisionCount ?? 0),
  ];
}

export async function listOutboundSjDocuments(filter?: {
  status?: OutboundSjStatus | OutboundSjStatus[];
}): Promise<OutboundSjDocument[]> {
  try {
    const { sheets, sheetId, tab } = await sheetsClient();
    await ensureTab(sheets, sheetId, tab);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${quoteTab(tab)}!A2:R`,
    });
    const rows = res.data.values ?? [];
    const statuses = filter?.status
      ? Array.isArray(filter.status)
        ? filter.status
        : [filter.status]
      : null;
    const out: OutboundSjDocument[] = [];
    for (let i = 0; i < rows.length; i += 1) {
      const parsed = parseRow(i + 2, rows[i] ?? []);
      if (!parsed) continue;
      if (statuses && !statuses.includes(parsed.status)) continue;
      out.push(parsed);
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (e) {
    throw mapSheetApiError(e);
  }
}

export async function getOutboundSjDocument(docId: string): Promise<OutboundSjDocument | null> {
  const all = await listOutboundSjDocuments();
  return all.find((d) => d.docId === docId) ?? null;
}

export async function createOutboundSjDocument(
  input: OutboundSjCreateInput,
  createdBy: string
): Promise<OutboundSjDocument> {
  const doc: OutboundSjDocument = {
    rowNumber: 0,
    docId: `OSJ-${randomUUID().slice(0, 8).toUpperCase()}`,
    status: "SKUS_DRAFT",
    createdAt: new Date().toISOString(),
    createdBy,
    verifiedAt: "",
    verifiedBy: "",
    ...input,
    skusDriveUrl: "",
    skulDriveUrl: "",
    revisionDriveUrl: "",
    revisionCount: 0,
    lines: input.lines.filter((l) => l.namaBarang.trim() || l.jumlah.trim()),
  };
  const { sheets, sheetId, tab } = await sheetsClient();
  await ensureTab(sheets, sheetId, tab);
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${quoteTab(tab)}!${COL_RANGE}`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [toValues(doc)] },
  });
  return (await getOutboundSjDocument(doc.docId)) ?? doc;
}

export async function updateOutboundSjRow(doc: OutboundSjDocument): Promise<void> {
  if (!doc.rowNumber || doc.rowNumber < 2) {
    const fresh = await getOutboundSjDocument(doc.docId);
    if (!fresh?.rowNumber) throw new Error("Baris dokumen tidak ditemukan di sheet.");
    doc.rowNumber = fresh.rowNumber;
  }
  const { sheets, sheetId, tab } = await sheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${quoteTab(tab)}!A${doc.rowNumber}:R${doc.rowNumber}`,
    valueInputOption: "RAW",
    requestBody: { values: [toValues(doc)] },
  });
}

export async function submitOutboundSjForVerification(
  docId: string,
  options?: { skusDriveUrl?: string }
): Promise<OutboundSjDocument> {
  const doc = await getOutboundSjDocument(docId);
  if (!doc) throw new Error("Dokumen tidak ditemukan.");
  const allowed: OutboundSjStatus[] = ["SKUS_DRAFT", "SKUS_REVISION_REQUESTED"];
  if (!allowed.includes(doc.status)) {
    throw new Error("Hanya draft atau dokumen revisi yang bisa dikirim ulang ke verifikasi.");
  }
  const wasRevision = doc.status === "SKUS_REVISION_REQUESTED";
  doc.status = "SKUS_SUBMITTED";
  if (wasRevision) {
    doc.lines = doc.lines.map((l) => ({ ...l, unavailable: false }));
  }
  if (options?.skusDriveUrl?.trim()) {
    doc.skusDriveUrl = options.skusDriveUrl.trim();
  }
  await updateOutboundSjRow(doc);
  return doc;
}

export function applyOutboundSjLinePatches(
  doc: OutboundSjDocument,
  patches: OutboundSjLinePatch[]
): OutboundSjDocument {
  const next = doc.lines.map((l) => ({ ...l }));
  for (const patch of patches) {
    const idx = patch.lineIndex;
    if (idx < 0 || idx >= next.length) continue;
    const line = next[idx]!;
    if (patch.unavailable !== undefined) line.unavailable = patch.unavailable;
    if (patch.keterangan !== undefined) line.keterangan = patch.keterangan;
    if (patch.banyaknya !== undefined) line.banyaknya = patch.banyaknya;
    if (patch.isi !== undefined) line.isi = patch.isi;
    if (patch.namaBarang !== undefined) line.namaBarang = patch.namaBarang;
    if (patch.jumlah !== undefined) line.jumlah = patch.jumlah;
    if (line.unavailable && !String(line.keterangan ?? "").trim()) {
      line.keterangan = "Tidak tersedia";
    }
    next[idx] = line;
  }
  return { ...doc, lines: next };
}

export async function updateOutboundSjDocumentContent(
  docId: string,
  input: { lines?: OutboundSjDocument["lines"]; kepada?: string; alamat?: string }
): Promise<OutboundSjDocument> {
  const doc = await getOutboundSjDocument(docId);
  if (!doc) throw new Error("Dokumen tidak ditemukan.");
  const editable: OutboundSjStatus[] = ["SKUS_DRAFT", "SKUS_REVISION_REQUESTED"];
  if (!editable.includes(doc.status)) {
    throw new Error("Dokumen tidak bisa diedit pada status ini.");
  }
  if (input.lines) doc.lines = input.lines;
  if (input.kepada !== undefined) doc.kepada = input.kepada.trim();
  if (input.alamat !== undefined) doc.alamat = input.alamat.trim();
  await updateOutboundSjRow(doc);
  return doc;
}

export async function approveOutboundSjAsSkul(
  docId: string,
  verifiedBy: string,
  options?: { skulDriveUrl?: string }
): Promise<OutboundSjDocument> {
  const doc = await getOutboundSjDocument(docId);
  if (!doc) throw new Error("Dokumen tidak ditemukan.");
  if (doc.status !== "SKUS_SUBMITTED") throw new Error("Hanya SKUS yang menunggu verifikasi yang bisa disetujui.");
  const hasUnavailable = doc.lines.some((l) => l.unavailable);
  if (hasUnavailable) {
    throw new Error("Ada barang ditandai tidak tersedia — gunakan Kirim revisi ke gudang, bukan setujui SKUL.");
  }
  doc.status = "SKUL";
  doc.verifiedAt = new Date().toISOString();
  doc.verifiedBy = verifiedBy;
  if (options?.skulDriveUrl?.trim()) doc.skulDriveUrl = options.skulDriveUrl.trim();
  await updateOutboundSjRow(doc);
  return doc;
}

export async function requestOutboundSjRevision(
  docId: string,
  verifiedBy: string,
  patches: OutboundSjLinePatch[],
  options: { revisionDriveUrl: string }
): Promise<OutboundSjDocument> {
  const doc = await getOutboundSjDocument(docId);
  if (!doc) throw new Error("Dokumen tidak ditemukan.");
  if (doc.status !== "SKUS_SUBMITTED") throw new Error("Hanya SKUS menunggu verifikasi yang bisa direvisi.");
  let updated = applyOutboundSjLinePatches(doc, patches);
  const marked = updated.lines.filter((l) => l.unavailable);
  if (!marked.length) {
    throw new Error("Centang minimal satu barang tidak tersedia, atau setujui sebagai SKUL.");
  }
  for (const line of marked) {
    if (!String(line.keterangan ?? "").trim()) {
      throw new Error("Isi keterangan untuk setiap barang yang tidak tersedia.");
    }
  }
  updated.status = "SKUS_REVISION_REQUESTED";
  updated.verifiedAt = new Date().toISOString();
  updated.verifiedBy = verifiedBy;
  updated.revisionCount = (updated.revisionCount || 0) + 1;
  updated.revisionDriveUrl = options.revisionDriveUrl.trim();
  await updateOutboundSjRow(updated);
  return updated;
}