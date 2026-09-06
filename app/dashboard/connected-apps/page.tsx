import { connection } from "next/server";
import { ConnectedAppsView } from "@/components/dashboard/connected-apps-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connected Apps & Suite | DoorstepFilings",
  description:
    "Manage connected Doorstep Suite applications including Doorstep Books, HRMS, and ERP.",
};

export default async function ConnectedAppsPage() {
  await connection();
  return <ConnectedAppsView />;
}
