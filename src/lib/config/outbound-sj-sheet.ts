/** Spreadsheet operasional Outbound — surat keluar SKUS/SKUL (terpisah dari generator SKU). */
export const OUTBOUND_SJ_SHEET_ID_DEFAULT = "1JiwgYEM5ZukaR9RSmwr6sG789mL_q1FRhzW3jujWozk";

/** Tab penyimpanan surat keluar — dibuat otomatis jika belum ada. */
export const OUTBOUND_SJ_TAB_DEFAULT = "Outbound Surat Keluar";

export function getOutboundSjSpreadsheetId(): string {
  return process.env.OUTBOUND_SJ_SHEET_ID?.trim() || OUTBOUND_SJ_SHEET_ID_DEFAULT;
}

export function getOutboundSjTabName(): string {
  return process.env.OUTBOUND_SJ_TAB?.trim() || OUTBOUND_SJ_TAB_DEFAULT;
}

export function getOutboundSjSpreadsheetEditUrl(): string {
  const sheetId = getOutboundSjSpreadsheetId();
  return `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
}