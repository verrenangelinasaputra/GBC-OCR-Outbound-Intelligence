export type OutboundSjStatus = "SKUS_DRAFT" | "SKUS_SUBMITTED" | "SKUL";

export type OutboundSjLine = {
  banyaknya: string;
  isi: string;
  namaBarang: string;
  jumlah: string;
  keterangan: string;
  skuLengkap?: string;
  skus?: string;
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
};

export type OutboundSjCreateInput = Omit<
  OutboundSjDocument,
  "rowNumber" | "docId" | "status" | "createdAt" | "createdBy" | "verifiedAt" | "verifiedBy" | "skusDriveUrl"
>;