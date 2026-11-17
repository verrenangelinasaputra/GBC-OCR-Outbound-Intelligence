import type { AppModule } from "@/lib/rbac/modules";

/** Fase 1 Outbound: satu halaman operasional warehouse. */
export const PORTAL_NAV_MODULES: {
  module: AppModule;
  label: string;
  href: string;
}[] = [
  { module: "sku_mapping", label: "Rekap SKUS", href: "/skus" },
  { module: "outbound_sj", label: "Buat Surat Keluar (SKUS)", href: "/outbound-sj/new" },
  { module: "outbound_sj", label: "Pengecekkan Gudang Utama", href: "/outbound-sj/verify" },
];

/** Modul operasional (tanpa admin user). */
export const PORTAL_NAV_OPERATIONS = PORTAL_NAV_MODULES.filter((m) => m.module !== "users");

export function customerPortalHref(baseHref: string): string {
  if (baseHref.startsWith("/customer/")) return baseHref;
  return `/customer${baseHref}`;
}

/** Outbound: hanya menu gudang, tanpa mirror Customer / Admin di sidebar. */
export const PORTAL_NAV_SECTIONS = [
  {
    id: "gudang" as const,
    title: "Gudang",
    items: PORTAL_NAV_OPERATIONS,
  },
];

/** Alias untuk UI admin (centang halaman per user). */
export const ASSIGNABLE_NAV_MODULES = PORTAL_NAV_MODULES;

/** Halaman operasional per section (tanpa User & Role Management). */
export const ASSIGNABLE_GUDANG_MODULES = PORTAL_NAV_OPERATIONS;
export const ASSIGNABLE_CUSTOMER_MODULES: typeof PORTAL_NAV_OPERATIONS = [];

/** Route lama (inbound / fitur belum dipakai) — diblok middleware. */
const RETIRED_PORTAL_ROUTES: { module: AppModule; href: string }[] = [
  { module: "dashboard", href: "/dashboard" },
  { module: "ocr_review", href: "/ocr-review" },
  { module: "sku_mapping", href: "/sku-mapping" },
  { module: "master_mapping", href: "/master-mapping" },
  { module: "supplier_data_mapping", href: "/supplier-data-mapping" },
  { module: "data_barang_masuk", href: "/data-barang-masuk" },
  { module: "users", href: "/users" },
  { module: "nkb", href: "/nkb" },
  { module: "surat_jalan", href: "/surat-jalan" },
  { module: "purchase_orders", href: "/purchase-orders" },
  { module: "goods_receiving", href: "/goods-receiving" },
  { module: "discrepancies", href: "/discrepancies" },
  { module: "master_prices", href: "/master-prices" },
  { module: "invoices", href: "/invoices" },
  { module: "accounts_payable", href: "/accounts-payable" },
  { module: "suppliers", href: "/suppliers" },
  { module: "reports", href: "/reports" },
  { module: "notifications", href: "/notifications" },
  { module: "audit_logs", href: "/audit-logs" },
  { module: "integrations", href: "/integrations" },
  { module: "settings", href: "/settings" },
];

const ROUTE_CATALOG = [...PORTAL_NAV_MODULES, ...RETIRED_PORTAL_ROUTES];

export function isActivePortalModule(mod: AppModule): boolean {
  return PORTAL_NAV_MODULES.some((p) => p.module === mod);
}

export function pathnameToModule(pathname: string): AppModule | null {
  const normalized =
    pathname === "/customer" || pathname.startsWith("/customer/")
      ? pathname.replace(/^\/customer/, "") || "/dashboard"
      : pathname;
  const entry = ROUTE_CATALOG.find(
    (n) => normalized === n.href || normalized.startsWith(`${n.href}/`)
  );
  return entry?.module ?? null;
}

export function parseAllowedModulesCell(raw: string | undefined | null): AppModule[] {
  const text = String(raw ?? "").trim();
  if (!text) return [];
  const valid = new Set(PORTAL_NAV_MODULES.map((m) => m.module));
  const parsed = text
    .split(/[;|,]/)
    .map((s) => s.trim().toLowerCase() as AppModule)
    .filter((m) => valid.has(m));
  if (parsed.length === 0 && text) {
    return ["sku_mapping", "outbound_sj"];
  }
  return parsed;
}

export function formatAllowedModulesCell(modules: AppModule[]): string {
  const valid = new Set(PORTAL_NAV_MODULES.map((m) => m.module));
  return [...new Set(modules)].filter((m) => valid.has(m)).join(";");
}