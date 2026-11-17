export type OutboundSjStatus =
  | "SKUS_DRAFT"
  | "SKUS_SUBMITTED"
  | "SKUS_REVISION_REQUESTED"
  | "SKUL";

export type OutboundSjLine = {
  banyaknya: string;
  isi: string;
  namaBarang: string;
  jumlah: string;
  keterangan: string;
  skuLengkap?: string;
  skus?: string;
  /** Kepala gudang utama: barang tidak tersedia — tampil dicoret di gambar revisi. */
  unavailable?: boolean;
};

export type OutboundSjDocument = {
  rowNumber: number;
  docId: string;
  status: OutboundSjStatus;
  createdAt: string;
  createdBy: string;
  verifiedAt: string;
  verifiedBy: string;
  gudang: string;
  tanggal: string;
  noSj: string;
  noPo: string;
  noKend: string;
  kepada: string;
  alamat: string;
  lines: OutboundSjLine[];
  /** Link file PNG SKUS di Drive (setelah kirim verifikasi). */
  skusDriveUrl: string;
  skulDriveUrl: string;
  revisionDriveUrl: string;
  revisionCount: number;
};

export type OutboundSjLinePatch = {
  lineIndex: number;
  unavailable?: boolean;
  keterangan?: string;
  banyaknya?: string;
  isi?: string;
  namaBarang?: string;
  jumlah?: string;
};

export type OutboundSjCreateInput = Omit<
  OutboundSjDocument,
  | "rowNumber"
  | "docId"
  | "status"
  | "createdAt"
  | "createdBy"
  | "verifiedAt"
  | "verifiedBy"
  | "skusDriveUrl"
  | "skulDriveUrl"
  | "revisionDriveUrl"
  | "revisionCount"
>;