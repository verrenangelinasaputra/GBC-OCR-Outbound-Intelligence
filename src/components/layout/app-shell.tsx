import { AppSidebar } from "./app-sidebar";
import { MobileShellLayout } from "./mobile-shell-layout";
import { WarehouseProfileChip } from "./warehouse-profile-chip";
import { getSession } from "@/lib/auth/session";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/config/product";

export async function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const session = await getSession();

  return (
    <MobileShellLayout
      title={title}
      subtitle={`${PRODUCT_NAME} · ${PRODUCT_TAGLINE}`}
      sidebar={
        <AppSidebar
          roles={session?.roles ?? []}
          allowedModulesGudang={session?.allowedModulesGudang ?? session?.allowedModules}
          allowedModulesCustomer={session?.allowedModulesCustomer ?? session?.allowedModules}
        />
      }
      headerEnd={
        <>
          <div className="hidden sm:block">
            <WarehouseProfileChip />
          </div>
          <span className="hidden text-slate-600 md:inline">{session?.username}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="text-blue-600 hover:underline">
              Logout
            </button>
          </form>
        </>
      }
    >
      {children}
    </MobileShellLayout>
  );
}
