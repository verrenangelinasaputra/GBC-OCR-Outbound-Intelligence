import { redirect } from "next/navigation";
import { PORTAL_HOME_HREF } from "@/lib/config/product";

export default function Home() {
  redirect(PORTAL_HOME_HREF);
}
