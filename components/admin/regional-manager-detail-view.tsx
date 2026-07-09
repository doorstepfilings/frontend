"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { adminApi } from "@/lib/api/admin-api";
import {
  type AdminRecord,
  getAccountant,
  getAssignedUsers,
  getCreatedAt,
  getMobileNumber,
  getRmUniqueId,
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
} from "./stakeholder-detail-shared";

function getErrorMessage(error: unknown, fallback: string) {
  const maybeError = error as { response?: { data?: { message?: string } } };
  return maybeError.response?.data?.message || fallback;
}

export function RegionalManagerDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");
  const [manager, setManager] = useState<AdminRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) {
        setLoading(false);
        setError("Relationship manager ID is missing.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await adminApi.getRMDetails(Number(id));
        setManager(response.data?.data ?? response.data);
      } catch (nextError) {
        setError(getErrorMessage(nextError, "Unable to load relationship manager details."));
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();
  }, [id]);

  const assignedUsers = useMemo(
    () => getAssignedUsers(manager ?? undefined),
    [manager],
  );

  const connectedAccountants = useMemo(() => {
    const seen = new Set<number | string>();
    const unique: AdminRecord[] = [];

    assignedUsers.forEach((item) => {
      const accountant = getAccountant(item);
      if (!accountant?.id || seen.has(accountant.id)) {
        return;
      }

      seen.add(accountant.id);
      unique.push(accountant);
    });

    return unique;
  }, [assignedUsers]);

  const handleDelete = async () => {
    if (!manager || typeof manager.id !== "number") {
      return;
    }

    if (assignedUsers.length > 0) {
      toast.error("This relationship manager still has assigned users.");
      return;
    }

    const confirmed = window.confirm("Delete this relationship manager permanently?");
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await adminApi.deleteUser(manager.id);
      toast.success("Relationship manager deleted successfully");
      router.push("/admin/relationship-managers");
    } catch (nextError) {
      const message = getErrorMessage(nextError, "Failed to delete relationship manager.");
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
          <LoadingState label="Loading relationship manager details..." />
        </AdminLayout>
      </AuthGuard>
    );
  }

  if (!manager) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <div className="rounded-[2rem] border border-gray-100 bg-white p-8 text-center shadow-[var(--admin-card-shadow)]">
            <p className="text-lg font-black text-gray-900">Relationship manager not found.</p>
            <Link
              href="/admin/relationship-managers"
              className="mt-4 inline-flex rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
            >
              Back to Relationship Managers
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
                  href="/admin/relationship-managers"
                  className="text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
                >
                  {"<- Back to Relationship Managers"}
                </Link>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">
                  {String(manager.name ?? "Relationship Manager")}
                </h1>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  RM ID: {String(getRmUniqueId(manager) ?? "N/A")}
                </p>
              </div>

              <button
                onClick={() => void handleDelete()}
                disabled={deleting || assignedUsers.length > 0}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${deleting || assignedUsers.length > 0
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                  }`}
              >
                {deleting ? "Deleting..." : "Delete Manager"}
              </button>
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
                        href={`mailto:${manager.email}`}
                        className="text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900 break-all"
                      >
                        {String(manager.email ?? "-")}
                      </a>
                      {Boolean(manager.email) && (
                        <button
                          onClick={() => {
                            void navigator.clipboard.writeText(String(manager.email));
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
                      {getMobileNumber(manager) ? (
                        <a
                          href={`tel:${getMobileNumber(manager)}`}
                          className="text-sm font-semibold text-gray-700 transition-colors hover:text-blue-600"
                        >
                          {String(getMobileNumber(manager))}
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-gray-700">-</span>
                      )}
                    </div>
                  </div>

                  {/* Region */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Region
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-700 break-words">
                      {getLocationDisplay(manager)}
                    </p>
                  </div>

                  {/* Joined Date */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Joined Date
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      {formatAdminDate(getCreatedAt(manager))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Performance & Metrics */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SummaryStat label="Assigned Users" value={assignedUsers.length} tone="blue" />
                <SummaryStat
                  label="Active Services"
                  value={String(manager.active_services_count ?? 0)}
                  tone="emerald"
                />
                <SummaryStat
                  label="Revenue"
                  value={formatAdminCurrency(
                    typeof manager.total_revenue === "string" ||
                      typeof manager.total_revenue === "number"
                      ? manager.total_revenue
                      : 0,
                  )}
                  tone="amber"
                />
                <SummaryStat
                  label="Performance"
                  value={String(manager.performance_score ?? "Inactive")}
                  tone="indigo"
                />
              </div>
            </div>
          </div>

          <DetailSection
            title="Assigned Users"
            subtitle="Users currently handled by this relationship manager."
          >
            {assignedUsers.length === 0 ? (
              <EmptySection label="No users are assigned to this manager." icon="fa-users" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[980px] w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        User
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Accountant
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Location
                      </th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Open
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assignedUsers.map((item) => (
                      <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-gray-900">
                            {String(item.name ?? "User")}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Joined {formatAdminDate(getCreatedAt(item))}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-700">
                            {String(item.email ?? "-")}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {String(getMobileNumber(item) ?? "No phone")}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                          {String(getAccountant(item)?.name ?? "Unassigned")}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                          {getLocationDisplay(item)}
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

          <DetailSection
            title="Connected Accountants"
            subtitle="Accountants currently linked through this manager's assigned users."
          >
            {connectedAccountants.length === 0 ? (
              <EmptySection
                label="No accountants are connected to this manager yet."
                icon="fa-calculator"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[920px] w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Accountant
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Email
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Accountant ID
                      </th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Open
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {connectedAccountants.map((item) => (
                      <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                        <td className="px-6 py-4 text-sm font-black text-gray-900">
                          {String(item.name ?? "Accountant")}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                          {String(item.email ?? "-")}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                          {String(item.accountantUniqueId ?? item.accountant_unique_id ?? "N/A")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/accountants/${item.id}`}
                            className="admin-icon-btn-soft"
                            title="View accountant"
                            aria-label="View accountant"
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
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
