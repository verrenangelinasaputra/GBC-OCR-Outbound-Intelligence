import { redirect } from "next/navigation";
import { PORTAL_HOME_HREF } from "@/lib/config/product";

/** Legacy inbound route — arahkan ke halaman Outbound. */
export default function DashboardPage() {
  redirect(PORTAL_HOME_HREF);
}