"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useConfirm } from "@/hooks/use-confirm";
import { adminApi } from "@/lib/api/admin-api";
import {
  asArray,
  type AdminRecord,
  getAssignedAccountantUsers,
  getCreatedAt,
  getMobileNumber,
  getRegionalManager,
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

function getStatusBadgeClass(status: string | null | undefined) {
  if (status === "approved" || status === "completed") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  }

  if (status === "rejected" || status === "cancelled" || status === "refunded") {
    return "bg-rose-50 text-rose-700 border border-rose-100";
  }

  if (status === "update_required") {
    return "bg-amber-50 text-amber-700 border border-amber-100";
  }

  return "bg-blue-50 text-blue-700 border border-blue-100";
}

export function AccountantDetailView() {
  const params = useParams();
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const id = String(params?.id ?? "");
  const [accountant, setAccountant] = useState<AdminRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      if (!id) {
        setLoading(false);
        setError("Accountant ID is missing.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await adminApi.getAccountantDetails(Number(id));
        setAccountant(response.data?.data ?? response.data);
      } catch (nextError) {
        setError(getErrorMessage(nextError, "Unable to load accountant details."));
      } finally {
        setLoading(false);
      }
    };

    void loadDetails();
  }, [id]);

  const assignedUsers = useMemo(
    () => getAssignedAccountantUsers(accountant ?? undefined),
    [accountant],
  );
  const services = useMemo(
    () => asArray(accountant?.services),
    [accountant],
  );

  const handleDelete = async () => {
    if (!accountant || typeof accountant.id !== "number") {
      return;
    }

    if (assignedUsers.length > 0) {
      toast.error("This accountant still has assigned users.");
      return;
    }

    const confirmed = await confirm({
      title: "Delete accountant?",
      message: "This permanently removes the accountant from the directory.",
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await adminApi.deleteUser(accountant.id);
      toast.success("Accountant deleted successfully");
      router.push("/admin/accountants");
    } catch (nextError) {
      const message = getErrorMessage(nextError, "Failed to delete accountant.");
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
          <LoadingState label="Loading accountant details..." />
        </AdminLayout>
      </AuthGuard>
    );
  }

  if (!accountant) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <div className="rounded-[2rem] border border-gray-100 bg-white p-8 text-center shadow-[var(--admin-card-shadow)]">
            <p className="text-lg font-black text-gray-900">Accountant not found.</p>
            <Link
              href="/admin/accountants"
              className="mt-4 inline-flex rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
            >
              Back to Accountants
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
                  href="/admin/accountants"
                  className="text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
                >
                  {"<- Back to Accountants"}
                </Link>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">
                  {String(accountant.name ?? "Accountant")}
                </h1>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Accountant ID:{" "}
                  {String(accountant.accountantUniqueId ?? accountant.accountant_unique_id ?? "N/A")}
                </p>
              </div>

              <button
                onClick={() => void handleDelete()}
                disabled={deleting || assignedUsers.length > 0}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                  deleting || assignedUsers.length > 0
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                }`}
              >
                {deleting ? "Deleting..." : "Delete Accountant"}
              </button>
            </div>
          </section>

          {error && <ErrorBanner message={error} />}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <SummaryStat label="Email" value={String(accountant.email ?? "-")} />
            <SummaryStat label="Phone" value={String(getMobileNumber(accountant) ?? "-")} />
            <SummaryStat label="Joined" value={formatAdminDate(getCreatedAt(accountant))} />
            <SummaryStat label="Region" value={getLocationDisplay(accountant)} />
            <SummaryStat label="Assigned Users" value={assignedUsers.length} tone="blue" />
            <SummaryStat
              label="Completion Rate"
              value={`${String(accountant.completion_rate ?? 0)}%`}
              tone="emerald"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SummaryStat
              label="Active Services"
              value={String(accountant.active_services_count ?? services.length)}
              tone="amber"
            />
            <SummaryStat
              label="Revenue"
              value={formatAdminCurrency(
                typeof accountant.total_revenue === "string" ||
                  typeof accountant.total_revenue === "number"
                  ? accountant.total_revenue
                  : 0,
              )}
              tone="indigo"
            />
          </div>

          <DetailSection
            title="Assigned Users"
            subtitle="Users currently assigned to this accountant."
          >
            {assignedUsers.length === 0 ? (
              <EmptySection label="No users are assigned to this accountant." icon="fa-users" />
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
                        Relationship Manager
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
                          {String(getRegionalManager(item)?.name ?? "Unassigned")}
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
            title="Service Applications"
            subtitle="Service applications currently linked to this accountant."
          >
            {services.length === 0 ? (
              <EmptySection
                label="No service applications were found for this accountant."
                icon="fa-clipboard-list"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1080px] w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Service
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Client
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Status
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Amount
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
                    {services.map((item) => (
                      <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-gray-900">
                            {String((item.service as AdminRecord | undefined)?.name ?? "Service")}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {(item.service as AdminRecord | undefined)?.category
                              ? String(
                                  ((item.service as AdminRecord | undefined)?.category as AdminRecord)
                                    ?.name ?? "",
                                )
                              : ""}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {(item.user as AdminRecord | undefined)?.id ? (
                            <Link
                              href={`/admin/users/${(item.user as AdminRecord).id}`}
                              className="text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900"
                            >
                              {String((item.user as AdminRecord).name ?? "User")}
                            </Link>
                          ) : (
                            <span className="text-sm font-semibold text-gray-700">-</span>
                          )}
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
                          {formatAdminCurrency(
                            typeof item.amount === "string" || typeof item.amount === "number"
                              ? item.amount
                              : 0,
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                          {formatAdminDate(getCreatedAt(item))}
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
        </div>
      </AdminLayout>
      <ConfirmDialog />
    </AuthGuard>
  );
}
