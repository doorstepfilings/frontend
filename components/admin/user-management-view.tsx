"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isValid } from "date-fns";
import { toast } from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchAccountants,
  fetchRMS,
  fetchUsers,
} from "@/lib/features/admin/admin-slice";
import { adminApi } from "@/lib/api/admin-api";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AuthGuard } from "@/components/auth/auth-guard";
import { normalizeRole } from "@/lib/auth/redirects";
import {
  type AdminRecord,
  getAccountant,
  getAccountantUniqueId,
  getAssignedAccountantUsers,
  getAssignedUsersCount,
  getCreatedAt,
  getMobileNumber,
  getRegionalManager,
  getRmUniqueId,
  getRole,
} from "@/lib/admin/record-helpers";

type ManagementType = "users" | "rms" | "accountants";
type WorkloadFilter = "all" | "active" | "idle" | "heavy";

type CreateFormState = {
  name: string;
  email: string;
  password: string;
  mobile_number: string;
  rm_id: string;
};

const pageMeta: Record<
  ManagementType,
  {
    title: string;
    eyebrow: string;
    description: string;
    buttonLabel: string;
    emptyLabel: string;
    defaultSortBy: string;
  }
> = {
  users: {
    title: "Users",
    eyebrow: "Super Admin",
    description: "Full-width user list with role, RM, and accountant controls.",
    buttonLabel: "Add User",
    emptyLabel: "No users matched the current filters.",
    defaultSortBy: "created",
  },
  rms: {
    title: "Regional Managers",
    eyebrow: "Super Admin",
    description: "Manager directory with assignment counts and direct profile access.",
    buttonLabel: "Add Manager",
    emptyLabel: "No regional managers matched the current filters.",
    defaultSortBy: "created",
  },
  accountants: {
    title: "Accountants",
    eyebrow: "Super Admin",
    description: "Accountant portfolio view with workload signals and detail pages.",
    buttonLabel: "Add Accountant",
    emptyLabel: "No accountants matched the current filters.",
    defaultSortBy: "created",
  },
};

const initialFormState: CreateFormState = {
  name: "",
  email: "",
  password: "",
  mobile_number: "",
  rm_id: "",
};

const routeMeta: Record<
  ManagementType,
  {
    href: string;
    countLabel: string;
    detailHref: (id: string | number) => string;
  }
> = {
  users: {
    href: "/admin/users",
    countLabel: "Users",
    detailHref: (id) => `/admin/users/${id}`,
  },
  rms: {
    href: "/admin/regional-managers",
    countLabel: "Regional Managers",
    detailHref: (id) => `/admin/regional-managers/${id}`,
  },
  accountants: {
    href: "/admin/accountants",
    countLabel: "Accountants",
    detailHref: (id) => `/admin/accountants/${id}`,
  },
};

function getErrorMessage(error: unknown, fallback: string) {
  const maybeError = error as { response?: { data?: { message?: string } } };
  return maybeError.response?.data?.message || fallback;
}

function formatJoinedDate(record: AdminRecord) {
  const rawDate = getCreatedAt(record);
  if (!rawDate) {
    return "Unknown";
  }

  const resolvedDate = new Date(rawDate);
  return isValid(resolvedDate) ? format(resolvedDate, "dd MMM yyyy") : "Unknown";
}

function getRoleLabel(role: string) {
  if (role === "super_admin") {
    return "Super Admin";
  }

  if (role === "regional_manager") {
    return "Regional Manager";
  }

  if (role === "accountant") {
    return "Accountant";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "User";
}

function getIdentityLabel(type: ManagementType, item: AdminRecord) {
  if (type === "rms") {
    return getRmUniqueId(item) || `RM-${String(item.id ?? "").padStart(4, "0")}`;
  }

  if (type === "accountants") {
    return (
      getAccountantUniqueId(item) || `ACC-${String(item.id ?? "").padStart(4, "0")}`
    );
  }

  const role = getRole(item);
  if (role === "super_admin") {
    return `SUPER-${String(item.id ?? "").padStart(4, "0")}`;
  }

  if (role === "admin") {
    return `ADMIN-${String(item.id ?? "").padStart(4, "0")}`;
  }

  return `USR-${String(item.id ?? "").padStart(4, "0")}`;
}

function getLocationLabel(record: AdminRecord) {
  const city = typeof record.city === "string" ? record.city : "";
  const state = typeof record.state === "string" ? record.state : "";

  if (city && state) {
    return `${city}, ${state}`;
  }

  if (city || state) {
    return city || state;
  }

  return "Not set";
}

export function UserManagementView({
  initialType = "users",
}: {
  initialType?: ManagementType;
}) {
  const dispatch = useAppDispatch();
  const { users, rms, accountants } = useAppSelector((state) => state.admin);
  const currentType = initialType;
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilter>("all");
  const [sortBy, setSortBy] = useState(pageMeta[currentType].defaultSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [formState, setFormState] = useState<CreateFormState>(initialFormState);

  const refreshData = async () => {
    setIsRefreshing(true);

    try {
      await Promise.all([
        dispatch(fetchUsers()),
        dispatch(fetchRMS()),
        dispatch(fetchAccountants()),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const loadDirectory = async () => {
      setIsRefreshing(true);

      try {
        await Promise.all([
          dispatch(fetchUsers()),
          dispatch(fetchRMS()),
          dispatch(fetchAccountants()),
        ]);
      } finally {
        setIsRefreshing(false);
      }
    };

    void loadDirectory();
  }, [dispatch]);

  const visibleUsers = useMemo(
    () =>
      users.filter((item: AdminRecord) => {
        const role = getRole(item);
        return role !== "regional_manager" && role !== "accountant";
      }),
    [users],
  );

  const userRoleStats = useMemo(
    () => ({
      users: visibleUsers.filter((item: AdminRecord) => getRole(item) === "user").length,
      admins: visibleUsers.filter((item: AdminRecord) => getRole(item) === "admin").length,
      superAdmins: visibleUsers.filter((item: AdminRecord) => getRole(item) === "super_admin")
        .length,
    }),
    [visibleUsers],
  );

  const accountantStats = useMemo(() => {
    const total = accountants.length;
    const active = accountants.filter(
      (item: AdminRecord) => getAssignedUsersCount(item) > 0,
    ).length;
    const heavy = accountants.filter(
      (item: AdminRecord) => getAssignedUsersCount(item) >= 6,
    ).length;
    const totalClients = accountants.reduce(
      (sum: number, item: AdminRecord) => sum + getAssignedUsersCount(item),
      0,
    );

    return {
      total,
      active,
      heavy,
      totalClients,
      avgLoad: total > 0 ? (totalClients / total).toFixed(1) : "0.0",
    };
  }, [accountants]);

  const currentData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (currentType === "users") {
      return visibleUsers
        .filter((item: AdminRecord) => {
          const role = getRole(item);
          const regionalManager = getRegionalManager(item);
          const accountant = getAccountant(item);

          const matchesRole = roleFilter === "all" || role === roleFilter;
          if (!matchesRole) {
            return false;
          }

          if (!query) {
            return true;
          }

          return [
            item.name,
            item.email,
            role,
            getMobileNumber(item),
            regionalManager?.name,
            getRmUniqueId(regionalManager ?? undefined),
            accountant?.name,
            getAccountantUniqueId(accountant ?? undefined),
            getIdentityLabel(currentType, item),
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        })
        .sort((left, right) => {
          if (sortBy === "name") {
            const leftName = String(left.name ?? "");
            const rightName = String(right.name ?? "");
            return sortOrder === "asc"
              ? leftName.localeCompare(rightName)
              : rightName.localeCompare(leftName);
          }

          if (sortBy === "email") {
            const leftEmail = String(left.email ?? "");
            const rightEmail = String(right.email ?? "");
            return sortOrder === "asc"
              ? leftEmail.localeCompare(rightEmail)
              : rightEmail.localeCompare(leftEmail);
          }

          if (sortBy === "role") {
            const leftRole = String(getRole(left));
            const rightRole = String(getRole(right));
            return sortOrder === "asc"
              ? leftRole.localeCompare(rightRole)
              : rightRole.localeCompare(leftRole);
          }

          const leftTime = new Date(getCreatedAt(left) || 0).getTime();
          const rightTime = new Date(getCreatedAt(right) || 0).getTime();
          return sortOrder === "asc" ? leftTime - rightTime : rightTime - leftTime;
        });
    }

    if (currentType === "rms") {
      return rms
        .filter((item: AdminRecord) => {
          if (!query) {
            return true;
          }

          return [
            item.name,
            item.email,
            getRmUniqueId(item),
            getMobileNumber(item),
            getLocationLabel(item),
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        })
        .sort((left, right) => {
          if (sortBy === "name") {
            const leftName = String(left.name ?? "");
            const rightName = String(right.name ?? "");
            return sortOrder === "asc"
              ? leftName.localeCompare(rightName)
              : rightName.localeCompare(leftName);
          }

          if (sortBy === "clients") {
            const leftCount = getAssignedUsersCount(left);
            const rightCount = getAssignedUsersCount(right);
            return sortOrder === "asc" ? leftCount - rightCount : rightCount - leftCount;
          }

          const leftTime = new Date(getCreatedAt(left) || 0).getTime();
          const rightTime = new Date(getCreatedAt(right) || 0).getTime();
          return sortOrder === "asc" ? leftTime - rightTime : rightTime - leftTime;
        });
    }

    return accountants
      .filter((item: AdminRecord) => {
        const assignedUsersCount = getAssignedUsersCount(item);

        const matchesWorkload =
          workloadFilter === "all" ||
          (workloadFilter === "active" && assignedUsersCount > 0) ||
          (workloadFilter === "idle" && assignedUsersCount === 0) ||
          (workloadFilter === "heavy" && assignedUsersCount >= 6);

        if (!matchesWorkload) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          item.name,
          item.email,
          getAccountantUniqueId(item),
          getMobileNumber(item),
          ...getAssignedAccountantUsers(item).map((user) => user.name),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((left, right) => {
        if (sortBy === "name") {
          const leftName = String(left.name ?? "");
          const rightName = String(right.name ?? "");
          return sortOrder === "asc"
            ? leftName.localeCompare(rightName)
            : rightName.localeCompare(leftName);
        }

        if (sortBy === "clients") {
          const leftCount = getAssignedUsersCount(left);
          const rightCount = getAssignedUsersCount(right);
          return sortOrder === "asc" ? leftCount - rightCount : rightCount - leftCount;
        }

        const leftTime = new Date(getCreatedAt(left) || 0).getTime();
        const rightTime = new Date(getCreatedAt(right) || 0).getTime();
        return sortOrder === "asc" ? leftTime - rightTime : rightTime - leftTime;
      });
  }, [
    accountants,
    currentType,
    rms,
    roleFilter,
    searchQuery,
    sortBy,
    sortOrder,
    visibleUsers,
    workloadFilter,
  ]);

  const assignedRmOptions = useMemo(
    () =>
      rms
        .filter((item: AdminRecord) => typeof item.id === "number")
        .map((item: AdminRecord) => ({
          id: Number(item.id),
          name: String(item.name ?? "Regional Manager"),
          code: getRmUniqueId(item) || "RM",
        })),
    [rms],
  );

  const assignedAccountantOptions = useMemo(
    () =>
      accountants
        .filter((item: AdminRecord) => typeof item.id === "number")
        .map((item: AdminRecord) => ({
          id: Number(item.id),
          name: String(item.name ?? "Accountant"),
          code: getAccountantUniqueId(item) || "ACC",
        })),
    [accountants],
  );

  const openCreateModal = () => {
    setFormState(initialFormState);
    setIsCreateOpen(true);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: formState.name.trim(),
        email: formState.email.trim(),
        role:
          currentType === "users"
            ? "user"
            : currentType === "rms"
              ? "regional_manager"
              : "accountant",
      };

      if (formState.password.trim()) {
        payload.password = formState.password.trim();
      }

      if (formState.mobile_number.trim()) {
        payload.mobile_number = formState.mobile_number.trim();
      }

      if (currentType === "users" && formState.rm_id) {
        payload.rm_id = Number(formState.rm_id);
      }

      await adminApi.storeUser(payload);
      toast.success(`${pageMeta[currentType].title.slice(0, -1)} created successfully`);
      setIsCreateOpen(false);
      setFormState(initialFormState);
      await refreshData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to create record"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: AdminRecord) => {
    const role = getRole(item);
    const isProtectedRole = normalizeRole(role) === "super_admin";
    const assignedUsersCount = getAssignedUsersCount(item);

    if (isProtectedRole) {
      toast.error("Super admin records cannot be deleted");
      return;
    }

    if ((currentType === "rms" || currentType === "accountants") && assignedUsersCount > 0) {
      toast.error("Please clear assigned users before deletion");
      return;
    }

    const confirmed = window.confirm("Delete this record permanently?");
    if (!confirmed || typeof item.id !== "number") {
      return;
    }

    setActiveActionKey(`delete-${item.id}`);

    try {
      await adminApi.deleteUser(item.id);
      toast.success("Record deleted successfully");
      await refreshData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Deletion failed"));
    } finally {
      setActiveActionKey(null);
    }
  };

  const handleAssignRM = async (userId: number, rmId: string) => {
    setActiveActionKey(`rm-${userId}`);

    try {
      await adminApi.assignRM({
        user_id: userId,
        rm_id: rmId ? Number(rmId) : null,
      });
      toast.success("RM assignment updated");
      await refreshData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update RM assignment"));
    } finally {
      setActiveActionKey(null);
    }
  };

  const handleAssignAccountant = async (userId: number, accountantId: string) => {
    setActiveActionKey(`accountant-${userId}`);

    try {
      await adminApi.assignAccountant({
        user_id: userId,
        accountant_id: accountantId ? Number(accountantId) : null,
      });
      toast.success("Accountant assignment updated");
      await refreshData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update accountant assignment"));
    } finally {
      setActiveActionKey(null);
    }
  };

  const handleRoleUpdate = async (userId: number, nextRole: string) => {
    setActiveActionKey(`role-${userId}`);

    try {
      await adminApi.updateRole(userId, nextRole);
      toast.success(`Role changed to ${getRoleLabel(nextRole)}`);
      await refreshData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update role"));
    } finally {
      setActiveActionKey(null);
    }
  };

  const showTableLoading = isRefreshing && currentData.length === 0;

  return (
    <AuthGuard allowedRoles={["super_admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                  {pageMeta[currentType].eyebrow}
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">
                  {pageMeta[currentType].title}
                </h1>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  {pageMeta[currentType].description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Object.keys(routeMeta) as ManagementType[]).map((type) => {
                  const count =
                    type === "users"
                      ? visibleUsers.length
                      : type === "rms"
                        ? rms.length
                        : accountants.length;

                  return (
                    <Link
                      key={type}
                      href={routeMeta[type].href}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                        currentType === type
                          ? "bg-blue-900 text-white"
                          : "border border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:text-blue-700"
                      }`}
                    >
                      {routeMeta[type].countLabel} ({count})
                    </Link>
                  );
                })}
                <button onClick={openCreateModal} className="admin-btn px-5 py-2 text-xs">
                  <i className="fas fa-user-plus" />
                  <span>{pageMeta[currentType].buttonLabel}</span>
                </button>
              </div>
            </div>
          </section>

          {currentType === "users" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard label="Users" value={userRoleStats.users} tone="blue" />
              <SummaryCard label="Admins" value={userRoleStats.admins} tone="slate" />
              <SummaryCard label="Super Admins" value={userRoleStats.superAdmins} tone="indigo" />
            </div>
          )}

          {currentType === "accountants" && (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <SummaryCard label="Total" value={accountantStats.total} tone="slate" />
              <SummaryCard label="Active" value={accountantStats.active} tone="emerald" />
              <SummaryCard label="Heavy Load" value={accountantStats.heavy} tone="amber" />
              <SummaryCard
                label="Total Clients"
                value={accountantStats.totalClients}
                tone="blue"
              />
              <SummaryCard label="Avg Load" value={accountantStats.avgLoad} tone="slate" />
            </div>
          )}

          <div className="overflow-hidden rounded-[2rem] border border-gray-100/50 bg-white shadow-[var(--admin-card-shadow)]">
            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white p-5">
              {currentType === "users" ? (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                  <div className="relative lg:col-span-5">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="text"
                      placeholder="Search by name, email, role, phone, RM, or accountant..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <select
                      value={roleFilter}
                      onChange={(event) => setRoleFilter(event.target.value)}
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="all">All roles</option>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super admin</option>
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="created">Sort: Created date</option>
                      <option value="name">Sort: Name</option>
                      <option value="email">Sort: Email</option>
                      <option value="role">Sort: Role</option>
                    </select>
                  </div>
                  <div className="lg:col-span-1">
                    <button
                      type="button"
                      onClick={() => setSortOrder((value) => (value === "asc" ? "desc" : "asc"))}
                      className="h-full min-h-[48px] w-full rounded-xl border border-gray-100 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                      title="Toggle sort order"
                    >
                      <i className={`fas fa-sort-amount-${sortOrder === "asc" ? "down" : "up"}`} />
                    </button>
                  </div>
                </div>
              ) : currentType === "rms" ? (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                  <div className="relative lg:col-span-7">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="text"
                      placeholder="Search by name, email, RM ID, phone, or region..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="lg:col-span-4">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="created">Sort: Created date</option>
                      <option value="name">Sort: Name</option>
                      <option value="clients">Sort: Client count</option>
                    </select>
                  </div>
                  <div className="lg:col-span-1">
                    <button
                      type="button"
                      onClick={() => setSortOrder((value) => (value === "asc" ? "desc" : "asc"))}
                      className="h-full min-h-[48px] w-full rounded-xl border border-gray-100 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                      title="Toggle sort order"
                    >
                      <i className={`fas fa-sort-amount-${sortOrder === "asc" ? "down" : "up"}`} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                  <div className="relative lg:col-span-5">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input
                      type="text"
                      placeholder="Search by name, email, ID, or assigned client..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <select
                      value={workloadFilter}
                      onChange={(event) =>
                        setWorkloadFilter(event.target.value as WorkloadFilter)
                      }
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="all">All workloads</option>
                      <option value="active">Only active</option>
                      <option value="idle">Only unassigned</option>
                      <option value="heavy">Heavy load (6+)</option>
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="created">Sort: Created date</option>
                      <option value="name">Sort: Name</option>
                      <option value="clients">Sort: Client count</option>
                    </select>
                  </div>
                  <div className="lg:col-span-1">
                    <button
                      type="button"
                      onClick={() => setSortOrder((value) => (value === "asc" ? "desc" : "asc"))}
                      className="h-full min-h-[48px] w-full rounded-xl border border-gray-100 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                      title="Toggle sort order"
                    >
                      <i className={`fas fa-sort-amount-${sortOrder === "asc" ? "down" : "up"}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              {currentType === "users" ? (
                <table className="min-w-[1120px] w-full table-fixed text-left">
                  <colgroup>
                    <col className="w-[27%]" />
                    <col className="w-[18%]" />
                    <col className="w-[22%]" />
                    <col className="w-[22%]" />
                    <col className="w-[11%]" />
                  </colgroup>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        User
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Role
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Regional Manager
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Accountant
                      </th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {showTableLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-24 text-center">
                          <LoadingState label="Loading users..." />
                        </td>
                      </tr>
                    ) : currentData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-24 text-center">
                          <EmptyState label={pageMeta[currentType].emptyLabel} icon="fa-user-slash" />
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item) => {
                        const role = getRole(item);
                        const isProtectedRole = normalizeRole(role) === "super_admin";
                        const canManageAssignments = role === "user";
                        const regionalManager = getRegionalManager(item);
                        const accountant = getAccountant(item);
                        const isRowBusy =
                          activeActionKey !== null &&
                          activeActionKey.endsWith(`-${String(item.id ?? "")}`);

                        return (
                          <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                            <td className="px-6 py-4 align-top">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 font-black text-blue-700">
                                  {String(item.name ?? "U").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="break-words text-sm font-black text-gray-900">
                                    {item.name}
                                  </p>
                                  <p className="break-all text-xs text-gray-500">{item.email || "-"}</p>
                                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    Joined {formatJoinedDate(item)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="space-y-2">
                                <span className="inline-flex rounded-full bg-blue-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                  {getIdentityLabel(currentType, item)}
                                </span>
                                <select
                                  value={role}
                                  onChange={(event) => {
                                    if (typeof item.id === "number") {
                                      void handleRoleUpdate(item.id, event.target.value);
                                    }
                                  }}
                                  disabled={isProtectedRole || isRowBusy}
                                  className={`w-full min-w-0 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-widest ${
                                    isProtectedRole
                                      ? "cursor-not-allowed border-0 bg-indigo-50 text-indigo-700"
                                      : "border-0 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  }`}
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                  <option value="regional_manager">RM</option>
                                  <option value="accountant">Accountant</option>
                                  {role === "super_admin" && (
                                    <option value="super_admin">Super Admin</option>
                                  )}
                                </select>
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              {canManageAssignments && typeof item.id === "number" ? (
                                <select
                                  value={String(regionalManager?.id ?? "")}
                                  onChange={(event) =>
                                    void handleAssignRM(item.id as number, event.target.value)
                                  }
                                  disabled={isRowBusy}
                                  className="w-full min-w-0 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                >
                                  <option value="">No RM</option>
                                  {assignedRmOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.name} ({option.code})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs font-semibold italic text-gray-400">
                                  Locked
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 align-top">
                              {canManageAssignments && typeof item.id === "number" ? (
                                <select
                                  value={String(accountant?.id ?? "")}
                                  onChange={(event) =>
                                    void handleAssignAccountant(
                                      item.id as number,
                                      event.target.value,
                                    )
                                  }
                                  disabled={isRowBusy}
                                  className="w-full min-w-0 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                                >
                                  <option value="">No Accountant</option>
                                  {assignedAccountantOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                      {option.name} ({option.code})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs font-semibold italic text-gray-400">
                                  Locked
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 align-top">
                              <div className="flex flex-wrap justify-end gap-2">
                                <Link
                                  href={routeMeta[currentType].detailHref(String(item.id ?? ""))}
                                  className="admin-icon-btn-soft"
                                  title="View user"
                                  aria-label="View user"
                                >
                                  <i className="fas fa-eye" />
                                </Link>
                                <button
                                  onClick={() => void handleDelete(item)}
                                  disabled={isProtectedRole || isRowBusy}
                                  title="Delete user"
                                  aria-label="Delete user"
                                  className={`h-10 w-10 rounded-xl shadow-sm transition-all ${
                                    isProtectedRole
                                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                      : "bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white"
                                  }`}
                                >
                                  {activeActionKey === `delete-${item.id}` ? "..." : <i className="fas fa-trash-alt text-xs" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : currentType === "rms" ? (
                <table className="min-w-[1080px] w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Manager
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Email
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        RM ID
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Phone
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Region
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Clients
                      </th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {showTableLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                          <LoadingState label="Loading regional managers..." />
                        </td>
                      </tr>
                    ) : currentData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-24 text-center">
                          <EmptyState label={pageMeta[currentType].emptyLabel} icon="fa-user-tie" />
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item) => {
                        const assignedUsersCount = getAssignedUsersCount(item);
                        const isRowBusy =
                          activeActionKey !== null &&
                          activeActionKey.endsWith(`-${String(item.id ?? "")}`);

                        return (
                          <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 font-black text-blue-700">
                                  {String(item.name ?? "R").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-gray-900">{item.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Joined {formatJoinedDate(item)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                              {item.email || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-blue-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                {getIdentityLabel(currentType, item)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                              {getMobileNumber(item) || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                              {getLocationLabel(item)}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">
                                {assignedUsersCount}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={routeMeta[currentType].detailHref(String(item.id ?? ""))}
                                  className="admin-icon-btn-soft"
                                  title="View manager"
                                  aria-label="View manager"
                                >
                                  <i className="fas fa-eye" />
                                </Link>
                                <button
                                  onClick={() => void handleDelete(item)}
                                  disabled={assignedUsersCount > 0 || isRowBusy}
                                  title="Delete manager"
                                  aria-label="Delete manager"
                                  className={`h-10 w-10 rounded-xl shadow-sm transition-all ${
                                    assignedUsersCount > 0
                                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                      : "bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white"
                                  }`}
                                >
                                  {activeActionKey === `delete-${item.id}` ? "..." : <i className="fas fa-trash-alt text-xs" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="min-w-[1080px] w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Accountant
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        ID
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Clients
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Portfolio Preview
                      </th>
                      <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {showTableLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-24 text-center">
                          <LoadingState label="Loading accountants..." />
                        </td>
                      </tr>
                    ) : currentData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-24 text-center">
                          <EmptyState label={pageMeta[currentType].emptyLabel} icon="fa-calculator" />
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item) => {
                        const assignedUsersCount = getAssignedUsersCount(item);
                        const previewUsers = getAssignedAccountantUsers(item).slice(0, 3);
                        const isRowBusy =
                          activeActionKey !== null &&
                          activeActionKey.endsWith(`-${String(item.id ?? "")}`);

                        return (
                          <tr key={String(item.id)} className="transition-colors hover:bg-blue-50/40">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 font-black text-blue-700">
                                  {String(item.name ?? "A").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-black text-gray-900">{item.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Joined {formatJoinedDate(item)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-gray-700">{item.email || "-"}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {getMobileNumber(item) || "No phone"}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-blue-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                {getIdentityLabel(currentType, item)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                                  assignedUsersCount >= 6
                                    ? "border border-amber-100 bg-amber-50 text-amber-700"
                                    : assignedUsersCount >= 1
                                      ? "border border-blue-100 bg-blue-50 text-blue-700"
                                      : "border border-gray-100 bg-gray-50 text-gray-600"
                                }`}
                              >
                                {assignedUsersCount} clients
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {previewUsers.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {previewUsers.map((user) => (
                                    <span
                                      key={String(user.id)}
                                      className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600"
                                    >
                                      {String(user.name ?? "Client")}
                                    </span>
                                  ))}
                                  {getAssignedAccountantUsers(item).length > 3 && (
                                    <span className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600">
                                      +{getAssignedAccountantUsers(item).length - 3}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-gray-400">
                                  No assigned clients
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={routeMeta[currentType].detailHref(String(item.id ?? ""))}
                                  className="admin-icon-btn-soft"
                                  title="View accountant"
                                  aria-label="View accountant"
                                >
                                  <i className="fas fa-eye" />
                                </Link>
                                <button
                                  onClick={() => void handleDelete(item)}
                                  disabled={assignedUsersCount > 0 || isRowBusy}
                                  title="Delete accountant"
                                  aria-label="Delete accountant"
                                  className={`h-10 w-10 rounded-xl shadow-sm transition-all ${
                                    assignedUsersCount > 0
                                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                      : "bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white"
                                  }`}
                                >
                                  {activeActionKey === `delete-${item.id}` ? "..." : <i className="fas fa-trash-alt text-xs" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                Showing {currentData.length} of{" "}
                {currentType === "users"
                  ? visibleUsers.length
                  : currentType === "rms"
                    ? rms.length
                    : accountants.length}
              </p>
              <p className="text-[11px] font-semibold text-gray-500">
                {currentType === "users"
                  ? `Users: ${userRoleStats.users} | Admins: ${userRoleStats.admins} | Super Admins: ${userRoleStats.superAdmins}`
                  : currentType === "rms"
                    ? `Total assigned clients: ${rms.reduce(
                        (sum: number, item: AdminRecord) => sum + getAssignedUsersCount(item),
                        0,
                      )}`
                    : `Active portfolios: ${accountantStats.totalClients}`}
              </p>
            </div>
          </div>
        </div>

        {isCreateOpen && (
          <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/45 px-4 py-10 backdrop-blur-sm">
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-gray-100 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {pageMeta[currentType].buttonLabel}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a new {pageMeta[currentType].title.slice(0, -1).toLowerCase()} record.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                >
                  <i className="fas fa-times" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5 px-6 py-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Full Name
                    </label>
                    <input
                      required
                      value={formState.name}
                      onChange={(event) =>
                        setFormState((state) => ({ ...state, name: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      value={formState.email}
                      onChange={(event) =>
                        setFormState((state) => ({ ...state, email: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Mobile Number
                    </label>
                    <input
                      value={formState.mobile_number}
                      onChange={(event) =>
                        setFormState((state) => ({
                          ...state,
                          mobile_number: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Optional phone number"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formState.password}
                      onChange={(event) =>
                        setFormState((state) => ({ ...state, password: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Optional, defaults to password123"
                    />
                  </div>
                </div>

                {currentType === "users" && (
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Regional Manager
                    </label>
                    <select
                      value={formState.rm_id}
                      onChange={(event) =>
                        setFormState((state) => ({ ...state, rm_id: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="">No regional manager</option>
                      {assignedRmOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name} ({option.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="admin-btn-muted text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="admin-btn text-xs">
                    <i className={`fas ${isSubmitting ? "fa-circle-notch fa-spin" : "fa-check"}`} />
                    <span>{isSubmitting ? "Creating..." : "Create Record"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "blue" | "emerald" | "amber" | "indigo" | "slate";
}) {
  const toneClass =
    tone === "blue"
      ? "text-blue-700"
      : tone === "emerald"
        ? "text-emerald-700"
        : tone === "amber"
          ? "text-amber-700"
          : tone === "indigo"
            ? "text-indigo-700"
            : "text-gray-900";

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-300">
        <i className={`fas ${icon} text-xl`} />
      </div>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
    </div>
  );
}
