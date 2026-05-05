export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500",
    in_progress: "bg-blue-500",
    completed: "bg-green-500",
    rejected: "bg-red-500",
    draft: "bg-slate-400",
    update_required: "bg-orange-500",
    submitted: "bg-indigo-500",
    approved: "bg-emerald-500",
  };
  return colors[status] || "bg-slate-500";
}

export function getStatusLabel(status: string) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
