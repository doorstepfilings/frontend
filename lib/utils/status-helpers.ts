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
    progress: 15,
  },
  pending: {
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: "fa-hourglass-half",
    label: "Awaiting Review",
    progress: 45,
  },
  document_collection: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "fa-folder-open",
    label: "Documentation",
    progress: 50,
  },
  submitted_to_ca: {
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "fa-paper-plane",
    label: "Forwarded to CA",
    progress: 60,
  },
  under_review: {
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    icon: "fa-magnifying-glass",
    label: "Verification",
    progress: 75,
  },
  update_required: {
    color: "bg-rose-100 text-rose-700 border-rose-200",
    icon: "fa-rotate-left",
    label: "Action Required",
    progress: 35,
  },
  revision_requested: {
    color: "bg-rose-100 text-rose-700 border-rose-200",
    icon: "fa-rotate-left",
    label: "Revision Required",
    progress: 55,
  },
  approved: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "fa-check-double",
    label: "Approved",
    progress: 100,
  },
  rejected: {
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "fa-ban",
    label: "Rejected",
    progress: 100,
  },
  applied: {
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "fa-info-circle",
    label: "New Order",
    progress: 10,
  },
  paid: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "fa-check-circle",
    label: "Payment Verified",
    progress: 40,
  },
  in_progress: {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "fa-spinner fa-spin",
    label: "Processing",
    progress: 60,
  },
  completed: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "fa-check-circle",
    label: "Service Completed",
    progress: 100,
  },
  cancelled: {
    color: "bg-red-100 text-red-700 border-red-200",
    icon: "fa-times-circle",
    label: "Cancelled",
    progress: 0,
  },
  on_hold: {
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "fa-pause-circle",
    label: "On Hold",
    progress: 50,
  },
  pending_documents: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: "fa-file-medical",
    label: "Pending Documents",
    progress: 70,
  },
  payment_pending: {
    color: "bg-rose-100 text-rose-700 border-rose-200",
    icon: "fa-credit-card",
    label: "Payment Pending",
    progress: 30,
  },
};

const DEFAULT_STATUS = {
  color: "bg-slate-100 text-slate-700 border-slate-200",
  icon: "fa-circle",
  label: "",
  progress: 10,
};

function getStatusConfig(status: string) {
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

export const getStatusLabel = (status: string) => getStatusConfig(status).label;
export const getStatusColorClass = (status: string) => getStatusConfig(status).color;
export const getStatusColor = getStatusColorClass;
export const getStatusIcon = (status: string) => getStatusConfig(status).icon;
export const getProgressPercentage = (status: string) => getStatusConfig(status).progress;
