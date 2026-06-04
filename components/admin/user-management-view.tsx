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
import { useConfirm } from "@/hooks/use-confirm";
import { PanelLogoLoader } from "@/components/ui/logo-loader";
import { SearchSelect } from "@/components/ui/core/search-select";
import { usePincodeLookup } from "@/lib/hooks/use-pincode-lookup";
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
import { TableViewSkeleton } from "@/components/ui/skeletons/table-view-skeleton";

type ManagementType = "users" | "rms" | "accountants";
type WorkloadFilter = "all" | "active" | "idle" | "heavy";

type CreateFormState = {
  name: string;
  email: string;
  password: string;
  mobile_number: string;
  rm_id: string;
  address: string;
  city: string;
  district: string;
  landmark: string;
  pincode: string;
  state: string;
};

type AssignRmFormState = {
  userId: number | null;
  userName: string;
  rm_id: string;
  address: string;
  city: string;
  district: string;
  landmark: string;
  pincode: string;
  state: string;
};

type RoleChangeFormState = {
  userId: number | null;
  userName: string;
  currentRole: string;
  role: string;
  assignedUsersCount: number;
  address: string;
  city: string;
  district: string;
  landmark: string;
  pincode: string;
  state: string;
};

type RmOption = {
  id: number;
  name: string;
  code: string;
  city: string;
  state: string;
  pincode: string;
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
    title: "Relationship Managers",
    eyebrow: "Super Admin",
    description: "Manager directory with assignment counts and direct profile access.",
    buttonLabel: "Add Manager",
    emptyLabel: "No relationship managers matched the current filters.",
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
  address: "",
  city: "",
  district: "",
  landmark: "",
  pincode: "",
  state: "",
};

const initialAssignRmFormState: AssignRmFormState = {
  userId: null,
  userName: "",
  rm_id: "",
  address: "",
  city: "",
  district: "",
  landmark: "",
  pincode: "",
  state: "",
};

const initialRoleChangeFormState: RoleChangeFormState = {
  userId: null,
  userName: "",
  currentRole: "",
  role: "",
  assignedUsersCount: 0,
  address: "",
  city: "",
  district: "",
  landmark: "",
  pincode: "",
  state: "",
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
    href: "/admin/relationship-managers",
    countLabel: "Relationship Managers",
    detailHref: (id) => `/admin/relationship-managers/${id}`,
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
    return "Relationship Manager";
  }

  if (role === "accountant") {
    return "Accountant";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "User";
}

function roleNeedsLocation(role: string) {
  return role === "regional_manager";
}

function isRegionalManagerToUserRoleChange(
  currentRole: string,
  targetRole: string,
) {
  return currentRole === "regional_manager" && targetRole === "user";
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
  const district = typeof record.district === "string" ? record.district : "";
  const state = typeof record.state === "string" ? record.state : "";
  const pincode = typeof record.pincode === "string" ? record.pincode : "";
  const primary = [city, district, state].filter(Boolean);

  if (primary.length > 0 && pincode) {
    return `${primary.join(", ")} - ${pincode}`;
  }

  if (primary.length > 0) {
    return primary.join(", ");
  }

  if (pincode) {
    return pincode;
  }

  return "Not set";
}

function getOptionalValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function buildLocationState(record?: Partial<AdminRecord>) {
  return {
    address: getOptionalValue(record?.address),
    city: getOptionalValue(record?.city),
    district: getOptionalValue(record?.district),
    landmark: getOptionalValue(record?.landmark),
    pincode: getOptionalValue(record?.pincode),
    state: getOptionalValue(record?.state),
  };
}

function normalizePincodeInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function normalizeLocationToken(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function groupRmOptionsByLocation(
  options: RmOption[],
  location: Pick<AssignRmFormState, "city" | "pincode" | "state">,
) {
  const targetPincode = normalizeLocationToken(location.pincode);
  const targetCity = normalizeLocationToken(location.city);
  const targetState = normalizeLocationToken(location.state);
  const hasLocationFilter = Boolean(targetPincode || targetCity || targetState);

  const rankedOptions = options
    .map((option) => {
      const optionPincode = normalizeLocationToken(option.pincode);
      const optionCity = normalizeLocationToken(option.city);
      const optionState = normalizeLocationToken(option.state);

      let rank = 0;

      if (targetPincode && optionPincode && targetPincode === optionPincode) {
        rank = 4;
      } else if (
        targetCity &&
        targetState &&
        optionCity === targetCity &&
        optionState === targetState
      ) {
        rank = 3;
      } else if (targetCity && optionCity === targetCity) {
        rank = 2;
      } else if (targetState && optionState === targetState) {
        rank = 1;
      }

      return {
        option,
        rank,
      };
    })
    .sort(
      (left, right) =>
        right.rank - left.rank || left.option.name.localeCompare(right.option.name),
    );

  return {
    hasLocationFilter,
    matching: rankedOptions.filter((item) => item.rank > 0).map((item) => item.option),
    others: rankedOptions.filter((item) => item.rank === 0).map((item) => item.option),
  };
}

function getRmOptionLabel(option: RmOption) {
  const location = [option.city, option.state].filter(Boolean).join(", ");
  if (location) {
    return `${option.name} (${option.code}) - ${location}`;
  }

  return `${option.name} (${option.code})`;
}

function buildRmSelectOptions(
  groups: ReturnType<typeof groupRmOptionsByLocation>,
  emptyLabel: string,
) {
  return [
    { value: "", label: emptyLabel },
    ...groups.matching.map((option) => ({
      value: String(option.id),
      label: getRmOptionLabel(option),
      group: "Matching Location",
    })),
    ...groups.others.map((option) => ({
      value: String(option.id),
      label: getRmOptionLabel(option),
      group: groups.matching.length > 0 ? "Other Locations" : "All Locations",
    })),
  ];
}

export function UserManagementView({
  initialType = "users",
}: {
  initialType?: ManagementType;
}) {
  const { confirm, ConfirmDialog } = useConfirm();
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
  const [isAssignRmOpen, setIsAssignRmOpen] = useState(false);
  const [assignRmState, setAssignRmState] = useState<AssignRmFormState>(
    initialAssignRmFormState,
  );
  const [isRoleChangeOpen, setIsRoleChangeOpen] = useState(false);
  const [roleChangeState, setRoleChangeState] = useState<RoleChangeFormState>(
    initialRoleChangeFormState,
  );
  const { loading: createPincodeLoading } = usePincodeLookup(
    formState.pincode,
    ({ city, state }) => {
      setFormState((previous) => ({
        ...previous,
        city,
        state,
      }));
    },
  );
  const { loading: assignPincodeLoading } = usePincodeLookup(
    assignRmState.pincode,
    ({ city, state }) => {
      setAssignRmState((previous) => ({
        ...previous,
        city,
        state,
      }));
    },
  );
  const { loading: roleChangePincodeLoading } = usePincodeLookup(
    roleChangeState.pincode,
    ({ city, state }) => {
      setRoleChangeState((previous) => ({
        ...previous,
        city,
        state,
      }));
    },
  );

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
          name: String(item.name ?? "Relationship Manager"),
          code: getRmUniqueId(item) || "RM",
          city: getOptionalValue(item.city),
          state: getOptionalValue(item.state),
          pincode: getOptionalValue(item.pincode),
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

  const assignRmOptionGroups = useMemo(
    () =>
      groupRmOptionsByLocation(assignedRmOptions, {
        city: assignRmState.city,
        pincode: assignRmState.pincode,
        state: assignRmState.state,
      }),
    [assignedRmOptions, assignRmState.city, assignRmState.pincode, assignRmState.state],
  );

  const openCreateModal = () => {
    setFormState(initialFormState);
    setIsCreateOpen(true);
  };

  const closeAssignRmModal = () => {
    setIsAssignRmOpen(false);
    setAssignRmState(initialAssignRmFormState);
  };

  const closeRoleChangeModal = () => {
    setIsRoleChangeOpen(false);
    setRoleChangeState(initialRoleChangeFormState);
  };

  const openAssignRmModal = (item: AdminRecord, rmId: string) => {
    if (typeof item.id !== "number") {
      return;
    }

    setAssignRmState({
      userId: item.id,
      userName: String(item.name ?? "User"),
      rm_id: rmId,
      ...buildLocationState(item),
    });
    setIsAssignRmOpen(true);
  };

  const openRoleChangeModal = (item: AdminRecord, nextRole: string) => {
    if (typeof item.id !== "number") {
      return;
    }

    setRoleChangeState({
      userId: item.id,
      userName: String(item.name ?? "User"),
      currentRole: getRole(item),
      role: nextRole,
      assignedUsersCount: getAssignedUsersCount(item),
      ...buildLocationState(item),
    });
    setIsRoleChangeOpen(true);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentType === "rms" && !formState.state.trim()) {
      toast.error("State is required to generate the RM ID");
      return;
    }

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

      if (currentType === "rms") {
        payload.address = formState.address.trim() || undefined;
        payload.city = formState.city.trim() || undefined;
        payload.district = null;
        payload.landmark = formState.landmark.trim() || undefined;
        payload.pincode = formState.pincode.trim() || undefined;
        payload.state = formState.state.trim() || undefined;
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

    const confirmed = await confirm({
      title: `Delete ${pageMeta[currentType].title.slice(0, -1)}?`,
      message: "This action permanently removes the record from the directory.",
      confirmLabel: "Delete",
      variant: "danger",
    });
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

  const handleAssignRM = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (assignRmState.userId === null) {
      return;
    }

    setActiveActionKey(`rm-${assignRmState.userId}`);

    try {
      await adminApi.assignRM({
        user_id: assignRmState.userId,
        rm_id: assignRmState.rm_id ? Number(assignRmState.rm_id) : null,
        address: assignRmState.address.trim() || undefined,
        city: assignRmState.city.trim() || undefined,
        district: null,
        landmark: assignRmState.landmark.trim() || undefined,
        pincode: assignRmState.pincode.trim() || undefined,
        state: assignRmState.state.trim() || undefined,
      });
      toast.success("RM assignment updated");
      closeAssignRmModal();
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

  const handleRoleUpdate = async (item: AdminRecord, nextRole: string) => {
    if (typeof item.id !== "number") {
      return;
    }

    const currentRole = getRole(item);

    if (currentRole === nextRole) {
      return;
    }

    if (
      nextRole === "regional_manager" ||
      isRegionalManagerToUserRoleChange(currentRole, nextRole)
    ) {
      if (
        isRegionalManagerToUserRoleChange(currentRole, nextRole) &&
        getAssignedUsersCount(item) > 0
      ) {
        toast.error(
          "Clear or reassign this RM's clients before moving them back to user.",
        );
        return;
      }

      openRoleChangeModal(item, nextRole);
      return;
    }

    const userId = item.id;
    setActiveActionKey(`role-${userId}`);

    try {
      await adminApi.updateRole(userId, { role: nextRole });
      toast.success(`Role changed to ${getRoleLabel(nextRole)}`);
      await refreshData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update role"));
    } finally {
      setActiveActionKey(null);
    }
  };

  const handleRoleChangeSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (roleChangeState.userId === null) {
      return;
    }

    if (
      isRegionalManagerToUserRoleChange(
        roleChangeState.currentRole,
        roleChangeState.role,
      ) &&
      roleChangeState.assignedUsersCount > 0
    ) {
      toast.error(
        "Clear or reassign this RM's clients before moving them back to user.",
      );
      return;
    }

    if (roleNeedsLocation(roleChangeState.role) && !roleChangeState.state.trim()) {
      toast.error("State is required to generate the RM ID");
      return;
    }

    setActiveActionKey(`role-${roleChangeState.userId}`);

    try {
      await adminApi.updateRole(roleChangeState.userId, {
        role: roleChangeState.role,
        address: roleChangeState.address.trim() || undefined,
        city: roleChangeState.city.trim() || undefined,
        district: null,
        landmark: roleChangeState.landmark.trim() || undefined,
        pincode: roleChangeState.pincode.trim() || undefined,
        state: roleChangeState.state.trim() || undefined,
      });
      toast.success(`Role changed to ${getRoleLabel(roleChangeState.role)}`);
      closeRoleChangeModal();
      await refreshData();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update role"));
    } finally {
      setActiveActionKey(null);
    }
  };

  const showTableLoading = isRefreshing && currentData.length === 0;

  if (showTableLoading) {
    return (
      <AuthGuard allowedRoles={["super_admin"]}>
        <AdminLayout>
          <TableViewSkeleton />
        </AdminLayout>
      </AuthGuard>
    );
  }

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
                    <SearchSelect
                      options={[
                        { value: "all", label: "All roles" },
                        { value: "user", label: "User" },
                        { value: "admin", label: "Admin" },
                        { value: "super_admin", label: "Super admin" },
                      ]}
                      value={roleFilter}
                      onChange={setRoleFilter}
                      triggerClassName="min-h-[3rem] rounded-xl px-4 py-3"
                      valueLabelClassName="text-sm font-semibold text-gray-700"
                      handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
                      selectStyle={{ borderColor: "#f3f4f6", boxShadow: "none" }}
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <SearchSelect
                      options={[
                        { value: "created", label: "Sort: Created date" },
                        { value: "name", label: "Sort: Name" },
                        { value: "email", label: "Sort: Email" },
                        { value: "role", label: "Sort: Role" },
                      ]}
                      value={sortBy}
                      onChange={setSortBy}
                      triggerClassName="min-h-[3rem] rounded-xl px-4 py-3"
                      valueLabelClassName="text-sm font-semibold text-gray-700"
                      handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
                      selectStyle={{ borderColor: "#f3f4f6", boxShadow: "none" }}
                    />
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
                    <SearchSelect
                      options={[
                        { value: "created", label: "Sort: Created date" },
                        { value: "name", label: "Sort: Name" },
                        { value: "clients", label: "Sort: Client count" },
                      ]}
                      value={sortBy}
                      onChange={setSortBy}
                      triggerClassName="min-h-[3rem] rounded-xl px-4 py-3"
                      valueLabelClassName="text-sm font-semibold text-gray-700"
                      handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
                      selectStyle={{ borderColor: "#f3f4f6", boxShadow: "none" }}
                    />
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
                    <SearchSelect
                      options={[
                        { value: "all", label: "All workloads" },
                        { value: "active", label: "Only active" },
                        { value: "idle", label: "Only unassigned" },
                        { value: "heavy", label: "Heavy load (6+)" },
                      ]}
                      value={workloadFilter}
                      onChange={(nextValue) =>
                        setWorkloadFilter(nextValue as WorkloadFilter)
                      }
                      triggerClassName="min-h-[3rem] rounded-xl px-4 py-3"
                      valueLabelClassName="text-sm font-semibold text-gray-700"
                      handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
                      selectStyle={{ borderColor: "#f3f4f6", boxShadow: "none" }}
                    />
                  </div>
                  <div className="lg:col-span-3">
                    <SearchSelect
                      options={[
                        { value: "created", label: "Sort: Created date" },
                        { value: "name", label: "Sort: Name" },
                        { value: "clients", label: "Sort: Client count" },
                      ]}
                      value={sortBy}
                      onChange={setSortBy}
                      triggerClassName="min-h-[3rem] rounded-xl px-4 py-3"
                      valueLabelClassName="text-sm font-semibold text-gray-700"
                      handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
                      selectStyle={{ borderColor: "#f3f4f6", boxShadow: "none" }}
                    />
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
                        Relationship Manager
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
                        const rowRmOptionGroups = groupRmOptionsByLocation(
                          assignedRmOptions,
                          buildLocationState(item),
                        );
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
                                <SearchSelect
                                  options={[
                                    { value: "user", label: "User" },
                                    { value: "admin", label: "Admin" },
                                    { value: "regional_manager", label: "RM" },
                                    { value: "accountant", label: "Accountant" },
                                    ...(role === "super_admin"
                                      ? [{ value: "super_admin", label: "Super Admin" }]
                                      : []),
                                  ]}
                                  value={role}
                                  onChange={(nextValue) => {
                                    void handleRoleUpdate(item, nextValue);
                                  }}
                                  disabled={isProtectedRole || isRowBusy}
                                  triggerClassName="min-h-[2.5rem] rounded-lg px-3 py-2"
                                  valueLabelClassName="text-[10px] font-black uppercase tracking-widest"
                                  handleClassName="h-6 w-6 rounded-md border-0 bg-transparent text-current"
                                  selectStyle={{
                                    borderColor: "transparent",
                                    boxShadow: "none",
                                    background: isProtectedRole ? "#eef2ff" : "#eff6ff",
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 align-top">
                              {canManageAssignments && typeof item.id === "number" ? (
                                  <SearchSelect
                                    options={buildRmSelectOptions(rowRmOptionGroups, "No RM")}
                                    value={String(regionalManager?.id ?? "")}
                                    onChange={(nextValue) => openAssignRmModal(item, nextValue)}
                                    disabled={isRowBusy}
                                    searchable={
                                      rowRmOptionGroups.matching.length +
                                        rowRmOptionGroups.others.length >
                                      6
                                    }
                                    triggerClassName="min-h-[2.5rem] rounded-lg px-3 py-2"
                                    valueLabelClassName="text-xs font-semibold text-gray-700"
                                    handleClassName="h-6 w-6 rounded-md border-0 bg-transparent text-slate-400"
                                    selectStyle={{
                                      borderColor: "#f3f4f6",
                                      boxShadow: "none",
                                      background: "#f9fafb",
                                    }}
                                  />
                                ) : (
                                  <span className="text-xs font-semibold italic text-gray-400">
                                    Locked
                                  </span>
                              )}
                            </td>
                            <td className="px-6 py-4 align-top">
                              {canManageAssignments && typeof item.id === "number" ? (
                                <SearchSelect
                                  options={[
                                    { value: "", label: "No Accountant" },
                                    ...assignedAccountantOptions.map((option) => ({
                                      value: String(option.id),
                                      label: `${option.name} (${option.code})`,
                                    })),
                                  ]}
                                  value={String(accountant?.id ?? "")}
                                  onChange={(nextValue) =>
                                    void handleAssignAccountant(
                                      item.id as number,
                                      nextValue,
                                    )
                                  }
                                  disabled={isRowBusy}
                                  searchable={assignedAccountantOptions.length > 6}
                                  triggerClassName="min-h-[2.5rem] rounded-lg px-3 py-2"
                                  valueLabelClassName="text-xs font-semibold text-gray-700"
                                  handleClassName="h-6 w-6 rounded-md border-0 bg-transparent text-slate-400"
                                  selectStyle={{
                                    borderColor: "#f3f4f6",
                                    boxShadow: "none",
                                    background: "#f9fafb",
                                  }}
                                />
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
                          <LoadingState label="Loading relationship managers..." />
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
                          type="button"
                          onClick={() => openRoleChangeModal(item, "user")}
                          disabled={assignedUsersCount > 0 || isRowBusy}
                          title={
                            assignedUsersCount > 0
                              ? "Reassign clients before moving this RM to user"
                              : "Move this RM back to user role"
                          }
                          className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                            assignedUsersCount > 0 || isRowBusy
                              ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                              : "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                        >
                          <i className="fas fa-arrow-right-arrow-left text-[10px]" />
                          User
                        </button>
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
                      Relationship Manager
                    </label>
                    <SearchSelect
                      options={[
                        { value: "", label: "No relationship manager" },
                        ...assignedRmOptions.map((option) => ({
                          value: String(option.id),
                          label: `${option.name} (${option.code})`,
                        })),
                      ]}
                      value={formState.rm_id}
                      onChange={(nextValue) =>
                        setFormState((state) => ({ ...state, rm_id: nextValue }))
                      }
                      searchable={assignedRmOptions.length > 6}
                      triggerClassName="min-h-[3rem] rounded-xl px-4 py-3"
                      valueLabelClassName="text-sm font-semibold text-gray-700"
                      handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
                      selectStyle={{ borderColor: "#f3f4f6", boxShadow: "none" }}
                    />
                  </div>
                )}

                {currentType === "rms" && (
                  <div className="space-y-5 rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
                    <div>
                      <h3 className="text-sm font-black text-gray-900">RM Location Details</h3>
                      <p className="mt-1 text-xs font-medium text-gray-500">
                        State is required. Enter pincode to auto-fill city and state. The RM ID
                        uses a two-letter state code and a city code automatically.
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                          Pincode
                        </label>
                        <div className="relative">
                          <input
                            value={formState.pincode}
                            onChange={(event) =>
                              setFormState((state) => ({
                                ...state,
                                pincode: normalizePincodeInput(event.target.value),
                              }))
                            }
                            inputMode="numeric"
                            maxLength={6}
                            className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 pr-11 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                            placeholder="Enter pincode"
                          />
                          {createPincodeLoading && (
                            <i className="fas fa-circle-notch fa-spin absolute right-4 top-1/2 -translate-y-1/2 text-blue-500" />
                          )}
                        </div>
                        <p className="mt-2 text-xs font-medium text-gray-400">
                          City and state will fill automatically from the pincode.
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                          State
                        </label>
                        <input
                          required
                          value={formState.state}
                          onChange={(event) =>
                            setFormState((state) => ({ ...state, state: event.target.value }))
                          }
                          className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                          City
                        </label>
                        <input
                          value={formState.city}
                          onChange={(event) =>
                            setFormState((state) => ({ ...state, city: event.target.value }))
                          }
                          className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                          Landmark
                        </label>
                        <input
                          value={formState.landmark}
                          onChange={(event) =>
                            setFormState((state) => ({ ...state, landmark: event.target.value }))
                          }
                          className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                          placeholder="Optional landmark"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                          Address
                        </label>
                        <textarea
                          rows={3}
                          value={formState.address}
                          onChange={(event) =>
                            setFormState((state) => ({ ...state, address: event.target.value }))
                          }
                          className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                          placeholder="Optional full address"
                        />
                      </div>
                    </div>
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

        {isAssignRmOpen && (
          <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/45 px-4 py-10 backdrop-blur-sm">
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-gray-100 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {assignRmState.rm_id ? "Assign Relationship Manager" : "Remove Relationship Manager"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Update RM and location details for {assignRmState.userName || "this user"}.
                    Enter pincode to auto-fill city and state.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAssignRmModal}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                >
                  <i className="fas fa-times" />
                </button>
              </div>

              <form onSubmit={handleAssignRM} className="space-y-5 px-6 py-6">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                    Relationship Manager
                  </label>
                  <SearchSelect
                    options={buildRmSelectOptions(assignRmOptionGroups, "No RM")}
                    value={assignRmState.rm_id}
                    onChange={(nextValue) =>
                      setAssignRmState((state) => ({ ...state, rm_id: nextValue }))
                    }
                    searchable={
                      assignRmOptionGroups.matching.length +
                        assignRmOptionGroups.others.length >
                      6
                    }
                    triggerClassName="min-h-[3rem] rounded-xl px-4 py-3"
                    valueLabelClassName="text-sm font-semibold text-gray-700"
                    handleClassName="h-8 w-8 rounded-lg border-0 bg-transparent text-slate-400"
                    selectStyle={{ borderColor: "#f3f4f6", boxShadow: "none" }}
                  />
                  <p className="mt-2 text-xs font-medium text-gray-400">
                    {assignRmOptionGroups.matching.length > 0
                      ? `${assignRmOptionGroups.matching.length} RM option(s) match this location first.`
                      : assignRmOptionGroups.hasLocationFilter
                        ? "No exact location match found, so all RMs are available below."
                        : "Choose an RM. Add location details to filter the list automatically."}
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Pincode
                    </label>
                    <div className="relative">
                      <input
                        value={assignRmState.pincode}
                        onChange={(event) =>
                          setAssignRmState((state) => ({
                            ...state,
                            pincode: normalizePincodeInput(event.target.value),
                          }))
                        }
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 pr-11 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Enter pincode"
                      />
                      {assignPincodeLoading && (
                        <i className="fas fa-circle-notch fa-spin absolute right-4 top-1/2 -translate-y-1/2 text-blue-500" />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      State
                    </label>
                    <input
                      value={assignRmState.state}
                      onChange={(event) =>
                        setAssignRmState((state) => ({ ...state, state: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      City
                    </label>
                    <input
                      value={assignRmState.city}
                      onChange={(event) =>
                        setAssignRmState((state) => ({ ...state, city: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Landmark
                    </label>
                    <input
                      value={assignRmState.landmark}
                      onChange={(event) =>
                        setAssignRmState((state) => ({ ...state, landmark: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Optional landmark"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      value={assignRmState.address}
                      onChange={(event) =>
                        setAssignRmState((state) => ({ ...state, address: event.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Optional full address"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeAssignRmModal}
                    className="admin-btn-muted text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      assignRmState.userId === null ||
                      activeActionKey === `rm-${String(assignRmState.userId ?? "")}`
                    }
                    className="admin-btn text-xs"
                  >
                    <i
                      className={`fas ${
                        activeActionKey === `rm-${String(assignRmState.userId ?? "")}`
                          ? "fa-circle-notch fa-spin"
                          : assignRmState.rm_id
                            ? "fa-check"
                            : "fa-user-minus"
                      }`}
                    />
                    <span>
                      {activeActionKey === `rm-${String(assignRmState.userId ?? "")}`
                        ? "Saving..."
                        : assignRmState.rm_id
                          ? "Save RM Changes"
                          : "Remove RM"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isRoleChangeOpen && (
          <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-900/45 px-4 py-10 backdrop-blur-sm">
            <div className="mx-auto max-w-2xl rounded-[2rem] border border-gray-100 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-black text-gray-900">
                    {roleChangeState.role === "regional_manager"
                      ? "Promote to Relationship Manager"
                      : "Move Relationship Manager to User"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {roleChangeState.role === "regional_manager"
                      ? `Add location details for ${roleChangeState.userName || "this user"} to generate the RM ID. Put pincode first to auto-fill city and state, then adjust if needed. We use the state code and city code in the ID.`
                      : `Keep ${roleChangeState.userName || "this user"} in the directory while removing RM access. Their profile and location details stay saved, and a fresh RM ID will be generated if you promote them again later.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRoleChangeModal}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                >
                  <i className="fas fa-times" />
                </button>
              </div>

              <form onSubmit={handleRoleChangeSubmit} className="space-y-5 px-6 py-6">
                {roleChangeState.role === "regional_manager" ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                        Pincode
                      </label>
                      <div className="relative">
                        <input
                          value={roleChangeState.pincode}
                          onChange={(event) =>
                            setRoleChangeState((state) => ({
                              ...state,
                              pincode: normalizePincodeInput(event.target.value),
                            }))
                          }
                          inputMode="numeric"
                          maxLength={6}
                          className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 pr-11 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                          placeholder="Enter pincode"
                        />
                        {roleChangePincodeLoading && (
                          <i className="fas fa-circle-notch fa-spin absolute right-4 top-1/2 -translate-y-1/2 text-blue-500" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                        State
                      </label>
                      <input
                        required
                        value={roleChangeState.state}
                        onChange={(event) =>
                          setRoleChangeState((state) => ({
                            ...state,
                            state: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                        City
                      </label>
                      <input
                        value={roleChangeState.city}
                        onChange={(event) =>
                          setRoleChangeState((state) => ({
                            ...state,
                            city: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                        Landmark
                      </label>
                      <input
                        value={roleChangeState.landmark}
                        onChange={(event) =>
                          setRoleChangeState((state) => ({
                            ...state,
                            landmark: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Optional landmark"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-[11px] font-black uppercase tracking-widest text-gray-400">
                        Address
                      </label>
                      <textarea
                        rows={3}
                        value={roleChangeState.address}
                        onChange={(event) =>
                          setRoleChangeState((state) => ({
                            ...state,
                            address: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        placeholder="Optional full address"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                        Role Change Summary
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        RM access will be removed. The user will stay in the system
                        with the same profile details and can be promoted again later.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          State
                        </p>
                        <p className="mt-2 text-sm font-bold text-gray-900">
                          {roleChangeState.state || "Not set"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          City
                        </p>
                        <p className="mt-2 text-sm font-bold text-gray-900">
                          {roleChangeState.city || "Not set"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Pincode
                        </p>
                        <p className="mt-2 text-sm font-bold text-gray-900">
                          {roleChangeState.pincode || "Not set"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeRoleChangeModal}
                    className="admin-btn-muted text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      roleChangeState.userId === null ||
                      activeActionKey === `role-${String(roleChangeState.userId ?? "")}`
                    }
                    className="admin-btn text-xs"
                  >
                    <i
                      className={`fas ${
                        activeActionKey === `role-${String(roleChangeState.userId ?? "")}`
                          ? "fa-circle-notch fa-spin"
                          : roleChangeState.role === "regional_manager"
                            ? "fa-check"
                            : "fa-arrow-right-arrow-left"
                      }`}
                    />
                    <span>
                      {activeActionKey === `role-${String(roleChangeState.userId ?? "")}`
                        ? "Saving..."
                        : roleChangeState.role === "regional_manager"
                          ? "Promote to RM"
                          : "Move to User"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog />
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
    <PanelLogoLoader className="min-h-[16rem] p-4" label={label} size={54} />
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
