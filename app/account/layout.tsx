import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserDashboardShell>{children}</UserDashboardShell>;
}
