import { RoleShell } from "@/components/layout/role-shell";
import { RMUserManagement } from "@/components/rm/assigned-users";
import { RMServiceRequests } from "@/components/rm/service-requests";
import { ProtectedPlaceholder } from "@/components/migration/protected-placeholder";

function humanize(parts: string[]) {
  return parts
    .map((part) => part.replace(/-/g, " "))
    .map((part) => part.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(" / ");
}

export default async function RegionalManagerCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const key = slug.join("/");

  if (key === "assigned-users") {
    return (
      <RoleShell title="Assigned Users" subtitle="Manage your connected clients." theme="default">
        <RMUserManagement />
      </RoleShell>
    );
  }

  if (key === "service-requests") {
    return (
      <RoleShell title="Service Requests" subtitle="Track applications for your users." theme="default">
        <RMServiceRequests />
      </RoleShell>
    );
  }

  return (
    <ProtectedPlaceholder
      title={`Relationship Manager: ${humanize(slug)}`}
      subtitle="Relationship manager route scaffold in the Next.js workspace."
      sourcePath={`resources/js/pages/RM (${key})`}
      nextSteps={[
        "Port assigned-user and service-request data fetching.",
        "Reconnect accountant assignment behavior and validations.",
        "Preserve RM-only access rules and workflow states.",
      ]}
      allowedRoles={["relationship_manager"]}
    />
  );
}
