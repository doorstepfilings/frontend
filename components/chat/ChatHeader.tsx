import { UnreadBadge } from "@/components/chat/UnreadBadge";

type ChatHeaderProps = {
  title: string;
  subtitle?: string | null;
  latestMessagePreview?: string | null;
  unreadCount?: number;
  isConnected?: boolean;
};

export function ChatHeader({
  title,
  subtitle,
  latestMessagePreview,
  unreadCount = 0,
  isConnected = false,
}: ChatHeaderProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-950">
            {subtitle || "Conversation"}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
            {latestMessagePreview || "Live service conversation"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold ${
              isConnected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {isConnected ? "Online" : "Reconnecting"}
          </span>
          <UnreadBadge count={unreadCount} />
        </div>
      </div>
    </div>
  );
}
