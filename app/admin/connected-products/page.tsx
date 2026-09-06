import { ConnectedProductsView } from "@/components/admin/connected-products-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connected Products & Suite | Admin Console",
  description: "Manage integrated Doorstep Suite products, direct URLs, and capabilities.",
};

export default function AdminConnectedProductsPage() {
  return <ConnectedProductsView />;
}
