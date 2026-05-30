import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <ErrorPageLayout
      title="Oops! Page Not Found"
      description="The page you are looking for doesn’t exist, has been removed, or is temporarily unavailable."
      Icon={SearchX}
    />
  );
}
