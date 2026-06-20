import { redirect } from "next/navigation";
import { RoleShell } from "@/components/layout/role-shell";
import { AssignedServices } from "@/components/expert/assigned-services";
import { AccountantUserManagement } from "@/components/accountant/assigned-users";
import { ProtectedPlaceholder } from "@/components/migration/protected-placeholder";

function sourceFor(parts: string[]) {
  const joined = parts.join("/");
  const map: Record<string, string> = {
    users: "resources/js/pages/Accountant/AssignedUsers.jsx",
    "service-requests": "resources/js/pages/Accountant/ServiceRequests.jsx",
    "service-requests/[id]": "resources/js/pages/Accountant/RequestDetail.jsx",
    "client-upload": "resources/js/pages/Accountant/ClientDocumentUpload.jsx",
  };

  if (joined in map) {
    return map[joined];
  }

  return `resources/js/pages/Accountant (${joined})`;
}

function normalizeParts(parts: string[]) {
  return parts.map((part) => (/^\d+$/.test(part) ? "[id]" : part));
}

function humanize(parts: string[]) {
  return parts
    .map((part) => part.replace(/-/g, " "))
    .map((part) => part.replace(/\b\w/g, (char) => char.toUpperCase()))
    .join(" / ");
}

export default async function AccountantCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const joined = slug.join("/");

  if (joined === "documents" || joined === "client-documents") {
    redirect("/accountant/service-requests");
  }

  if (joined === "service-requests") {
    return (
        <RoleShell title="Assigned Services" subtitle="Manage and process client requests." theme="default">
            <AssignedServices />
        </RoleShell>
    );
  }

  if (joined === "users") {
    return (
        <RoleShell title="Assigned Users" subtitle="Your portfolio of clients." theme="default">
            <AccountantUserManagement />
        </RoleShell>
    );
  }

  return (
    <ProtectedPlaceholder
      title={`Accountant: ${humanize(slug)}`}
      subtitle="Accountant route scaffold in the Next.js workspace."
      sourcePath={sourceFor(normalizeParts(slug))}
      nextSteps={[
        "Move accountant data tables, request detail flows, and document actions.",
        "Reconnect status updates, uploads, and revision handling.",
        "Preserve accountant-only navigation and role guards.",
      ]}
      allowedRoles={["accountant"]}
    />
  );
}
