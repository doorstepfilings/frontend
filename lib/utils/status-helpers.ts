const STATUS_CONFIG: Record<
  string,
  {
    color: string;
    icon: string;
    label: string;
    progress: number;
  }
> = {
  draft: {
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "fa-pen",
    label: "Draft",
    progress: 10,
  },
  payment_pending: {
    color: "bg-rose-100 text-rose-700 border-rose-200",
    icon: "fa-credit-card",
    label: "Payment Pending",
    progress: 20,
  },
  paid: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "fa-wallet",
    label: "Payment Verified",
    progress: 30,
  },
  applied: {
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "fa-sparkles",
    label: "Initial Submission",
    progress: 40,
  },
  document_collection: {
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "fa-folder-open",
    label: "Collect Documents",
    progress: 50,
  },
  under_review: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "fa-magnifying-glass",
    label: "Verification Stage",
    progress: 60,
  },
  update_required: {
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "fa-rotate-left",
    label: "Request Correction",
    progress: 60,
  },
  in_progress: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "fa-spinner fa-spin",
    label: "Processing / Dept Submission",
    progress: 80,
  },
  completed: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "fa-check-circle",
    label: "Service Completed",
    progress: 100,
  },
  rejected: {
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "fa-ban",
    label: "Reject Filing",
    progress: 100,
  },
  cancelled: {
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "fa-times-circle",
    label: "Cancel Application",
    progress: 0,
  },
};

const DEFAULT_STATUS = {
  color: "bg-slate-100 text-slate-700 border-slate-200",
  icon: "fa-circle",
  label: "",
  progress: 10,
};

export function getStatusConfig(status: string) {
  const normalizedStatus = String(status || "").toLowerCase();
  const config = STATUS_CONFIG[normalizedStatus];

  if (config) {
    return config;
  }

  return {
    ...DEFAULT_STATUS,
    label:
      normalizedStatus.charAt(0).toUpperCase() +
      normalizedStatus.slice(1).replace(/_/g, " "),
  };
}

export type MilestoneState = {
  currentStep: number;
  isWarning: boolean;
};

export function getMilestoneState(status: string): MilestoneState {
  const normalizedStatus = String(status || "").toLowerCase();

  // Milestone 1: Submission (draft = still at submission)
  if (normalizedStatus === "draft") {
    return { currentStep: 1, isWarning: false };
  }

  // Milestone 2: Payment (applied = submission done, now at payment; payment_pending = waiting for payment)
  if (["applied", "payment_pending"].includes(normalizedStatus)) {
    return { currentStep: 2, isWarning: normalizedStatus === "payment_pending" };
  }
  
  // Milestone 3: Verification (paid = payment done, now at verification stage)
  if (["paid", "document_collection", "under_review", "update_required"].includes(normalizedStatus)) {
    return { currentStep: 3, isWarning: normalizedStatus === "update_required" };
  }
  
  // Milestone 4: Processing
  if (["in_progress"].includes(normalizedStatus)) {
    return { currentStep: 4, isWarning: false };
  }
  
  // Milestone 5: Completion
  if (["completed", "approved", "rejected", "cancelled"].includes(normalizedStatus)) {
    return { currentStep: 5, isWarning: ["rejected", "cancelled"].includes(normalizedStatus) };
  }

  return { currentStep: 1, isWarning: false };
}

export const getStatusLabel = (status: string) => getStatusConfig(status).label;
export const getStatusColorClass = (status: string) => getStatusConfig(status).color;
export const getStatusColor = getStatusColorClass;
export const getStatusIcon = (status: string) => getStatusConfig(status).icon;
export const getProgressPercentage = (status: string) => getStatusConfig(status).progress;
