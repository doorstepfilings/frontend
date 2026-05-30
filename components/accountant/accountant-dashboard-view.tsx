"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchAccountantDashboard } from "@/lib/features/accountant/accountant-slice";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { useStoredUser } from "@/lib/auth/hooks";

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

  useEffect(() => {
    dispatch(fetchAccountantDashboard());
  }, [dispatch]);

  return (
    <AuthGuard allowedRoles={["accountant"]}>
      <AdminLayout>
        <div className="space-y-10 px-2 pb-20">
          <section className="overflow-hidden rounded-[2.5rem] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(239,246,255,0.92)_45%,_rgba(255,255,255,1)_72%)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] lg:p-8">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
                  Accountant Panel
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 lg:text-5xl">
                  Accountant Workspace
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500">
                  Review assigned filings, move active requests through milestones,
                  and focus first on applications that need corrections or
                  verification.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
                    Operations Desk
                  </span>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
                    {user?.name || "Accountant"}
                  </span>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
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

          <div className="grid grid-cols-1 gap-10 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="min-h-[500px] overflow-hidden rounded-[3rem] border border-slate-200/60 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-8 py-8 md:px-10">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-900">
                      Active Work Queue
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Your latest filings, ordered for quick follow-up.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                    {serviceRequests.length} tasks
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/60">
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
                            <div className="flex flex-col items-center gap-4">
                              <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Loading assignments...
                              </p>
                            </div>
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
                        serviceRequests.slice(0, 5).map((request: any, index: number) => (
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

            <div className="space-y-6">
              <div className="rounded-[3rem] bg-slate-900 p-10 text-white shadow-2xl shadow-slate-900/20">
                <h3 className="mb-8 text-xl font-black tracking-tight">
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

              <div className="rounded-[3rem] border border-slate-200/60 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
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
