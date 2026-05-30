type UnreadBadgeProps = {
  count: number;
};

export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) {
    return (
      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-500">
        0
      </span>
    );
  }

  return (
    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-blue-600 px-2 text-[11px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
