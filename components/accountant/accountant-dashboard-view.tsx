"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAccountantDashboard } from "@/lib/features/accountant/accountant-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { InsightBarChart } from "@/components/dashboard/insight-bar-chart";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { useStoredUser } from "@/lib/auth/hooks";
import { PanelLogoLoader } from "@/components/ui/logo-loader";

export function AccountantDashboardView() {
  const dispatch = useAppDispatch();
  const { stats, serviceRequests, loading } = useAppSelector(
    (state) => state.accountant,
  );
  const user = useStoredUser();

  const priorityRequests = useMemo(
    () =>
      serviceRequests
        .filter((request: any) =>
          ["update_required", "under_review", "applied"].includes(request.status),
        )
        .slice(0, 3),
    [serviceRequests],
  );
  const recentRequests = useMemo(() => serviceRequests.slice(0, 5), [serviceRequests]);
  const pipelineChartData = useMemo(() => {
    const draftBuckets = [
      {
        label: "New Assigned",
        value: serviceRequests.filter((request: any) => request.status === "applied").length,
        tone: "blue" as const,
        helper: "Freshly assigned to you",
      },
      {
        label: "Under Review",
        value: serviceRequests.filter((request: any) => request.status === "under_review").length,
        tone: "indigo" as const,
        helper: "Documents being verified",
      },
      {
        label: "Processing",
        value: serviceRequests.filter((request: any) =>
          ["in_progress", "paid", "document_collection"].includes(request.status),
        ).length,
        tone: "amber" as const,
        helper: "Active execution work",
      },
      {
        label: "Sent to CA",
        value: serviceRequests.filter((request: any) => request.status === "submitted_to_ca").length,
        tone: "slate" as const,
        helper: "Waiting on final approval",
      },
      {
        label: "Action Required",
        value: serviceRequests.filter((request: any) => request.status === "update_required").length,
        tone: "rose" as const,
        helper: "Needs client correction",
      },
      {
        label: "Completed",
        value: serviceRequests.filter((request: any) =>
          ["completed", "approved"].includes(request.status),
        ).length,
        tone: "emerald" as const,
        helper: "Closed successfully",
      },
    ];

    const bucketTotal = draftBuckets.reduce((sum, item) => sum + item.value, 0);
    const unmatchedCount = Math.max(serviceRequests.length - bucketTotal, 0);

    return unmatchedCount > 0
      ? [
          ...draftBuckets,
          {
            label: "Other States",
            value: unmatchedCount,
            tone: "slate" as const,
            helper: "Statuses outside the main workflow",
          },
        ]
      : draftBuckets;
  }, [serviceRequests]);

  useEffect(() => {
    dispatch(fetchAccountantDashboard());
  }, [dispatch]);

  return (
    <AuthGuard allowedRoles={["accountant"]}>
      <AdminLayout>
        <div className="panel-page">
          <section className="panel-hero overflow-hidden p-5 sm:p-6 lg:p-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                  Accountant Panel
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 lg:text-5xl">
                  Accountant Workspace
                </h1>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                    Operations Desk
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
                    {user?.name || "Accountant"}
                  </span>
                </div>
              </div>

              <div className="panel-card bg-white/95 p-5 sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Daily Snapshot
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Open Queue
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-950">
                      {stats.totalRequests}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Action Now
                    </p>
                    <p className="mt-2 text-3xl font-black text-rose-600">
                      {stats.actionRequired}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="New Assigned"
              value={stats.newAssignments}
              icon="fa-user-tag"
              color="blue"
            />
            <StatCard
              label="In Processing"
              value={stats.ongoing}
              icon="fa-spinner"
              color="amber"
            />
            <StatCard
              label="Under Review"
              value={stats.underReview}
              icon="fa-search"
              color="indigo"
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon="fa-check-circle"
              color="emerald"
            />
            <StatCard
              label="Total Clients"
              value={stats.totalClients}
              icon="fa-users"
              color="slate"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-4 sm:space-y-6 xl:col-span-2">
              <div className="panel-table-shell min-h-[500px]">
                <div className="panel-section-header border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                      Active Work Queue
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Your latest filings, ordered for quick follow-up.
                    </p>
                  </div>
                  <span className="panel-chip">
                    {serviceRequests.length} tasks
                  </span>
                </div>

                <div className="space-y-4 p-4 md:hidden">
                  {loading ? (
                    <PanelLogoLoader
                      className="panel-empty-state min-h-[16rem] px-0 py-0"
                      label="Loading assignments..."
                      size={54}
                      surfaceClassName="max-w-md"
                    />
                  ) : recentRequests.length === 0 ? (
                    <div className="panel-empty-state px-5 py-14 text-center text-sm font-medium">
                      No assigned tasks
                    </div>
                  ) : (
                    recentRequests.map((request: any) => (
                      <Link
                        key={String(request.id)}
                        href={`/accountant/service-requests/${request.id}`}
                        className="panel-card block p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900">
                              {request.service?.name}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">
                              {request.user?.name}
                            </p>
                          </div>
                          <StatusIndicator status={request.status} />
                        </div>
                        <div className="mt-4 inline-flex h-10 items-center rounded-xl bg-blue-900 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                          Process Task
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left">
                    <thead className="panel-table-head">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Service / Client
                        </th>
                        <th className="px-8 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Status
                        </th>
                        <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={3} className="px-8 py-24 text-center">
                            <PanelLogoLoader
                              className="min-h-0 px-0 py-0"
                              label="Loading assignments..."
                              size={54}
                              surfaceClassName="max-w-md"
                            />
                          </td>
                        </tr>
                      ) : serviceRequests.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-8 py-24 text-center">
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                              No assigned tasks
                            </p>
                          </td>
                        </tr>
                      ) : (
                        recentRequests.map((request: any, index: number) => (
                          <tr
                            key={buildCollectionKey(
                              request,
                              index,
                              "accountant-dashboard-request",
                              [request.user?.email, request.service?.name],
                            )}
                            className="transition-colors hover:bg-blue-50/40"
                          >
                            <td className="px-8 py-6">
                              <h4 className="mb-1 text-sm font-black text-slate-900">
                                {request.service?.name}
                              </h4>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {request.user?.name}
                              </p>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <StatusIndicator status={request.status} />
                            </td>
                            <td className="px-8 py-6 text-right">
                              <Link
                                href={`/accountant/service-requests/${request.id}`}
                                className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-[9px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-600"
                              >
                                Process Task
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div className="panel-card-dark p-6 text-white sm:p-8">
                <h3 className="mb-6 text-xl font-black tracking-tight">
                  Performance
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Resolution Rate</span>
                      <span>
                        {Math.round(
                          (stats.completed / Math.max(stats.totalRequests, 1)) * 100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-1000"
                        style={{
                          width: `${(stats.completed / Math.max(stats.totalRequests, 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                      <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Total
                      </p>
                      <p className="text-2xl font-black">{stats.totalRequests}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                      <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-rose-500">
                        Urgent
                      </p>
                      <p className="text-2xl font-black text-rose-400">
                        {stats.actionRequired}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel-card p-5 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-900">
                      Attention Queue
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Requests to review first.
                    </p>
                  </div>
                  <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">
                    Priority
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {priorityRequests.length === 0 ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-5 text-sm font-medium text-slate-500">
                      No urgent requests right now.
                    </div>
                  ) : (
                    priorityRequests.map((request: any) => (
                      <Link
                        key={String(request.id)}
                        href={`/accountant/service-requests/${request.id}`}
                        className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">
                              {request.service?.name}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">
                              {request.user?.name}
                            </p>
                          </div>
                          <StatusIndicator status={request.status} />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
