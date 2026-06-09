"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { adminApi } from "@/lib/api/admin-api";
import { normalizeRole } from "@/lib/auth/redirects";
import {
  type AdminRecord,
  getAccountant,
  getAssignedAccountantUsers,
  getAssignedUsers,
  getCreatedAt,
  getMobileNumber,
  getRegionalManager,
  getRole,
} from "@/lib/admin/record-helpers";
import {
  DetailSection,
  EmptySection,
  ErrorBanner,
  LoadingState,
  SummaryStat,
  formatAdminCurrency,
  formatAdminDate,
  getLocationDisplay,
  getRoleDisplayLabel,
} from "./stakeholder-detail-shared";

type ApplicationRecord = AdminRecord & {
  accountant?: AdminRecord | null;
  amount?: number | string | null;
  created_at?: string | null;
  id?: number | string;
  service?: AdminRecord | null;
  status?: string | null;
  user?: AdminRecord | null;
};

function getErrorMessage(error: unknown, fallback: string) {
  const maybeError = error as { response?: { data?: { message?: string } } };
  return maybeError.response?.data?.message || fallback;
}

function getStatusBadgeClass(status: string | null | undefined) {
  if (status === "approved" || status === "completed") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }

  if (status === "rejected" || status === "cancelled") {
    return "bg-rose-50 text-rose-700 border border-rose-100";
  }

  if (status === "update_required") {
    return "bg-amber-50 text-amber-700 border border-amber-100";
  }

  return "bg-blue-50 text-blue-700 border border-blue-100";
}

export function UserDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const [userRecord, setUserRecord] = useState<AdminRecord | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) {
        setLoading(false);
        setError("User ID is missing.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [userResponse, applicationsResponse] = await Promise.all([
          adminApi.getUserDetails(Number(id)),
          adminApi.getApplications(),
        ]);

        const nextUser = userResponse.data?.data ?? userResponse.data;
        const nextApplications =
          applicationsResponse.data?.data ?? applicationsResponse.data ?? [];

        setUserRecord(nextUser);
        setApplications(Array.isArray(nextApplications) ? nextApplications : []);
      } catch (nextError) {
        setError(getErrorMessage(nextError, "Unable to load user details."));
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();
  }, [id]);

  const currentRole = getRole(userRecord ?? undefined);
  const normalizedRole = normalizeRole(currentRole);
  const regionalManager = getRegionalManager(userRecord ?? undefined);
  const accountant = getAccountant(userRecord ?? undefined);

  const serviceApplications = useMemo(
    () =>
      applications
        .filter((item) => Number(item.user?.id ?? 0) === Number(id))
        .sort(
          (left, right) =>
            new Date(String(right.created_at ?? 0)).getTime() -
            new Date(String(left.created_at ?? 0)).getTime(),
        ),
    [applications, id],
  );

  const managedUsers = useMemo(
    () => getAssignedUsers(userRecord ?? undefined),
    [userRecord],
  );
  const portfolioUsers = useMemo(
    () => getAssignedAccountantUsers(userRecord ?? undefined),
    [userRecord],
  );

  const handleDelete = async () => {
    if (!userRecord || typeof userRecord.id !== "number") {
      return;
    }

    if (normalizedRole === "super_admin") {
      toast.error("Super admin records cannot be deleted");
      return;
    }

    const confirmed = window.confirm("Delete this user permanently?");
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await adminApi.deleteUser(userRecord.id);
      toast.success("User deleted successfully");
      router.push("/admin/users");
    } catch (nextError) {
      const message = getErrorMessage(nextError, "Failed to delete user.");
      setError(message);
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <LoadingState label="Loading user details..." />
        </AdminLayout>
      </AuthGuard>
    );
  }

  if (!userRecord) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <div className="rounded-[2rem] border border-gray-100 bg-white p-8 text-center shadow-[var(--admin-card-shadow)]">
            <p className="text-lg font-black text-gray-900">User not found.</p>
            <Link
              href="/admin/users"
              className="mt-4 inline-flex rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
            >
              Back to Users
            </Link>
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Link
                  href="/admin/users"
                  className="text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
                >
                  {"<- Back to Users"}
                </Link>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">
                  {String(userRecord.name ?? "User")}
                </h1>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  {getRoleDisplayLabel(currentRole)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/admin/service-applications"
                  className="admin-btn-soft px-4 py-2 text-xs"
                >
                  Service Applications
                </Link>
                <button
                  onClick={() => void handleDelete()}
                  disabled={deleting || normalizedRole === "super_admin"}
                  className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                    deleting || normalizedRole === "super_admin"
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                  }`}
                >
                  {deleting ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </div>
          </section>

          {error && <ErrorBanner message={error} />}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Panel: Profile Information */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-[var(--admin-card-shadow)]">
                <h2 className="text-lg font-black text-gray-900 mb-6">Profile Details</h2>
                <div className="space-y-6">
                  {/* Email */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Email Address
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <a
                        href={`mailto:${userRecord.email}`}
                        className="text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900 break-all"
                      >
                        {String(userRecord.email ?? "-")}
                      </a>
                      {Boolean(userRecord.email) && (
                        <button
                          onClick={() => {
                            void navigator.clipboard.writeText(String(userRecord.email));
                            toast.success("Email copied to clipboard");
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                          title="Copy Email"
                        >
                          <i className="fas fa-copy" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Phone Number
                    </p>
                    <div className="mt-1">
                      {getMobileNumber(userRecord) ? (
                        <a
                          href={`tel:${getMobileNumber(userRecord)}`}
                          className="text-sm font-semibold text-gray-700 transition-colors hover:text-blue-600"
                        >
                          {String(getMobileNumber(userRecord))}
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-gray-700">-</span>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Location
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-700 break-words">
                      {getLocationDisplay(userRecord)}
                    </p>
                  </div>

                  {/* Joined Date */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Joined Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      {formatAdminDate(getCreatedAt(userRecord))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Assignments */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SummaryStat
                  label="Relationship Manager"
                  value={String(regionalManager?.name ?? "Not assigned")}
                  tone="blue"
                />
                <SummaryStat
                  label="Accountant"
                  value={String(accountant?.name ?? "Not assigned")}
                  tone="emerald"
                />
              </div>
            </div>
          </div>

          {normalizedRole === "user" && (
            <DetailSection
              title="Service Applications"
              subtitle="All service requests created by this user."
            >
              {serviceApplications.length === 0 ? (
                <EmptySection
                  label="No service applications were found for this user."
                  icon="fa-clipboard-list"
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[980px] w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Service
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Status
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Accountant
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Created
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Open
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {serviceApplications.map((item) => (
                        <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                          <td className="px-6 py-4">
                            <p className="text-sm font-black text-gray-900">
                              {String(item.service?.name ?? "Service")}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              #{String(item.id ?? "")}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusBadgeClass(
                                typeof item.status === "string" ? item.status : null,
                              )}`}
                            >
                              {String(item.status ?? "pending").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                            {formatAdminCurrency(item.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                            {String(item.accountant?.name ?? "Unassigned")}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                            {formatAdminDate(item.created_at)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/admin/service-applications/${item.id}`}
                              className="admin-icon-btn-soft"
                              title="View application"
                              aria-label="View application"
                            >
                              <i className="fas fa-eye" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DetailSection>
          )}

          {normalizedRole === "regional_manager" && (
            <DetailSection
              title="Managed Users"
              subtitle="Users currently assigned to this relationship manager profile."
            >
              {managedUsers.length === 0 ? (
                <EmptySection label="No managed users found." icon="fa-users" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Name
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Email
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Accountant
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Open
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {managedUsers.map((item) => (
                        <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                          <td className="px-6 py-4 text-sm font-black text-gray-900">
                            {String(item.name ?? "User")}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                            {String(item.email ?? "-")}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                            {String(getAccountant(item)?.name ?? "Unassigned")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/admin/users/${item.id}`}
                              className="admin-icon-btn-soft"
                              title="View user"
                              aria-label="View user"
                            >
                              <i className="fas fa-eye" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DetailSection>
          )}

          {normalizedRole === "accountant" && (
            <DetailSection
              title="Portfolio Users"
              subtitle="Users currently assigned to this accountant profile."
            >
              {portfolioUsers.length === 0 ? (
                <EmptySection label="No portfolio users found." icon="fa-users" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full text-left">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Name
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Email
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Relationship Manager
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Open
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {portfolioUsers.map((item) => (
                        <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                          <td className="px-6 py-4 text-sm font-black text-gray-900">
                            {String(item.name ?? "User")}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                            {String(item.email ?? "-")}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                            {String(getRegionalManager(item)?.name ?? "Unassigned")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/admin/users/${item.id}`}
                              className="admin-icon-btn-soft"
                              title="View user"
                              aria-label="View user"
                            >
                              <i className="fas fa-eye" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DetailSection>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
