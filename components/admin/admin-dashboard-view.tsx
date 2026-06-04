"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAdminStats, fetchRecentActivity } from "@/lib/features/admin/admin-slice";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { DetailViewSkeleton } from "@/components/ui/skeletons/detail-view-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { InsightBarChart } from "@/components/dashboard/insight-bar-chart";
import { SearchSelect } from "@/components/ui/core/search-select";
import { PanelLogoLoader } from "@/components/ui/logo-loader";

type ActivityItem = {
  id?: number | string;
  activityType?: string | null;
  type?: string | null;
  name?: string | null;
  email?: string | null;
  message?: string | null;
  created_at?: string | Date | null;
  createdAt?: string | Date | null;
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
  const rawDate = item.created_at ?? item.createdAt ?? item.date ?? null;
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
  const rawDate = item.created_at ?? item.createdAt ?? item.date ?? "unknown-time";

  return `${activityType}-${String(rawId)}-${String(rawDate)}-${index}`;
}

function getStatusColor(status?: string | null) {
  switch ((status ?? "").toLowerCase()) {
    case "pending":
    case "applied":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "paid":
    case "responded":
    case "under_review":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "processing":
    case "in_progress":
    case "submitted_to_ca":
      return "bg-cyan-100 text-cyan-700 border-cyan-200";
    case "completed":
    case "approved":
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
  dotClassName: string;
  barClassName: string;
  footerLabel: string;
};

function RadarMetric({
  label,
  pending,
  total,
  dotClassName,
  barClassName,
  footerLabel,
}: RadarMetricProps) {
  const safeTotal = Math.max(total, pending, 1);
  const progress = Math.round(((safeTotal - pending) / safeTotal) * 100);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs font-black">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${dotClassName} animate-pulse`} />
          <span className="text-blue-200 uppercase tracking-widest">{label}</span>
        </div>
        <span className="font-bold text-white">{pending} pending</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barClassName}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[9px] text-blue-200">
        <span>{footerLabel}</span>
        <span>{progress}%</span>
      </div>
    </div>
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
      color: "blue" as const,
      link: "/admin/users",
    },
    {
      label: "Managers",
      value: resolvedStats.rms ?? 0,
      icon: "fa-user-tie",
      color: "amber" as const,
      link: "/admin/regional-managers",
    },
    {
      label: "Accountants",
      value: resolvedStats.accountants ?? 0,
      icon: "fa-calculator",
      color: "emerald" as const,
      link: "/admin/accountants",
    },
    {
      label: "Service Catalog",
      value: resolvedStats.services ?? 0,
      icon: "fa-briefcase",
      color: "indigo" as const,
      link: "/admin/services",
    },
    {
      label: "Pending Tasks",
      value: pendingEnquiries + pendingApplications,
      icon: "fa-clock",
      color: "rose" as const,
      link: "/admin/enquiries",
    },
  ];

  const filteredActivity = recentActivity;

  const activityChartData = useMemo(() => {
    const counts = {
      application: 0,
      enquiry: 0,
      user: 0,
      activity: 0,
    };

    filteredActivity.forEach((item) => {
      const activityType = getActivityType(item);
      if (activityType === "application") {
        counts.application += 1;
        return;
      }

      if (activityType === "enquiry") {
        counts.enquiry += 1;
        return;
      }

      if (activityType === "user") {
        counts.user += 1;
        return;
      }

      counts.activity += 1;
    });

    return [
      {
        label: "Applications",
        value: counts.application,
        tone: "blue" as const,
        helper: "Service requests created",
      },
      {
        label: "Enquiries",
        value: counts.enquiry,
        tone: "emerald" as const,
        helper: "Client conversations",
      },
      {
        label: "Users",
        value: counts.user,
        tone: "indigo" as const,
        helper: "Registration activity",
      },
      {
        label: "Other Events",
        value: counts.activity,
        tone: "slate" as const,
        helper: "System and unmatched events",
      },
    ];
  }, [filteredActivity]);

  const isInitialLoading = statsLoading && activityLoading && !stats && recentActivity.length === 0;

  if (isInitialLoading) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <DetailViewSkeleton />
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="panel-page">
          <section className="panel-hero p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                Super Admin
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">
                Dashboard Overview
              </h1>
              <p className="mt-2 text-sm font-medium text-gray-500">
                Monitor system performance and stakeholder activity in real-time.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
                <span className="px-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Period
                </span>
                <div className="min-w-[150px]">
                  <SearchSelect
                    options={[
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                    ]}
                    value={timeRange}
                    onChange={setTimeRange}
                    triggerClassName="min-h-[2.5rem] rounded-xl px-3 py-2"
                    valueLabelClassName="text-[10px] font-black text-gray-600"
                    handleClassName="h-6 w-6 rounded-md border-0 bg-transparent text-slate-400"
                    selectStyle={{
                      boxShadow: "none",
                      borderColor: "transparent",
                      background: "#f8fafc",
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => loadData()}
                disabled={statsLoading || activityLoading}
                className="admin-btn justify-center rounded-2xl px-6 py-3.5 text-[11px] tracking-widest disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className={`fas fa-sync-alt ${statsLoading || activityLoading ? "animate-spin" : ""}`} />
                {statsLoading || activityLoading ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {statCards.map((card) => (
              <Link
                key={card.label}
                href={card.link}
                className="block"
              >
                <StatCard
                  label={card.label}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                />
              </Link>
            ))}
          </div>

          <InsightBarChart
            title="Recent Activity Mix"
            subtitle="Visual summary of the latest activity stream."
            totalLabel="Latest"
            totalValue={filteredActivity.length}
            emptyLabel="No recent activity was found."
            data={activityChartData}
          />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="panel-table-shell xl:col-span-2 min-h-[400px]">
              <div className="panel-section-header border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white p-5 sm:p-6">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Recent Activity Stream
                  </h2>
                  <p className="mt-1 text-[10px] font-medium text-gray-400">
                    Latest system events and user interactions
                  </p>
                </div>
                <Link
                  href="/admin/service-applications"
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-900 hover:underline"
                >
                  View All <i className="fas fa-arrow-right text-[8px]" />
                </Link>
              </div>
              <div className="space-y-3 p-4 md:hidden">
                {activityLoading && filteredActivity.length === 0 ? (
                  <PanelLogoLoader
                    className="panel-empty-state min-h-[16rem] px-0 py-0"
                    label="Fetching activity..."
                    size={54}
                    surfaceClassName="max-w-md"
                  />
                ) : filteredActivity.length === 0 ? (
                  <div className="panel-empty-state px-5 py-14 text-center text-sm font-medium">
                    No recent activity detected
                  </div>
                ) : (
                  filteredActivity.slice(0, 6).map((item: ActivityItem, index: number) => {
                    const activityType = getActivityType(item);
                    const activityName = getActivityName(item);
                    const activityUnit = getActivityUnit(item);
                    const activityStatus = getActivityStatus(item);
                    const activityDate = formatActivityDate(item);
                    const badge = getActivityBadge(activityType);
                    return (
                      <div key={getActivityKey(item, index)} className="panel-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${badge.iconWrap}`}>
                                <i className={`fas fa-${badge.icon} text-[10px]`} />
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${badge.badge}`}>
                                {activityType}
                              </span>
                            </div>
                            <p className="mt-3 text-sm font-black text-slate-900">{activityName}</p>
                            <p className="mt-1 text-[11px] font-medium text-slate-500">{activityUnit}</p>
                            <p className="mt-2 text-[10px] font-bold text-slate-400">{activityDate}</p>
                          </div>
                          <span className={`inline-block rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-widest ${getStatusColor(activityStatus)}`}>
                            {activityStatus}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="panel-table-head">
                    <tr className="bg-gradient-to-r from-gray-50 to-white">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Type
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Stakeholder
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Service Unit
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Timestamp
                      </th>
                      <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activityLoading && filteredActivity.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <PanelLogoLoader
                            className="min-h-0 px-0 py-0"
                            label="Fetching activity..."
                            size={56}
                            surfaceClassName="max-w-md"
                          />
                        </td>
                      </tr>
                    ) : filteredActivity.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                              <i className="fas fa-stream text-lg text-gray-300" />
                            </div>
                            <p className="text-sm font-medium italic text-gray-400">
                              No recent activity detected
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredActivity.map((item: ActivityItem, index: number) => {
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
                            className="group transition-colors hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent"
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${badge.iconWrap}`}>
                                  <i className={`fas fa-${badge.icon} text-[10px]`} />
                                </div>
                                <span className={`rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${badge.badge}`}>
                                  {activityType}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-sm font-bold text-blue-700">
                                  {avatarCharacter}
                                </div>
                                <div>
                                  <div className="text-sm font-black tracking-tight text-gray-900 transition-colors group-hover:text-blue-900">
                                    {activityName}
                                  </div>
                                  <div className="text-[10px] font-medium text-gray-400">
                                    {activityEmail}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="max-w-[220px]">
                                <div className="mb-1 truncate text-[11px] font-black tracking-tight text-gray-700">
                                  {activityUnit}
                                </div>
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-[8px] font-black uppercase text-gray-600">
                                  {badge.unitLabel}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-[10px] font-black text-gray-500">
                              <div className="flex items-center gap-2">
                                <i className="fas fa-clock text-[10px] text-gray-300" />
                                {activityDate}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <span className={`inline-block rounded-xl border-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest ${getStatusColor(activityStatus)}`}>
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

            <div className="panel-card-dark flex flex-col justify-between p-6 text-white sm:p-8">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                    <i className="fas fa-satellite-dish text-xl" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">Status Radar</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">
                      Real-time workload monitoring
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <RadarMetric
                    label="Service Applications"
                    pending={pendingApplications}
                    total={totalApplications}
                    dotClassName="bg-amber-400"
                    barClassName="bg-gradient-to-r from-amber-400 to-amber-500 shadow-lg shadow-amber-400/30"
                    footerLabel="Completion Progress"
                  />
                  <RadarMetric
                    label="Client Enquiries"
                    pending={pendingEnquiries}
                    total={totalEnquiries}
                    dotClassName="bg-emerald-400"
                    barClassName="bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-400/30"
                    footerLabel="Response Rate"
                  />
                </div>
              </div>

              <div className="pt-8">
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    href="/admin/service-applications"
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-4 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/20"
                  >
                    <i className="fas fa-file-invoice text-[10px] transition-transform group-hover:scale-110" />
                    <span>Review Applications</span>
                  </Link>
                  <Link
                    href="/admin/enquiries"
                    className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-4 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/20"
                  >
                    <i className="fas fa-envelope text-[10px] transition-transform group-hover:scale-110" />
                    <span>Handle Enquiries</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/users"
              className="panel-card group overflow-hidden border-blue-100/60 bg-gradient-to-br from-blue-50 to-white transition-all hover:-translate-y-0.5"
            >
              <div className="p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <i className="fas fa-user-plus text-lg text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight text-gray-900 transition-colors group-hover:text-blue-900">
                      Add New User
                    </h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                      Client Registration
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                    Quick Access
                  </span>
                  <i className="fas fa-arrow-right text-[10px] text-blue-400 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link
              href="/admin/services/create"
              className="panel-card group overflow-hidden border-indigo-100/60 bg-gradient-to-br from-indigo-50 to-white transition-all hover:-translate-y-0.5"
            >
              <div className="p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <i className="fas fa-plus-circle text-lg text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight text-gray-900 transition-colors group-hover:text-purple-900">
                      New Service
                    </h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                      Catalog Expansion
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">
                    Service Management
                  </span>
                  <i className="fas fa-arrow-right text-[10px] text-purple-400 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link
              href="/admin/categories"
              className="panel-card group overflow-hidden border-amber-100/60 bg-gradient-to-br from-amber-50 to-white transition-all hover:-translate-y-0.5"
            >
              <div className="p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                    <i className="fas fa-folder-plus text-lg text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight text-gray-900 transition-colors group-hover:text-amber-900">
                      Create Category
                    </h4>
                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                      Organization
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                    Taxonomy
                  </span>
                  <i className="fas fa-arrow-right text-[10px] text-amber-400 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
