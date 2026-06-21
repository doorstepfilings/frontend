"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAdminStats, fetchRecentActivity } from "@/lib/features/admin/admin-slice";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { PageLogoLoader } from "@/components/ui/logo-loader";

type ActivityItem = {
  id?: number | string;
  activityType?: string | null;
  type?: string | null;
  name?: string | null;
  email?: string | null;
  message?: string | null;
  created_at?: string | Date | null;
  createdAt?: string | Date | null;
  order_created_at?: string | Date | null;
  orderCreatedAt?: string | Date | null;
  date?: string | Date | null;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  service_name?: string | null;
  service?: {
    name?: string | null;
    title?: string | null;
  } | string | null;
  status?: string | null;
};

type StatsShape = {
  users?: number;
  rms?: number;
  accountants?: number;
  categories?: number;
  services?: number;
  enquiries?: {
    total?: number;
    pending?: number;
  } | null;
  applications?: {
    total?: number;
    pending?: number;
  } | null;
};

function parseActivityMessage(message: string | null | undefined) {
  const trimmedMessage = typeof message === "string" ? message.trim() : "";
  if (!trimmedMessage) {
    return { name: null, unit: null };
  }

  const serviceMatch = trimmedMessage.match(/^(.+?)\s+applied for\s+(.+)$/i);
  if (serviceMatch) {
    return {
      name: serviceMatch[1]?.trim() || null,
      unit: serviceMatch[2]?.trim() || null,
    };
  }

  const userMatch = trimmedMessage.match(/^New user registered:\s*(.+)$/i);
  if (userMatch) {
    return {
      name: userMatch[1]?.trim() || null,
      unit: "User Registration",
    };
  }

  return { name: trimmedMessage, unit: null };
}

function getActivityType(item: ActivityItem) {
  if (typeof item.activityType === "string" && item.activityType.trim()) {
    return item.activityType.trim().toLowerCase();
  }

  const rawType = typeof item.type === "string" ? item.type.trim().toLowerCase() : "";
  if (rawType === "service_applied" || rawType.includes("service")) {
    return "application";
  }

  if (rawType === "new_user" || rawType.includes("user")) {
    return "user";
  }

  return "activity";
}

function getActivityName(item: ActivityItem) {
  const parsedMessage = parseActivityMessage(item.message);
  return item.name || item.user?.name || parsedMessage.name || "System Activity";
}

function getActivityEmail(item: ActivityItem) {
  return item.email || item.user?.email || "system event";
}

function getActivityUnit(item: ActivityItem) {
  const parsedMessage = parseActivityMessage(item.message);
  const service =
    item.service && typeof item.service === "object" ? item.service : null;

  if (typeof item.service === "string" && item.service.trim()) {
    return item.service;
  }

  return (
    item.service_name ||
    service?.name ||
    service?.title ||
    parsedMessage.unit ||
    "General Enquiry"
  );
}

function getActivityStatus(item: ActivityItem) {
  if (typeof item.status === "string" && item.status.trim()) {
    return item.status.trim();
  }

  const activityType = getActivityType(item);
  if (activityType === "application") {
    return "pending";
  }

  if (activityType === "enquiry") {
    return "responded";
  }

  if (activityType === "user") {
    return "new";
  }

  return "updated";
}

function formatActivityDate(item: ActivityItem) {
  const rawDate =
    getActivityType(item) === "application"
      ? item.order_created_at ??
        item.orderCreatedAt ??
        item.created_at ??
        item.createdAt ??
        item.date ??
        null
      : item.created_at ?? item.createdAt ?? item.date ?? null;
  if (!rawDate) {
    return "Unknown time";
  }

  const resolvedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
  return isValid(resolvedDate)
    ? format(resolvedDate, "dd MMM, hh:mm a")
    : "Unknown time";
}

function getActivityKey(item: ActivityItem, index: number) {
  const activityType = getActivityType(item);
  const rawId = item.id ?? "row";
  const rawDate =
    activityType === "application"
      ? item.order_created_at ??
        item.orderCreatedAt ??
        item.created_at ??
        item.createdAt ??
        item.date ??
        "unknown-time"
      : item.created_at ?? item.createdAt ?? item.date ?? "unknown-time";

  return `${activityType}-${String(rawId)}-${String(rawDate)}-${index}`;
}

function getStatusColor(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "applied":
    case "document_collection":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "in_progress":
      return "bg-cyan-100 text-cyan-700 border-cyan-200";
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "refunded":
    case "rejected":
    case "cancelled":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "new":
      return "bg-violet-100 text-violet-700 border-violet-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getActivityBadge(activityType: string) {
  if (activityType === "application") {
    return {
      badge: "bg-blue-50 text-blue-600",
      iconWrap: "bg-blue-100 text-blue-600",
      icon: "file-invoice",
      unitLabel: "Service Request",
    };
  }

  if (activityType === "enquiry") {
    return {
      badge: "bg-emerald-50 text-emerald-600",
      iconWrap: "bg-emerald-100 text-emerald-600",
      icon: "envelope",
      unitLabel: "Client Inquiry",
    };
  }

  if (activityType === "user") {
    return {
      badge: "bg-violet-50 text-violet-600",
      iconWrap: "bg-violet-100 text-violet-600",
      icon: "user-plus",
      unitLabel: "New User",
    };
  }

  return {
    badge: "bg-gray-100 text-gray-600",
    iconWrap: "bg-gray-100 text-gray-600",
    icon: "bell",
    unitLabel: "General Activity",
  };
}

type RadarMetricProps = {
  label: string;
  pending: number;
  total: number;
  href: string;
};

function RadarMetric({
  label,
  pending,
  total,
  href,
}: RadarMetricProps) {
  const safeTotal = Math.max(total, pending, 1);
  const progress = Math.round(((safeTotal - pending) / safeTotal) * 100);

  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            {pending}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
          {total} total
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-700 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        <span>Cleared</span>
        <span>{progress}%</span>
      </div>
    </Link>
  );
}

export function AdminDashboardView() {
  const dispatch = useAppDispatch();
  const { stats, recentActivity, statsLoading, activityLoading } = useAppSelector(
    (state) => state.admin,
  );
  const [timeRange, setTimeRange] = useState("today");

  const loadData = useCallback(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchRecentActivity());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resolvedStats: StatsShape = stats ?? {};
  const pendingEnquiries = resolvedStats.enquiries?.pending ?? 0;
  const totalEnquiries = resolvedStats.enquiries?.total ?? 0;
  const pendingApplications = resolvedStats.applications?.pending ?? 0;
  const totalApplications = resolvedStats.applications?.total ?? 0;

  const statCards = [
    {
      label: "Total Clients",
      value: resolvedStats.users ?? 0,
      icon: "fa-users",
      iconColors: "bg-blue-50 text-blue-700",
      link: "/admin/users",
      helper: "User directory",
    },
    {
      label: "Relationship Managers",
      value: resolvedStats.rms ?? 0,
      icon: "fa-user-tie",
      iconColors: "bg-amber-50 text-amber-700",
      link: "/admin/relationship-managers",
      helper: "Client ownership",
    },
    {
      label: "Accountants",
      value: resolvedStats.accountants ?? 0,
      icon: "fa-calculator",
      iconColors: "bg-emerald-50 text-emerald-700",
      link: "/admin/accountants",
      helper: "Service execution",
    },
    {
      label: "Service Catalog",
      value: resolvedStats.services ?? 0,
      icon: "fa-briefcase",
      iconColors: "bg-indigo-50 text-indigo-700",
      link: "/admin/services",
      helper: "Published services",
    },
    {
      label: "Pending Tasks",
      value: pendingEnquiries + pendingApplications,
      icon: "fa-clock",
      iconColors: "bg-rose-50 text-rose-700",
      link: "/admin/enquiries",
      helper: "Needs attention",
    },
  ];

  const isInitialLoading = statsLoading && activityLoading && !stats && recentActivity.length === 0;

  if (isInitialLoading) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <PageLogoLoader label="Initializing Dashboard..." />
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="w-full space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--admin-card-shadow)] sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                  Super Admin
                </p>
                <h1 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Dashboard Overview
                </h1>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  Monitor clients, work queues, team capacity, and catalog health from one operational view.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <span className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Period
                  </span>
                  <SearchableSelect
                    value={timeRange}
                    onChange={(event) => setTimeRange(event.target.value)}
                    options={[
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                    ]}
                    placeholder="Period"
                    size="sm"
                    className="min-w-[120px] flex-1"
                  />
                </div>
                <button
                  onClick={() => loadData()}
                  disabled={statsLoading || activityLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className={`fas fa-sync-alt ${statsLoading || activityLoading ? "animate-spin" : ""}`} />
                  {statsLoading || activityLoading ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {statCards.map((card) => (
              <Link
                key={card.label}
                href={card.link}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--admin-card-shadow)] transition-colors hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                      {card.value}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {card.helper}
                    </p>
                  </div>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.iconColors}`}>
                    <i className={`fas ${card.icon} text-sm`} />
                  </div>
                </div>
              </Link>
            ))}
          </section>

          <section className="space-y-6">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--admin-card-shadow)]">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div>
                  <h2 className="text-sm font-black tracking-tight text-slate-950">
                    Recent Activity
                  </h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Latest registrations, service applications, and system events.
                  </p>
                </div>
                <Link
                  href="/admin/service-applications"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700 transition-colors hover:bg-blue-50"
                >
                  View All <i className="fas fa-arrow-right text-[8px]" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[820px] w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white">
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Type
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Stakeholder
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Service Unit
                      </th>
                      <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Timestamp
                      </th>
                      <th className="px-5 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activityLoading && recentActivity.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center">
                          <PageLogoLoader label="Fetching Activity..." />
                        </td>
                      </tr>
                    ) : recentActivity.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                              <i className="fas fa-stream text-slate-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-400">
                              No recent activity detected
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      recentActivity.map((item: ActivityItem, index: number) => {
                        const activityType = getActivityType(item);
                        const activityName = getActivityName(item);
                        const activityEmail = getActivityEmail(item);
                        const activityUnit = getActivityUnit(item);
                        const activityStatus = getActivityStatus(item);
                        const activityDate = formatActivityDate(item);
                        const badge = getActivityBadge(activityType);
                        const avatarCharacter = activityName.charAt(0).toUpperCase();

                        return (
                          <tr
                            key={getActivityKey(item, index)}
                            className="transition-colors hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${badge.iconWrap}`}>
                                  <i className={`fas fa-${badge.icon} text-[10px]`} />
                                </div>
                                <span className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${badge.badge}`}>
                                  {activityType}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
                                  {avatarCharacter}
                                </div>
                                <div className="min-w-0">
                                  <div className="break-words text-sm font-black tracking-tight text-slate-900">
                                    {activityName}
                                  </div>
                                  <div className="break-all text-[10px] font-medium text-slate-400">
                                    {activityEmail}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="max-w-[240px]">
                                <div className="mb-1 truncate text-xs font-black tracking-tight text-slate-700">
                                  {activityUnit}
                                </div>
                                <span className="rounded-full bg-slate-100 px-2 py-1 text-[8px] font-black uppercase text-slate-500">
                                  {badge.unitLabel}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-[10px] font-black text-slate-500">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-clock text-slate-300" />
                                {activityDate}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className={`inline-block rounded-lg border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${getStatusColor(activityStatus)}`}>
                                {activityStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-[var(--admin-card-shadow)]">
                <div className="mb-4">
                  <h2 className="text-sm font-black tracking-tight text-slate-950">
                    Work Queue
                  </h2>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Pending work grouped by operating lane.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <RadarMetric
                    label="Service Applications"
                    pending={pendingApplications}
                    total={totalApplications}
                    href="/admin/service-applications"
                  />
                  <RadarMetric
                    label="Client Enquiries"
                    pending={pendingEnquiries}
                    total={totalEnquiries}
                    href="/admin/enquiries"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--admin-card-shadow)]">
                <h2 className="text-sm font-black tracking-tight text-slate-950">
                  Quick Actions
                </h2>
                <div className="mt-4 grid gap-3">
                  {[
                    { href: "/admin/users", label: "Add or manage users", icon: "fa-user-plus" },
                    { href: "/admin/services/create", label: "Create service", icon: "fa-plus-circle" },
                    { href: "/admin/categories", label: "Manage categories", icon: "fa-folder-plus" },
                  ].map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <i className={`fas ${action.icon} w-4 text-center text-blue-700`} />
                        <span className="break-words">{action.label}</span>
                      </span>
                      <i className="fas fa-arrow-right text-[10px] text-slate-400" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
