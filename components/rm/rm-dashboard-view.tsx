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
import { LogoLoader } from "@/components/ui/logo-loader";

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
        toast.error("Failed to load relationship manager dashboard");
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

  const recentRequests = useMemo(() => requests.slice(0, 4), [requests]);

  return (
    <AuthGuard allowedRoles={["relationship_manager"]}>
      <AdminLayout>
        <div className="space-y-6 sm:space-y-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="min-w-0">
              <h1 className="break-words text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Relationship Manager Overview
              </h1>
              <p className="mt-2 break-words text-xs font-bold uppercase tracking-widest text-slate-500 opacity-60 sm:text-sm">
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


              <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-6 lg:rounded-[3rem] lg:p-10">
                <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
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
                    <div className="py-8">
                      <LogoLoader size={40} label="Loading Pipeline..." />
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
                        className="flex flex-col gap-4 rounded-[2rem] bg-slate-50 p-4 sm:p-6 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <h4 className="break-words text-sm font-black text-slate-900">
                            {request.service?.name || "Service Request"}
                          </h4>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {request.user?.name || "Unknown User"} -{" "}
                            {getStatusLabel(String(request.status || ""))}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="break-words rounded-lg bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
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
              <div className="rounded-[2rem] bg-slate-900 p-5 text-white shadow-2xl shadow-slate-900/20 sm:p-6 lg:rounded-[3rem] lg:p-10">
                <h3 className="mb-8 text-xl font-black tracking-tight">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/rm/assigned-users"
                    className="flex min-h-14 w-full items-center gap-4 rounded-2xl bg-white/10 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/20 sm:px-6"
                  >
                    <i className="fas fa-users text-blue-400"></i>
                    Review Assigned Users
                  </Link>
                  <Link
                    href="/rm/service-requests"
                    className="flex min-h-14 w-full items-center gap-4 rounded-2xl bg-white/10 px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/20 sm:px-6"
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
