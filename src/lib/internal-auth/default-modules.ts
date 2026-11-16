import type { AppModule } from "@/lib/rbac/modules";

/** Modul default saat Super Admin menyetujui user baru (bisa diubah per user). */
export const DEFAULT_APPROVED_USER_MODULES: AppModule[] = ["sku_mapping"];
