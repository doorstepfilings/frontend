"use client";

import { Modal } from "@/components/ui/modal";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";

interface ChatNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  contextName?: string;
  noteText?: string | null;
  userType?: "user" | "accountant" | "admin";
}

export function ChatNoteModal({
  isOpen,
  onClose,
  title = "Document Notes",
  contextName = "Document",
  noteText,
  userType = "user",
  onSubmitNote,
}: ChatNoteModalProps & { onSubmitNote?: (note: string) => Promise<void> }) {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedNotes = useMemo(() => {
    if (!noteText) return [];
    return noteText.split('\n\n').filter(n => n.trim() !== '').map(chunk => {
      const match = chunk.match(/^(Accountant|Admin|You)(?:\s*\((.*?)\))?:\s*([\s\S]*)/i);
      if (match) {
        const role = match[1];
        const name = match[2];
        return { role, sender: name || role, text: match[3].trim() };
      }
      return { role: "Accountant", sender: "Accountant", text: chunk.trim() };
    });
  }, [noteText]);

  if (!noteText && !isOpen) return null;

  const handleSend = async () => {
    if (!inputValue.trim() || !onSubmitNote) return;
    setIsSubmitting(true);
    try {
      await onSubmitNote(inputValue);
      setInputValue("");
    } catch (err) {
      toast.error("Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" noPadding>
      <div className="flex flex-col p-6 sm:p-8">
        {/* Custom Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        {/* Regarding Pill */}
        <div className="flex justify-start mb-6">
          <span className="text-xs font-bold text-slate-600 bg-[#eef2f6] px-4 py-2 rounded-xl border border-slate-100">
            <i className="fas fa-file-alt mr-2 opacity-50"></i>
            Regarding: {contextName}
          </span>
        </div>

        {/* Messages Area */}
        <div className="flex flex-col gap-4 min-h-[250px] max-h-[50vh] overflow-y-auto pb-4">

          {parsedNotes.length > 0 ? (
            parsedNotes.map((msg, idx) => {
              // Determine styles based on sender
              let avatarBg = "bg-[#e6f4ea]";
              let avatarText = "text-[#0d652d]";
              let nameColor = "text-[#0d652d]";
              let avatarInitial = "A";

              if (msg.role === "Admin") {
                avatarBg = "bg-[#f3e8ff]";
                avatarText = "text-[#7e22ce]";
                nameColor = "text-[#7e22ce]";
                avatarInitial = "A";
              } else if (msg.role === "You") {
                avatarBg = "bg-[#e8f0fe]";
                avatarText = "text-[#1a73e8]";
                nameColor = "text-[#1a73e8]";
                avatarInitial = "Y";
              }

              return (
                <div key={idx} className="border border-slate-100 rounded-2xl p-5 flex gap-4 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                  <div className={`w-10 h-10 rounded-full ${avatarBg} ${avatarText} flex items-center justify-center font-black text-lg shrink-0`}>
                    {avatarInitial}
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold ${nameColor} mb-2`}>{msg.sender}</span>
                    <div className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
              <i className="fas fa-comment-dots text-3xl mb-3 opacity-30"></i>
              <p className="text-sm font-medium">No notes available.</p>
            </div>
          )}

        </div>

        {/* Bottom Input Area */}
        {onSubmitNote && (
          <div className="mt-2 flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type note..."
              disabled={isSubmitting}
              className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 focus:border-[#1a73e8] shadow-sm disabled:opacity-50"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={isSubmitting || !inputValue.trim()}
              className="w-12 h-12 bg-[#1a73e8] hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center transition-all shadow-md shrink-0 disabled:opacity-50"
            >
              {isSubmitting ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>
          </div>
        )}

      </div>
    </Modal>
  );
}
