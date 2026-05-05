"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { useStoredUser } from "@/lib/auth/hooks";
import { rmApi } from "@/lib/api/rm-api";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { getStatusLabel } from "@/lib/utils/status-helpers";

const TERMINAL_STATUSES = new Set(["approved", "cancelled", "completed", "rejected"]);
const REVIEW_STATUSES = new Set(["applied", "under_review", "update_required"]);

type RegionalUser = {
  id: number | string;
  accountant?: {
    name?: string | null;
  } | null;
  created_at?: string | null;
  email?: string | null;
  mobile_number?: string | null;
  name?: string | null;
};

type RegionalRequest = {
  id: number | string;
  accountant?: {
    name?: string | null;
  } | null;
  service?: {
    name?: string | null;
  } | null;
  status?: string | null;
  user?: {
    email?: string | null;
    name?: string | null;
  } | null;
};

export function RMDashboardView() {
  const user = useStoredUser();
  const [users, setUsers] = useState<RegionalUser[]>([]);
  const [requests, setRequests] = useState<RegionalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [usersRes, requestsRes] = await Promise.all([
          rmApi.getAssignedUsers(),
          rmApi.getServiceRequests(),
        ]);

        setUsers(usersRes.data?.data || []);
        setRequests(requestsRes.data?.data || []);
      } catch {
        toast.error("Failed to load regional dashboard");
      } finally {
        setLoading(false);
      }
    };

    void fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    const activeRequests = requests.filter(
      (request) => !TERMINAL_STATUSES.has(String(request.status || "").toLowerCase()),
    );

    return {
      assignedUsers: users.length,
      activeRequests: activeRequests.length,
      pendingReview: requests.filter((request) =>
        REVIEW_STATUSES.has(String(request.status || "").toLowerCase()),
      ).length,
      mappedAccountants: users.filter((account) => account.accountant).length,
    };
  }, [requests, users]);

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort((left, right) => {
          const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
          const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
          return rightTime - leftTime;
        })
        .slice(0, 5),
    [users],
  );

  const recentRequests = useMemo(() => requests.slice(0, 4), [requests]);

  return (
    <AuthGuard allowedRoles={["regional_manager"]}>
      <AdminLayout>
        <div className="space-y-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                Regional Overview
              </h1>
              <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-500 opacity-60">
                Operations Hub - {user?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Assigned Users" value={stats.assignedUsers} icon="fa-users" color="blue" />
            <StatCard label="Active Requests" value={stats.activeRequests} icon="fa-file-signature" color="amber" />
            <StatCard label="Pending Review" value={stats.pendingReview} icon="fa-user-check" color="emerald" />
            <StatCard label="Mapped Accountants" value={stats.mappedAccountants} icon="fa-user-tie" color="indigo" />
          </div>

          <div className="grid grid-cols-1 gap-10 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="rounded-[3rem] border border-slate-100 bg-white p-10 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight text-slate-900">
                    Recent Onboardings
                  </h3>
                  <Link
                    href="/rm/assigned-users"
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </Link>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : recentUsers.length === 0 ? (
                    <div className="rounded-[2rem] bg-slate-50 p-8 text-center text-sm font-bold uppercase tracking-widest text-slate-400">
                      No assigned users found
                    </div>
                  ) : (
                    recentUsers.map((account, index) => (
                      <div
                        key={buildCollectionKey(account, index, "rm-dashboard-user", [
                          account.email,
                          account.mobile_number,
                        ])}
                        className="flex items-center justify-between rounded-[2rem] bg-slate-50 p-6"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white font-black text-slate-500">
                            {account.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">
                              {account.name}
                            </h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              Joined{" "}
                              {account.created_at
                                ? new Date(account.created_at).toLocaleDateString()
                                : "recently"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-lg bg-blue-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-700">
                          {account.accountant ? "Mapped" : "Pending"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[3rem] border border-slate-100 bg-white p-10 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tight text-slate-900">
                    Service Pipeline
                  </h3>
                  <Link
                    href="/rm/service-requests"
                    className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                  >
                    Open Queue
                  </Link>
                </div>

                <div className="space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  ) : recentRequests.length === 0 ? (
                    <div className="rounded-[2rem] bg-slate-50 p-8 text-center text-sm font-bold uppercase tracking-widest text-slate-400">
                      No service requests found
                    </div>
                  ) : (
                    recentRequests.map((request, index) => (
                      <div
                        key={buildCollectionKey(request, index, "rm-dashboard-request", [
                          request.user?.email,
                          request.service?.name,
                        ])}
                        className="flex flex-col gap-4 rounded-[2rem] bg-slate-50 p-6 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <h4 className="text-sm font-black text-slate-900">
                            {request.service?.name || "Service Request"}
                          </h4>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {request.user?.name || "Unknown User"} -{" "}
                            {getStatusLabel(String(request.status || ""))}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-lg bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                            {request.accountant?.name || "Awaiting Assignment"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[3rem] bg-slate-900 p-10 text-white shadow-2xl shadow-slate-900/20">
                <h3 className="mb-8 text-xl font-black tracking-tight">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/rm/assigned-users"
                    className="flex h-14 w-full items-center gap-4 rounded-2xl bg-white/10 px-6 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/20"
                  >
                    <i className="fas fa-users text-blue-400"></i>
                    Review Assigned Users
                  </Link>
                  <Link
                    href="/rm/service-requests"
                    className="flex h-14 w-full items-center gap-4 rounded-2xl bg-white/10 px-6 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/20"
                  >
                    <i className="fas fa-file-export text-emerald-400"></i>
                    Review Service Queue
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}
