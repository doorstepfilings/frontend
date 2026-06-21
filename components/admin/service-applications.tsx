"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { getStatusColor, getStatusLabel } from "@/lib/utils/status-helpers";
import { formatDate } from "@/lib/utils/formatters";
import { buildCollectionKey } from "@/lib/utils/list-keys";

type ServiceApplication = {
  amount: string | number;
  created_at: string;
  order_created_at?: string | null;
  id: number;
  service?: { name: string };
  status: string;
  user?: { email: string; name: string };
};

export function ServiceApplications() {
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadApplications() {
      setLoading(true);

      try {
        const response = await apiClient.get<{ data: ServiceApplication[] }>(
          "/service/admin/all-services",
          {
            params: { status: filter },
          },
        );
        setApplications(
          [...response.data.data].sort(
            (left, right) =>
              new Date(
                right.order_created_at || right.created_at || 0,
              ).getTime() -
              new Date(
                left.order_created_at || left.created_at || 0,
              ).getTime(),
          ),
        );
      } catch {
        console.error("Failed to load applications");
      } finally {
        setLoading(false);
      }
    }

    void loadApplications();
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {["all", "applied", "paid", "pending", "in_progress", "completed", "rejected"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                  filter === status
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {status}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  ID
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  User
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Service
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Amount
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Date
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-20 text-center text-xs font-bold uppercase tracking-widest text-slate-400"
                  >
                    Loading data...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-20 text-center text-xs font-bold uppercase tracking-widest text-slate-400"
                  >
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((application, index) => (
                  <tr
                    key={buildCollectionKey(application, index, "admin-service-application", [
                      application.user?.email,
                      application.service?.name,
                    ])}
                    className="transition-colors hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 text-xs font-bold font-mono text-slate-400">
                      #{application.id.toString().padStart(6, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">
                        {application.user?.name || "N/A"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {application.user?.email || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">
                        {application.service?.name || "N/A"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900">
                        INR {application.amount}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${getStatusColor(application.status)}`}
                      >
                        {getStatusLabel(application.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {formatDate(
                        application.order_created_at ||
                          application.created_at,
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-slate-400 transition-colors hover:text-blue-600">
                        <i className="fas fa-eye" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
