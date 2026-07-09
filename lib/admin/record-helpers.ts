export type AdminRecord = Record<string, unknown> & {
  id?: number | string;
  role?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  mobileNumber?: string | null;
  mobile_number?: string | null;
  rmUniqueId?: string | null;
  rm_unique_id?: string | null;
  accountantUniqueId?: string | null;
  accountant_unique_id?: string | null;
  relationshipManager?: AdminRecord | null;
  relationship_manager?: AdminRecord | null;
  regionalManager?: AdminRecord | null;
  regional_manager?: AdminRecord | null;
  accountant?: AdminRecord | null;
  assignedUsers?: AdminRecord[] | null;
  assigned_users?: AdminRecord[] | null;
  assignedAccountantUsers?: AdminRecord[] | null;
  assigned_accountant_users?: AdminRecord[] | null;
  services?: AdminRecord[] | null;
  assigned_users_count?: number | null;
};

export function asArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : [];
}

export function getCreatedAt(record: AdminRecord | null | undefined) {
  return record?.createdAt ?? record?.created_at ?? null;
}

export function getMobileNumber(record: AdminRecord | null | undefined) {
  return record?.mobileNumber ?? record?.mobile_number ?? null;
}

export function getRmUniqueId(record: AdminRecord | null | undefined) {
  return record?.rmUniqueId ?? record?.rm_unique_id ?? null;
}

export function getAccountantUniqueId(record: AdminRecord | null | undefined) {
  return record?.accountantUniqueId ?? record?.accountant_unique_id ?? null;
}

export function getRegionalManager(record: AdminRecord | null | undefined) {
  return (
    record?.relationshipManager ??
    record?.relationship_manager ??
    record?.regionalManager ??
    record?.regional_manager ??
    null
  );
}

export function getAccountant(record: AdminRecord | null | undefined) {
  return record?.accountant ?? null;
}

export function getAssignedUsers(record: AdminRecord | null | undefined) {
  return asArray(record?.assignedUsers ?? record?.assigned_users ?? []);
}

export function getAssignedAccountantUsers(record: AdminRecord | null | undefined) {
  return asArray(
    record?.assignedAccountantUsers ?? record?.assigned_accountant_users ?? [],
  );
}

export function getAssignedUsersCount(record: AdminRecord | null | undefined) {
  if (typeof record?.assigned_users_count === "number") {
    return record.assigned_users_count;
  }

  const assignedUsers = getAssignedUsers(record);
  if (assignedUsers.length > 0) {
    return assignedUsers.length;
  }

  return getAssignedAccountantUsers(record).length;
}

export function getRole(record: AdminRecord | null | undefined) {
  return typeof record?.role === "string" ? record.role : "";
}
