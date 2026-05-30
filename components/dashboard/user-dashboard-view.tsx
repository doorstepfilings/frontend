"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { fetchMyServices } from "@/lib/features/services/services-slice";
import { useStoredUser } from "@/lib/auth/hooks";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { formatDateWithPattern } from "@/lib/utils/formatters";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { getStatusLabel } from "@/lib/utils/status-helpers";
import { DetailViewSkeleton } from "@/components/ui/skeletons/detail-view-skeleton";

export function UserDashboardView() {
  const dispatch = useAppDispatch();
  const { myServices, loading } = useAppSelector((state) => state.services);
  const user = useStoredUser();

  useEffect(() => {
    void dispatch(fetchMyServices());
  }, [dispatch]);

  const stats = useMemo(
    () => ({
      total: myServices?.length || 0,
      applied:
        myServices?.filter((service) => service.status === "applied").length || 0,
      inProgress:
        myServices?.filter((service) =>
          ["in_progress", "under_review", "submitted_to_ca"].includes(
            service.status,
          ),
        ).length || 0,
      completed:
        myServices?.filter((service) =>
          ["completed", "approved"].includes(service.status),
        ).length || 0,
    }),
    [myServices],
  );

  const recentServices = useMemo(() => (myServices || []).slice(0, 5), [myServices]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      applied: "bg-blue-100 text-blue-700",
      in_progress: "bg-amber-100 text-amber-700",
      under_review: "bg-cyan-100 text-cyan-700",
      submitted_to_ca: "bg-indigo-100 text-indigo-700",
      completed: "bg-green-100 text-green-700",
      approved: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      rejected: "bg-red-100 text-red-700",
    };

    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return <DetailViewSkeleton />;
  }

  const statCards = [
    {
      label: "All Services",
      value: stats.total,
      icon: "fa-clipboard-list",
      color: "bg-blue-100 text-blue-600",
      path: "/dashboard/services",
    },
    {
      label: "New Applications",
      value: stats.applied,
      icon: "fa-paper-plane",
      color: "bg-blue-100 text-blue-600",
      path: "/dashboard/services",
    },
    {
      label: "Processing",
      value: stats.inProgress,
      icon: "fa-spinner",
      color: "bg-amber-100 text-amber-600",
      path: "/dashboard/services",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: "fa-check-circle",
      color: "bg-green-100 text-green-600",
      path: "/dashboard/services",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {user?.name}. Here&apos;s an overview of your account.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.path}
            className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}
              >
                <i className={`fas ${card.icon} text-lg`} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-50 p-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
            <Link
              href="/dashboard/services"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>

          <div className="flex-1">
            {recentServices.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <i className="fas fa-clipboard-list mb-4 text-4xl text-gray-200" />
                <p>No recent applications found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentServices.map((service, index) => (
                  <Link
                    key={buildCollectionKey(service, index, "dashboard-recent-service", [
                      service.id,
                      service.service?.name,
                    ])}
                    href={`/dashboard/services/${service.id}`}
                    className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <i className="fas fa-file-invoice" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {service.service?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateWithPattern(service.created_at, "d MMM yyyy", "N/A")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(
                          service.status,
                        )}`}
                      >
                        {getStatusLabel(service.status)}
                      </span>
                      <i className="fas fa-chevron-right text-xs text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/services"
                className="group flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-blue-900 transition-colors hover:bg-blue-50"
              >
                <i className="fas fa-plus-circle text-sm text-blue-600" />
                <span className="text-sm font-semibold">New Application</span>
              </Link>
              <Link
                href="/dashboard/documents"
                className="group flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-blue-900 transition-colors hover:bg-blue-50"
              >
                <i className="fas fa-folder-open text-sm text-blue-600" />
                <span className="text-sm font-semibold">My Documents</span>
              </Link>
              <Link
                href="/dashboard/reports"
                className="group flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-blue-900 transition-colors hover:bg-blue-50"
              >
                <i className="fas fa-file-alt text-sm text-blue-600" />
                <span className="text-sm font-semibold">Service Reports</span>
              </Link>
            </div>
          </div>

            {/* <div className="rounded-xl bg-blue-900 p-6 text-center text-white shadow-lg shadow-blue-900/10">
              <h3 className="mb-2 text-lg font-bold">Need Assistance?</h3>
              <p className="mb-4 text-xs text-blue-100">
                Get professional support for your business needs.
              </p>
              <a
                href="https://wa.me/919898196396"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-2 text-sm font-bold text-blue-900 transition-colors hover:bg-blue-50"
              >
                <i className="fab fa-whatsapp" /> Chat with Expert
              </a>
            </div> */}
        </div>
      </div>
    </div>
  );
}
