/** Root folder: 6 subfolder gudang (Karanggan, Loumina, …). */
export const OUTBOUND_SURAT_KELUAR_DRIVE_FOLDER_ID_DEFAULT =
  "1oSPV4BIktjeDg7lUDvqCirDVGfEJ5fs7";

export const OUTBOUND_SURAT_KELUAR_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${OUTBOUND_SURAT_KELUAR_DRIVE_FOLDER_ID_DEFAULT}`;

export function getOutboundSuratKeluarDriveRootId(): string {
  return (
    process.env.OUTBOUND_SJ_DRIVE_FOLDER_ID?.trim() ||
    process.env.OUTBOUND_SURAT_KELUAR_DRIVE_FOLDER_ID?.trim() ||
    OUTBOUND_SURAT_KELUAR_DRIVE_FOLDER_ID_DEFAULT
  );
}