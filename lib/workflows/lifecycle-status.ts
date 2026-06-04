export type SharedLifecycleStage = {
  id: number;
  name: string;
  slug: string;
  color: string;
  is_active: boolean;
  is_default: boolean;
};

export type LifecycleStatusOption = {
  color: string;
  description: string;
  icon: string;
  kind: "default" | "special";
  label: string;
  stage: SharedLifecycleStage | null;
  value: string;
};

export type LifecycleStatusGroup = {
  description: string;
  id: string;
  label: string;
  options: LifecycleStatusOption[];
};

const LIFECYCLE_STATUS_FLOW: Record<string, string[]> = {
  in_cart: ["applied"],
  payment_pending: ["paid", "cancelled"],
  applied: ["under_review", "approved", "cancelled"],
  paid: ["under_review", "approved", "cancelled"],
  under_review: [
    "applied",
    "update_required",
    "in_progress",
    "approved",
    "cancelled",
  ],
  update_required: ["under_review", "approved", "cancelled"],
  in_progress: [
    "under_review",
    "submitted_to_ca",
    "update_required",
    "approved",
    "cancelled",
  ],
  submitted_to_ca: [
    "applied",
    "in_progress",
    "approved",
    "cancelled",
    "completed",
  ],
  approved: [
    "applied",
    "submitted_to_ca",
    "in_progress",
    "under_review",
    "completed",
  ],
  completed: [
    "applied",
    "approved",
    "submitted_to_ca",
    "in_progress",
    "under_review",
  ],
  cancelled: ["applied"],
  rejected: ["applied"],
};

type DefaultLifecycleStatusMeta = {
  description: string;
  fallbackColor: string;
  fallbackLabel: string;
  icon: string;
  slug: string;
};

type SpecialLifecycleStatusMeta = {
  color: string;
  description: string;
  icon: string;
  label: string;
};

function normalizeLifecycleStatus(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

const DEFAULT_LIFECYCLE_STATUS_META: Record<
  string,
  DefaultLifecycleStatusMeta
> = {
  applied: {
    description:
      "Application received and queued for the shared lifecycle flow.",
    fallbackColor: "#0f766e",
    fallbackLabel: "Start",
    icon: "fa-play",
    slug: "start",
  },
  under_review: {
    description: "Documents and request details are being verified.",
    fallbackColor: "#2563eb",
    fallbackLabel: "Verification",
    icon: "fa-magnifying-glass",
    slug: "verification",
  },
  in_progress: {
    description: "The filing is actively being processed by the team.",
    fallbackColor: "#ea580c",
    fallbackLabel: "Review",
    icon: "fa-gear",
    slug: "review",
  },
  submitted_to_ca: {
    description: "The case has moved forward for department or CA handling.",
    fallbackColor: "#7c3aed",
    fallbackLabel: "Department Submission",
    icon: "fa-paper-plane",
    slug: "department-submission",
  },
  approved: {
    description: "The lifecycle is complete and ready for final closure.",
    fallbackColor: "#16a34a",
    fallbackLabel: "Completed",
    icon: "fa-flag-checkered",
    slug: "completed",
  },
};

export const ACCOUNTANT_DEFAULT_LIFECYCLE_STATUSES = [
  "applied",
  "under_review",
  "in_progress",
  "submitted_to_ca",
  "approved",
] as const;

const SPECIAL_LIFECYCLE_STATUS_META: Record<
  string,
  SpecialLifecycleStatusMeta
> = {
  cancelled: {
    color: "#64748b",
    description:
      "Cancel this application and remove it from active processing.",
    icon: "fa-ban",
    label: "Cancel Application",
  },
  rejected: {
    color: "#dc2626",
    description: "Stop the filing and record the official rejection reason.",
    icon: "fa-circle-xmark",
    label: "Reject Filing",
  },
  update_required: {
    color: "#d97706",
    description: "Ask the client to correct or resubmit the required details.",
    icon: "fa-pen-to-square",
    label: "Request Correction",
  },
};

export const ACCOUNTANT_SPECIAL_LIFECYCLE_STATUSES = [
  "cancelled",
  "rejected",
  "update_required",
] as const;

export function normalizeSharedLifecycleStage(
  stage: any,
): SharedLifecycleStage {
  return {
    id: Number(stage?.id ?? 0),
    name: String(stage?.name ?? ""),
    slug: String(stage?.slug ?? ""),
    color: String(stage?.color ?? "#1d4ed8"),
    is_active: Boolean(stage?.is_active ?? stage?.isActive ?? false),
    is_default: Boolean(stage?.is_default ?? stage?.isDefault ?? false),
  };
}

export function canTransitionLifecycleStatus(
  currentStatus: string | null | undefined,
  nextStatus: string | null | undefined,
) {
  const normalizedCurrentStatus = normalizeLifecycleStatus(currentStatus);
  const normalizedNextStatus = normalizeLifecycleStatus(nextStatus);

  if (!normalizedCurrentStatus || !normalizedNextStatus) {
    return false;
  }

  if (normalizedCurrentStatus === normalizedNextStatus) {
    return true;
  }

  return (LIFECYCLE_STATUS_FLOW[normalizedCurrentStatus] ?? []).includes(
    normalizedNextStatus,
  );
}

export function resolveInitialLifecycleStatusSelection(
  currentStatus: string | null | undefined,
  visibleStatuses: string[],
) {
  const normalizedCurrentStatus = normalizeLifecycleStatus(currentStatus);

  return visibleStatuses.includes(normalizedCurrentStatus)
    ? normalizedCurrentStatus
    : "";
}

export function filterLifecycleStatusOptions({
  currentStatus,
  selectedStatus,
  defaultStatuses,
  specialStatuses,
}: {
  currentStatus: string | null | undefined;
  selectedStatus?: string | null;
  defaultStatuses: string[];
  specialStatuses: string[];
}) {
  const allowedStatuses = new Set<string>();
  const normalizedCurrentStatus = normalizeLifecycleStatus(currentStatus);
  const normalizedSelectedStatus = normalizeLifecycleStatus(selectedStatus);

  if (normalizedCurrentStatus) {
    allowedStatuses.add(normalizedCurrentStatus);
  }

  if (normalizedSelectedStatus) {
    allowedStatuses.add(normalizedSelectedStatus);
  }

  (LIFECYCLE_STATUS_FLOW[normalizedCurrentStatus] ?? []).forEach((status) => {
    allowedStatuses.add(status);
  });

  return {
    defaultStatuses: defaultStatuses.filter((status) =>
      allowedStatuses.has(normalizeLifecycleStatus(status)),
    ),
    specialStatuses: specialStatuses.filter((status) =>
      allowedStatuses.has(normalizeLifecycleStatus(status)),
    ),
  };
}

function buildDefaultLifecycleOption(
  defaultStages: SharedLifecycleStage[],
  status: string,
): LifecycleStatusOption | null {
  const meta = DEFAULT_LIFECYCLE_STATUS_META[status];

  if (!meta) {
    return null;
  }

  const stage =
    defaultStages.find((candidate) => candidate.slug === meta.slug) ?? null;

  return {
    color: stage?.color ?? meta.fallbackColor,
    description: meta.description,
    icon: meta.icon,
    kind: "default",
    label: stage?.name ?? meta.fallbackLabel,
    stage,
    value: status,
  };
}

function buildSpecialLifecycleOption(
  status: string,
): LifecycleStatusOption | null {
  const meta = SPECIAL_LIFECYCLE_STATUS_META[status];

  if (!meta) {
    return null;
  }

  return {
    color: meta.color,
    description: meta.description,
    icon: meta.icon,
    kind: "special",
    label: meta.label,
    stage: null,
    value: status,
  };
}

export function buildLifecycleStatusGroups({
  defaultStages,
  defaultStatuses,
  specialStatuses,
}: {
  defaultStages: SharedLifecycleStage[];
  defaultStatuses: string[];
  specialStatuses: string[];
}): LifecycleStatusGroup[] {
  const defaultOptions = defaultStatuses
    .map((status) => buildDefaultLifecycleOption(defaultStages, status))
    .filter((option): option is LifecycleStatusOption => option !== null);
  const specialOptions = specialStatuses
    .map((status) => buildSpecialLifecycleOption(status))
    .filter((option): option is LifecycleStatusOption => option !== null);

  const groups: LifecycleStatusGroup[] = [];

  if (defaultOptions.length > 0) {
    groups.push({
      description:
        "These labels come from the shared default milestone library and update automatically when that library changes.",
      id: "default",
      label: "Shared Default Milestones",
      options: defaultOptions,
    });
  }

  if (specialOptions.length > 0) {
    groups.push({
      description:
        "Use these when the request needs an exception, correction cycle, or hard stop.",
      id: "special",
      label: "Special Lifecycle Actions",
      options: specialOptions,
    });
  }

  return groups;
}

export type WorkflowStage = {
  id: number;
  stage_id: number | null;
  name: string;
  slug: string;
  color: string;
  order_index: number;
  is_active: boolean;
  is_required: boolean;
  is_completed?: boolean;
  is_current?: boolean;
};

export type TimelineStage = WorkflowStage & {
  timeline_index: number;
  timeline_key: string;
};

export type DefaultWorkflowTemplateItem = {
  id: number;
  stage_id: number | null;
  position: number;
  is_required: boolean;
  stage: {
    id: number;
    name: string;
    slug: string;
    color: string;
    is_active?: boolean;
    isActive?: boolean;
  } | null;
};

export const SHARED_TIMELINE_STAGE_SLUGS_BY_STATUS: Record<string, string[]> = {
  in_cart: ["payment-verification", "start"],
  payment_pending: ["payment-verification", "start"],
  applied: ["payment-verification", "start"],
  paid: ["payment-verification", "start"],
  under_review: ["start", "verification", "review"],
  update_required: ["verification", "review", "start"],
  in_progress: ["review", "verification", "start"],
  submitted_to_ca: ["department-submission", "review", "verification", "start"],
  approved: ["completed", "complete"],
  completed: ["completed", "complete"],
  cancelled: ["cancelled", "canceled", "cancel"],
  rejected: ["start"],
};

const MUTUALLY_EXCLUSIVE_TERMINAL_STAGE_SLUGS: Record<string, string[]> = {
  approved: ["cancelled", "canceled", "cancel"],
  completed: ["cancelled", "canceled", "cancel"],
  cancelled: ["completed", "complete"],
};

export function parsePositiveNumber(value: unknown): number | null {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function isMutuallyExclusiveTerminalStage(
  status: unknown,
  stage: WorkflowStage,
) {
  const normalizedStatus = String(status ?? "")
    .trim()
    .toLowerCase();
  const excludedSlugs =
    MUTUALLY_EXCLUSIVE_TERMINAL_STAGE_SLUGS[normalizedStatus] ?? [];

  return excludedSlugs.includes(normalizeStageName(stage.slug).toLowerCase());
}

export function normalizeStageName(value: unknown): string {
  return String(value ?? "").trim();
}

export function sortWorkflowStages(
  left: Pick<WorkflowStage, "order_index" | "id">,
  right: Pick<WorkflowStage, "order_index" | "id">,
) {
  return (
    Number(left.order_index) - Number(right.order_index) ||
    Number(left.id) - Number(right.id)
  );
}

export function normalizeWorkflowStage(stage: any): WorkflowStage {
  const workflowStage =
    stage?.stage ??
    stage?.workflow_stage ??
    stage?.workflowStage ??
    stage?.milestone ??
    null;
  const resolvedOrder =
    stage?.order_index ??
    stage?.orderIndex ??
    stage?.position ??
    stage?.timeline_index ??
    stage?.timelineIndex ??
    workflowStage?.order_index ??
    workflowStage?.orderIndex ??
    workflowStage?.position ??
    1;
  const normalizedOrder = Number(resolvedOrder);

  return {
    id:
      parsePositiveNumber(
        stage?.service_workflow_id ??
          stage?.serviceWorkflowId ??
          stage?.workflow_id ??
          stage?.workflowId ??
          stage?.id,
      ) ??
      parsePositiveNumber(workflowStage?.service_workflow_id) ??
      parsePositiveNumber(workflowStage?.serviceWorkflowId) ??
      parsePositiveNumber(workflowStage?.workflow_id) ??
      parsePositiveNumber(workflowStage?.workflowId) ??
      parsePositiveNumber(workflowStage?.id) ??
      0,
    stage_id:
      parsePositiveNumber(
        stage?.stage_id ??
          stage?.stageId ??
          workflowStage?.stage_id ??
          workflowStage?.stageId ??
          workflowStage?.id,
      ) ?? null,
    name:
      normalizeStageName(stage?.name) ||
      normalizeStageName(workflowStage?.name) ||
      normalizeStageName(stage?.label) ||
      normalizeStageName(workflowStage?.label) ||
      normalizeStageName(stage?.title) ||
      normalizeStageName(workflowStage?.title),
    slug:
      normalizeStageName(stage?.slug) ||
      normalizeStageName(workflowStage?.slug),
    color:
      normalizeStageName(stage?.color) ||
      normalizeStageName(workflowStage?.color) ||
      "#1d4ed8",
    order_index: Number.isFinite(normalizedOrder) ? normalizedOrder : 1,
    is_active: Boolean(
      stage?.is_active ??
      stage?.isActive ??
      stage?.active ??
      workflowStage?.is_active ??
      workflowStage?.isActive ??
      workflowStage?.active ??
      false,
    ),
    is_required: Boolean(
      stage?.is_required ??
      stage?.isRequired ??
      stage?.required ??
      stage?.pivot?.is_required ??
      workflowStage?.pivot?.is_required ??
      true,
    ),
    is_completed: Boolean(stage?.is_completed ?? stage?.isCompleted ?? false),
    is_current: Boolean(
      stage?.is_current ?? stage?.isCurrent ?? stage?.current ?? false,
    ),
  };
}

export function attachTimelineMetadata(
  stages: WorkflowStage[],
): TimelineStage[] {
  return stages.map((stage, index) => ({
    ...stage,
    timeline_index: index + 1,
    timeline_key: [
      parsePositiveNumber(stage.id) ?? "workflow",
      parsePositiveNumber(stage.stage_id) ?? "stage",
      stage.order_index,
      normalizeStageName(stage.name) || "unnamed",
      index + 1,
    ].join(":"),
  }));
}

export function resolveSharedTimelineCurrentIndex(
  stages: WorkflowStage[],
  status: unknown,
) {
  if (stages.length === 0) {
    return -1;
  }

  const normalizedStatus = String(status ?? "")
    .trim()
    .toLowerCase();
  const candidateSlugs =
    SHARED_TIMELINE_STAGE_SLUGS_BY_STATUS[normalizedStatus] ?? [];

  for (const slug of candidateSlugs) {
    const stageIndex = stages.findIndex(
      (stage) => normalizeStageName(stage.slug).toLowerCase() === slug,
    );

    if (stageIndex >= 0) {
      return stageIndex;
    }
  }

  if (normalizedStatus === "approved" || normalizedStatus === "completed") {
    return stages.length - 1;
  }

  return 0;
}

export function buildSharedTimelineStages(
  template: DefaultWorkflowTemplateItem[],
  status: unknown,
) {
  const normalizedStages = Array.isArray(template)
    ? [...template].map(normalizeWorkflowStage).sort(sortWorkflowStages)
    : [];

  if (normalizedStages.length === 0) {
    return [];
  }

  const currentStageIndex = resolveSharedTimelineCurrentIndex(
    normalizedStages,
    status,
  );

  return attachTimelineMetadata(
    normalizedStages.map((stage, index) => ({
      ...stage,
      is_active: true,
      is_completed:
        currentStageIndex >= 0 &&
        index < currentStageIndex &&
        !isMutuallyExclusiveTerminalStage(status, stage),
      is_current: index === currentStageIndex,
    })),
  );
}

export function getWorkflowStageLabel(
  stage: Pick<WorkflowStage, "name"> | null | undefined,
  fallbackIndex?: number | null,
) {
  const normalizedName = normalizeStageName(stage?.name);

  if (normalizedName) {
    return normalizedName;
  }

  if (fallbackIndex && fallbackIndex > 0) {
    return `Milestone ${fallbackIndex}`;
  }

  return "Milestone";
}

export function stageIdentityMatches(
  left:
    | Pick<WorkflowStage, "id" | "stage_id" | "name" | "order_index">
    | null
    | undefined,
  right:
    | Pick<WorkflowStage, "id" | "stage_id" | "name" | "order_index">
    | null
    | undefined,
) {
  if (!left || !right) {
    return false;
  }

  const leftWorkflowId = parsePositiveNumber(left.id);
  const rightWorkflowId = parsePositiveNumber(right.id);

  if (
    leftWorkflowId !== null &&
    rightWorkflowId !== null &&
    leftWorkflowId === rightWorkflowId
  ) {
    return true;
  }

  const leftStageId = parsePositiveNumber(left.stage_id);
  const rightStageId = parsePositiveNumber(right.stage_id);

  if (
    leftStageId !== null &&
    rightStageId !== null &&
    leftStageId === rightStageId
  ) {
    return true;
  }

  const leftName = normalizeStageName(left.name).toLowerCase();
  const rightName = normalizeStageName(right.name).toLowerCase();

  return leftName.length > 0 && rightName.length > 0 && leftName === rightName;
}
