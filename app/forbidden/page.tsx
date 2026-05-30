import { ErrorPageLayout } from "@/components/layout/ErrorPageLayout";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <ErrorPageLayout
      title="Access Denied"
      description="You do not have permission to access this page."
      Icon={ShieldAlert}
      iconColorClass="text-red-600"
      iconBgClass="bg-red-50"
    />
  );
}
