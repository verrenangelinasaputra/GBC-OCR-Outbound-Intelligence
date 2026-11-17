import { DEFAULT_SAMPLE_ITEM_TAG } from "@/lib/surat-jalan/sample-item-tag";
import type { OcrSheetDocumentDetail, OcrSheetLine } from "@/lib/services/ocr-sheet-detail";
import { renderSuratJalanRevisionPng } from "@/lib/surat-jalan/revision-image";
import type { OutboundSjDocument } from "@/lib/outbound-sj/types";

function toOcrDetail(doc: OutboundSjDocument): OcrSheetDocumentDetail {
  const lines: OcrSheetLine[] = doc.lines.map((line, i) => ({
    sheetRow: i + 1,
    gudang: doc.gudang,
    supplier: doc.kepada,
    exportTimestamp: doc.createdAt,
    tanggal: doc.tanggal,
    noSuratJalan: doc.noSj,
    noKendaraan: doc.noKend,
    noPo: doc.noPo,
    namaPenerima: doc.kepada,
    alamat: doc.alamat,
    banyaknya: line.banyaknya,
    isi: line.isi,
    namaCustomer: doc.kepada,
    namaBarang: line.namaBarang,
    jumlah: line.jumlah,
    keterangan: line.keterangan,
    fileName: "",
    fileUrl: "",
    kendaraanDriver: "",
    catatan: "",
    status: "OK",
    statusReview: doc.status,
    linkRevisi: "",
    sampleType: "",
    tsKirimSupplier: "",
    tsDitinjauGudang: "",
    tsRevisiGudang: "",
    tsApproveGudang: doc.verifiedAt,
    tsKonfirmasiSupplier: "",
  }));

  return {
    docKey: doc.docId,
    supplier: doc.kepada,
    gudang: doc.gudang,
    exportTimestamp: doc.createdAt,
    tanggal: doc.tanggal,
    noSuratJalan: doc.noSj,
    noKendaraan: doc.noKend,
    noPo: doc.noPo,
    namaPenerima: doc.kepada,
    alamat: doc.alamat,
    fileName: "",
    fileUrl: "",
    kendaraanDriver: "",
    catatan: "",
    lineStatus: "",
    statusReview: doc.status,
    linkRevisi: "",
    revisionLinks: [],
    sampleType: DEFAULT_SAMPLE_ITEM_TAG,
    lines,
  };
}

export async function renderOutboundSuratKeluarPng(doc: OutboundSjDocument): Promise<Buffer> {
  const isSkul = doc.status === "SKUL";
  const revisionLabel = isSkul ? "[SKUL] GUDANG" : "[SKUS] GUDANG";
  const footerNote = isSkul
    ? "Surat keluar SKUL — GBC Outbound Intelligence"
    : "Surat keluar SKUS (belum SKUL) — GBC Outbound Intelligence";
  return renderSuratJalanRevisionPng(toOcrDetail(doc), undefined, { revisionLabel, footerNote });
}