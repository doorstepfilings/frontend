import { Send, Loader2 } from "lucide-react";

type ChatInputProps = {
  value: string;
  disabled?: boolean;
  sending?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
};

export function ChatInput({ value, disabled = false, sending = false, onChange, onSend }: ChatInputProps) {
  const isDisabled = disabled || sending || !value.trim();

  return (
    <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition-all focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50">
        <textarea
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!isDisabled) {
                onSend();
              }
            }
          }}
          placeholder="Type your message here..."
          className="max-h-28 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={isDisabled}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
