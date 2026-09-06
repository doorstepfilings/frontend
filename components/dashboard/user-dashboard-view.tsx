"use client";

import { PageLogoLoader } from "@/components/ui/logo-loader";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { fetchMyServices } from "@/lib/features/services/services-slice";
import { useStoredUser } from "@/lib/auth/hooks";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { formatDateWithPattern } from "@/lib/utils/formatters";
import { buildCollectionKey } from "@/lib/utils/list-keys";
import { getStatusLabel, getStatusColorClass } from "@/lib/utils/status-helpers";

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
          ["in_progress", "under_review", "document_collection", "update_required"].includes(
            service.status,
          ),
        ).length || 0,
      completed:
        myServices?.filter((service) => service.status === "completed").length || 0,
    }),
    [myServices],
  );

  const recentServices = useMemo(
    () =>
      [...(myServices || [])]
        .sort(
          (left, right) =>
            new Date(
              right.order_created_at || right.created_at || 0,
            ).getTime() -
            new Date(
              left.order_created_at || left.created_at || 0,
            ).getTime(),
        )
        .slice(0, 5),
    [myServices],
  );



  if (loading) {
    return (
      <PageLogoLoader label="Loading dashboard..." />
    );
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
          <div className="flex items-center justify-between gap-3 border-b border-gray-50 p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
            <Link
              href="/dashboard/services"
              className="shrink-0 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>

          <div className="flex-1">
            {recentServices.length === 0 ? (
              <div className="p-6 text-center text-gray-500 sm:p-12">
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
                    className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <i className="fas fa-file-invoice" />
                      </div>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-gray-900">
                          {service.service?.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateWithPattern(
                            service.order_created_at ||
                              service.created_at,
                            "d MMM yyyy",
                            "N/A",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusColorClass(
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
          {/* Doorstep Suite Quick Card */}
          <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-white to-teal-500/10 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Connected Product
              </span>
              <Link
                href="/dashboard/connected-apps"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Manage &rarr;
              </Link>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                <i className="fas fa-calculator" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Doorstep Books</h3>
                <p className="text-xs text-gray-500">Accounting, Invoicing &amp; GST</p>
              </div>
            </div>
            <Link
              href="/dashboard/connected-apps"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 py-2 text-xs font-bold text-white shadow-sm hover:from-emerald-700 hover:to-teal-800 transition-all"
            >
              <i className="fas fa-cubes text-xs" />
              <span>Open Suite &amp; Sync</span>
            </Link>
          </div>

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

          <div className="rounded-xl bg-blue-900 p-6 text-center text-white shadow-lg shadow-blue-900/10">
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
          </div>
        </div>
      </div>
    </div>
  );
}
