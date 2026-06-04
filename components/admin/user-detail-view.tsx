"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useConfirm } from "@/hooks/use-confirm";
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
  const { confirm, ConfirmDialog } = useConfirm();
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
  const joinedAt = formatAdminDate(getCreatedAt(userRecord));
  const locationLabel = getLocationDisplay(userRecord);

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
  const roleLabel = getRoleDisplayLabel(currentRole);
  const primaryCountLabel =
    normalizedRole === "regional_manager"
      ? "Managed Users"
      : normalizedRole === "accountant"
        ? "Portfolio Users"
        : "Applications";
  const primaryCountValue =
    normalizedRole === "regional_manager"
      ? managedUsers.length
      : normalizedRole === "accountant"
        ? portfolioUsers.length
        : serviceApplications.length;

  const handleDelete = async () => {
    const numericUserId = Number(userRecord?.id);
    if (!userRecord || !Number.isFinite(numericUserId)) {
      return;
    }

    if (normalizedRole === "super_admin") {
      toast.error("Super admin records cannot be deleted");
      return;
    }

    const confirmed = await confirm({
      title: "Delete user?",
      message: "This permanently removes the user from the directory.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await adminApi.deleteUser(numericUserId);
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
          <div className="panel-page">
            <div className="panel-empty-state px-6 py-16 text-center sm:px-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                <i className="fas fa-user-slash text-xl" />
              </div>
              <p className="mt-4 text-lg font-black text-slate-900">User not found.</p>
              <Link
                href="/admin/users"
                className="admin-btn-soft mt-5 rounded-2xl px-5 py-3"
              >
                Back to Users
              </Link>
            </div>
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="panel-page">
          <section className="panel-hero p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-700"
                >
                  <i className="fas fa-arrow-left text-xs" />
                  Back to Users
                </Link>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                  Super Admin
                </p>
                <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {String(userRecord.name ?? "User")}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-blue-700">
                    {roleLabel}
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-600">
                    User ID #{String(userRecord.id ?? id)}
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-[13px] font-medium text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                  <span className="truncate">
                    <i className="fas fa-envelope mr-2 text-xs text-blue-600" />
                    {String(userRecord.email ?? "-")}
                  </span>
                  <span>
                    <i className="fas fa-phone mr-2 text-xs text-blue-600" />
                    {String(getMobileNumber(userRecord) ?? "-")}
                  </span>
                  <span>
                    <i className="fas fa-location-dot mr-2 text-xs text-blue-600" />
                    {locationLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
                <Link
                  href="/admin/service-applications"
                  className="admin-btn-soft justify-center rounded-2xl px-5 py-3 text-xs"
                >
                  Service Applications
                </Link>
                <button
                  onClick={() => void handleDelete()}
                  disabled={deleting || normalizedRole === "super_admin"}
                  className={`inline-flex justify-center rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
                    deleting || normalizedRole === "super_admin"
                      ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                      : "border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                  }`}
                >
                  {deleting ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </div>
          </section>

          {error && <ErrorBanner message={error} />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <SummaryStat label="Role" value={roleLabel} tone="indigo" />
            <SummaryStat label={primaryCountLabel} value={primaryCountValue} tone="blue" />
            <SummaryStat label="Joined" value={joinedAt} />
            <SummaryStat label="Location" value={locationLabel} />
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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <DetailSection
              title="Contact Profile"
              subtitle="Direct contact and identity details for this stakeholder."
            >
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <DetailItem label="Full Name" value={String(userRecord.name ?? "-")} />
                <DetailItem label="Role" value={roleLabel} />
                <DetailItem label="Email Address" value={String(userRecord.email ?? "-")} />
                <DetailItem
                  label="Phone Number"
                  value={String(getMobileNumber(userRecord) ?? "-")}
                />
                <DetailItem label="Joined On" value={joinedAt} />
                <DetailItem label="Location" value={locationLabel} />
              </div>
            </DetailSection>

            <DetailSection
              title="Relationship Snapshot"
              subtitle="Operational ownership and routing connected to this user."
            >
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <DetailItem
                  label="Relationship Manager"
                  value={String(regionalManager?.name ?? "Not assigned")}
                  tone="blue"
                />
                <DetailItem
                  label="Accountant"
                  value={String(accountant?.name ?? "Not assigned")}
                  tone="emerald"
                />
                <DetailItem
                  label={primaryCountLabel}
                  value={String(primaryCountValue)}
                  tone="amber"
                />
                <DetailItem
                  label="Portal Status"
                  value="Active Directory Record"
                  tone="indigo"
                />
              </div>
            </DetailSection>
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
                <>
                  <div className="space-y-4 p-5 md:hidden">
                    {serviceApplications.map((item) => (
                      <div key={String(item.id)} className="panel-card-muted p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900">
                              {String(item.service?.name ?? "Service")}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">
                              #{String(item.id ?? "")}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusBadgeClass(
                              typeof item.status === "string" ? item.status : null,
                            )}`}
                          >
                            {String(item.status ?? "pending").replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <DetailItem
                            label="Amount"
                            value={formatAdminCurrency(item.amount)}
                            compact
                          />
                          <DetailItem
                            label="Accountant"
                            value={String(item.accountant?.name ?? "Unassigned")}
                            compact
                          />
                          <DetailItem
                            label="Created"
                            value={formatAdminDate(item.created_at)}
                            compact
                          />
                        </div>
                        <Link
                          href={`/admin/service-applications/${item.id}`}
                          className="admin-btn-soft mt-4 w-full justify-center rounded-2xl py-3 text-[11px]"
                        >
                          Open Application
                        </Link>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-[980px] w-full text-left">
                    <thead className="panel-table-head">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Service
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Status
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Accountant
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Created
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Open
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {serviceApplications.map((item) => (
                        <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                          <td className="px-6 py-4">
                            <p className="text-sm font-black text-slate-900">
                              {String(item.service?.name ?? "Service")}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
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
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {formatAdminCurrency(item.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {String(item.accountant?.name ?? "Unassigned")}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
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
                </>
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
                <>
                  <div className="space-y-4 p-5 md:hidden">
                    {managedUsers.map((item) => (
                      <div key={String(item.id)} className="panel-card-muted p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900">
                              {String(item.name ?? "User")}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">
                              {String(item.email ?? "-")}
                            </p>
                          </div>
                          <Link
                            href={`/admin/users/${item.id}`}
                            className="admin-icon-btn-soft"
                            title="View user"
                            aria-label="View user"
                          >
                            <i className="fas fa-eye" />
                          </Link>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <DetailItem
                            label="Accountant"
                            value={String(getAccountant(item)?.name ?? "Unassigned")}
                            compact
                          />
                          <DetailItem label="Joined" value={formatAdminDate(getCreatedAt(item))} compact />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-[920px] w-full text-left">
                    <thead className="panel-table-head">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Name
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Email
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Accountant
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Open
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {managedUsers.map((item) => (
                        <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                          <td className="px-6 py-4 text-sm font-black text-slate-900">
                            {String(item.name ?? "User")}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {String(item.email ?? "-")}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
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
                </>
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
                <>
                  <div className="space-y-4 p-5 md:hidden">
                    {portfolioUsers.map((item) => (
                      <div key={String(item.id)} className="panel-card-muted p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900">
                              {String(item.name ?? "User")}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">
                              {String(item.email ?? "-")}
                            </p>
                          </div>
                          <Link
                            href={`/admin/users/${item.id}`}
                            className="admin-icon-btn-soft"
                            title="View user"
                            aria-label="View user"
                          >
                            <i className="fas fa-eye" />
                          </Link>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <DetailItem
                            label="Relationship Manager"
                            value={String(getRegionalManager(item)?.name ?? "Unassigned")}
                            compact
                          />
                          <DetailItem label="Joined" value={formatAdminDate(getCreatedAt(item))} compact />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-[920px] w-full text-left">
                    <thead className="panel-table-head">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Name
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Email
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Relationship Manager
                        </th>
                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Open
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {portfolioUsers.map((item) => (
                        <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                          <td className="px-6 py-4 text-sm font-black text-slate-900">
                            {String(item.name ?? "User")}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                            {String(item.email ?? "-")}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-700">
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
                </>
              )}
            </DetailSection>
          )}
        </div>
      </AdminLayout>
      <ConfirmDialog />
    </AuthGuard>
  );
}

function DetailItem({
  label,
  value,
  tone = "slate",
  compact = false,
}: {
  label: string;
  value: string;
  tone?: "slate" | "blue" | "emerald" | "amber" | "indigo";
  compact?: boolean;
}) {
  const toneClass =
    tone === "blue"
      ? "text-blue-700"
      : tone === "emerald"
        ? "text-emerald-700"
        : tone === "amber"
          ? "text-amber-700"
          : tone === "indigo"
            ? "text-indigo-700"
            : "text-slate-900";

  return (
    <div className={`rounded-2xl border border-slate-100 bg-slate-50/80 ${compact ? "p-3.5" : "p-4"}`}>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-2 break-words ${compact ? "text-[14px]" : "text-[15px]"} font-semibold leading-6 ${toneClass}`}
      >
        {value}
      </p>
    </div>
  );
}
