import { UserDashboardShell } from "@/components/layout/user-dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserDashboardShell>{children}</UserDashboardShell>;
}
