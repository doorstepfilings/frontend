import { RoleShell } from "@/components/layout/role-shell";
import { ServiceApplications } from "@/components/admin/service-applications";
import { UserManagementView } from "@/components/admin/user-management-view";
import { ServiceManagement } from "@/components/admin/service-management";
import { ProtectedPlaceholder } from "@/components/migration/protected-placeholder";

function humanize(parts: string[]) {
  return parts
    .map((part) => part.replace(/-/g, " "))
    .map((part) => part.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(" / ");
}

function sourceFor(parts: string[]) {
  const joined = parts.join("/");

  const map: Record<string, string> = {
    users: "resources/js/pages/Admin/Users.jsx",
    "users/[id]": "resources/js/pages/Admin/UserDetails.jsx",
    "users/[id]/profile": "resources/js/pages/Admin/UserDetails.jsx",
    "regional-managers": "resources/js/pages/Admin/RegionalManagers.jsx",
    "regional-managers/[id]": "resources/js/pages/Admin/RegionalManagerDetails.jsx",
    accountants: "resources/js/pages/Admin/Accountants.jsx",
    "accountants/[id]": "resources/js/pages/Admin/AccountantDetails.jsx",
    categories: "resources/js/pages/Admin/Categories.jsx",
    "categories/create": "resources/js/pages/Admin/CategoryForm.jsx",
    "categories/edit/[id]": "resources/js/pages/Admin/CategoryForm.jsx",
    "categories/[id]/edit": "resources/js/pages/Admin/CategoryForm.jsx",
    services: "resources/js/pages/Admin/ServicesList.jsx",
    "services/create": "resources/js/pages/Admin/ServiceForm.jsx",
    "services/edit/[id]": "resources/js/pages/Admin/ServiceForm.jsx",
    "services/[id]/edit": "resources/js/pages/Admin/ServiceForm.jsx",
    enquiries: "resources/js/pages/Admin/Enquiries.jsx",
    "service-applications": "resources/js/pages/Admin/ServiceApplications.jsx",
    "service-applications/[id]": "resources/js/pages/Admin/ServiceApplicationDetail.jsx",
    "account-assignment": "resources/js/pages/Admin/AccountAssignment.jsx",
  };

  if (joined in map) {
    return map[joined];
  }

  return `resources/js/pages/Admin (${joined})`;
}

function normalizeParts(parts: string[]) {
  return parts.map((part) => (/^\d+$/.test(part) ? "[id]" : part));
}

export default async function AdminCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join("/");
  const normalized = normalizeParts(slug);

  if (key === "service-applications") {
    return (
        <RoleShell title="Service Applications" subtitle="Manage all user service requests." theme="admin">
            <ServiceApplications />
        </RoleShell>
    );
  }

  if (key === "users") {
    return <UserManagementView initialType="users" />;
  }

  if (key === "regional-managers") {
    return <UserManagementView initialType="rms" />;
  }

  if (key === "accountants") {
    return <UserManagementView initialType="accountants" />;
  }

  if (key === "services") {
    return (
        <RoleShell title="Services" subtitle="Manage service catalog." theme="admin">
            <ServiceManagement />
        </RoleShell>
    );
  }

  return (
    <ProtectedPlaceholder
      title={`Admin: ${humanize(slug)}`}
      subtitle="Super admin route scaffold created in the Next.js workspace."
      sourcePath={sourceFor(normalized)}
      nextSteps={[
        "Port the full admin screen UI and table interactions.",
        "Reconnect mutations through typed Next-side clients or API routes.",
        "Match the current admin role guards, loaders, and success/error states.",
      ]}
      allowedRoles={["super_admin"]}
      theme="admin"
    />
  );
}
