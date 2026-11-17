/** Branding & home portal — app ini GBC Outbound (bukan Inbound). */
export const PRODUCT_NAME = "GBC Outbound Intelligence";
export const PRODUCT_TAGLINE = "Rekap Barang Keluar";
export const PORTAL_HOME_HREF = "/skus";

/** Outbound hanya warehouse/internal — sembunyikan UI & auth supplier. */
export const SUPPLIER_PORTAL_ENABLED = process.env.NEXT_PUBLIC_SUPPLIER_PORTAL_ENABLED === "true";