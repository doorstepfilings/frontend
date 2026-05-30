import type { ChatMessage } from "@/components/chat/chat.types";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  isOwnMessage: boolean;
  formattedTime: string;
};

function formatRole(role: string) {
  switch (role?.toLowerCase()) {
    case "super_admin":
      return "Super Admin";
    case "admin":
      return "Admin";
    case "regional_manager":
    case "rm":
      return "RM";
    case "accountant":
      return "Accountant";
    default:
      return "User";
  }
}

export function ChatMessageBubble({
  message,
  isOwnMessage,
  formattedTime,
}: ChatMessageBubbleProps) {
  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} animate-fadeIn`}
    >
      <div
        className={`flex max-w-[88%] flex-col gap-1.5 sm:max-w-[75%] ${
          isOwnMessage ? "items-end" : "items-start"
        }`}
      >
        <div className="px-1 text-[10px] font-semibold text-slate-500">
          {isOwnMessage ? "You" : message.sender.name} {" - "}{" "}
          {formatRole(message.sender.role)}
        </div>
        <div
          className={[
            "px-5 py-3.5 text-sm font-medium leading-relaxed shadow-sm transition-all",
            isOwnMessage
              ? "rounded-[2rem] rounded-br-md bg-blue-600 text-white shadow-blue-900/10"
              : "rounded-[2rem] rounded-bl-md border border-slate-200 bg-white text-slate-800",
          ].join(" ")}
        >
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
        </div>
        <div className="mt-0.5 px-1 text-[10px] text-slate-400">
          {formattedTime}
        </div>
      </div>
    </div>
  );
}
