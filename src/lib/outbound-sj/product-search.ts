import "server-only";

import { listSkuMasterRekapSkulRows } from "@/lib/services/sku-master-sheet";
import type { SkuMasterRekapSkulRow } from "@/lib/sku-master/types";

export async function searchRekapSkulProducts(query: string, limit = 25): Promise<SkuMasterRekapSkulRow[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const rows = await listSkuMasterRekapSkulRows();
  const matched = rows.filter((r) => {
    const blob = [
      r.namaProdukAcuan,
      r.namaInternalAccurate,
      r.skuLengkap,
      r.skus,
      r.kategoriUtama,
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
  return matched.slice(0, limit);
}