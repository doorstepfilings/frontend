import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <ErrorPageLayout
      eyebrow="Page not found"
      title="We could not find that page."
      description="The link may be old, moved, or typed incorrectly. You can return home, browse services, or contact support and we will point you to the right place."
      Icon={SearchX}
      primaryAction={{ label: "Go to Home", href: "/" }}
      secondaryAction={{ label: "Browse Services", href: "/services" }}
    />
  );
}
