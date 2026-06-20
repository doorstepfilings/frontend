"use client";

import { Modal } from "@/components/ui/modal";
import { useState, useMemo, useEffect, useRef } from "react";
import toast from "react-hot-toast";

interface ChatNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  contextName?: string;
  noteText?: string | null;
  userType?: "user" | "accountant" | "admin";
  fallbackSender?: string;
  fallbackRole?: string;
  uploadedBy?: { id?: number | string; name?: string; role?: string } | null;
  clientName?: string;
  accountantName?: string;
}

export function ChatNoteModal({
  isOpen,
  onClose,
  title = "Document Notes",
  contextName = "Document",
  noteText,
  userType = "user",
  fallbackSender,
  fallbackRole,
  uploadedBy,
  clientName,
  accountantName,
  onSubmitNote,
}: ChatNoteModalProps & { onSubmitNote?: (note: string) => Promise<void> }) {
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const parsedNotes = useMemo(() => {
    if (!noteText) return [];
    return noteText.split('\n\n').filter(n => n.trim() !== '').map(chunk => {
      const match = chunk.match(/^(Accountant|Admin|Super_Admin|SuperAdmin|Super\s+Admin|You|User|Client|System)(?:\s*\((.*?)\))?:\s*([\s\S]*)/i);
      if (match) {
        const role = match[1];
        const name = match[2];
        
        let normalizedRole = role;
        const lowerRole = role.toLowerCase();
        if (lowerRole.includes("super")) {
          normalizedRole = "Super Admin";
        } else if (lowerRole === "admin") {
          normalizedRole = "Admin";
        } else if (lowerRole === "accountant") {
          normalizedRole = "Accountant";
        } else if (lowerRole === "system") {
          normalizedRole = "System";
        } else if (lowerRole === "user" || lowerRole === "client") {
          normalizedRole = "User";
        }
        
        let resolvedSender = name || role.replace(/_/g, " ");
        if (!name || ["you", "accountant", "admin", "super_admin", "superadmin", "super admin", "user", "client", "system"].includes(resolvedSender.toLowerCase())) {
          if (normalizedRole === "Accountant" && accountantName) {
            resolvedSender = accountantName;
          } else if (normalizedRole === "User" && clientName) {
            resolvedSender = clientName;
          }
        }
        
        return { role: normalizedRole, sender: resolvedSender, text: match[3].trim() };
      }
      
      // Fallback: prefer explicit context from the caller, then use uploader metadata.
      let role = fallbackRole || uploadedBy?.role || "Accountant";
      let sender = fallbackSender || uploadedBy?.name || role;

      if (!fallbackRole && !fallbackSender && uploadedBy) {
        role = uploadedBy.role || "User";
        sender = uploadedBy.name || role;
      }
      
      let normalizedRole = role;
      const lowerRole = role.toLowerCase();
      if (lowerRole.includes("super")) {
        normalizedRole = "Super Admin";
      } else if (lowerRole === "admin") {
        normalizedRole = "Admin";
      } else if (lowerRole === "accountant") {
        normalizedRole = "Accountant";
      } else if (lowerRole === "system") {
        normalizedRole = "System";
      } else if (lowerRole === "user" || lowerRole === "client" || lowerRole === "customer") {
        normalizedRole = "User";
      }
      
      let resolvedSender = sender;
      if (!fallbackSender && uploadedBy && uploadedBy.name) {
        resolvedSender = uploadedBy.name;
      } else if (["you", "accountant", "admin", "super_admin", "superadmin", "super admin", "user", "client", "customer"].includes(resolvedSender.toLowerCase())) {
        if (normalizedRole === "Accountant" && accountantName) {
          resolvedSender = accountantName;
        } else if (normalizedRole === "User" && clientName) {
          resolvedSender = clientName;
        }
      }
      
      return { role: normalizedRole, sender: resolvedSender, text: chunk.trim() };
    });
  }, [noteText, fallbackRole, fallbackSender, uploadedBy, clientName, accountantName]);

  const isMe = (msg: { role: string }) => {
    if (userType === "user" && msg.role === "User") return true;
    if (userType === "accountant" && msg.role === "Accountant") return true;
    if (userType === "admin" && (msg.role === "Admin" || msg.role === "Super Admin" || msg.role === "Accountant")) return true;
    return false;
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [parsedNotes, isOpen]);

  if (!noteText && !isOpen) return null;

  const handleSend = async () => {
    if (!inputValue.trim() || !onSubmitNote) return;
    setIsSubmitting(true);
    try {
      await onSubmitNote(inputValue);
      setInputValue("");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" noPadding>
      <div className="flex flex-col h-[75vh] max-h-[700px]">
        {/* Premium Header */}
        <div className="shrink-0 px-8 pt-8 pb-5 border-b border-slate-100  from-slate-50/80 to-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <i className="fas fa-comments text-white text-sm"></i>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                  {title}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Conversation Thread
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-700"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>

          {/* Regarding Pill */}
          <div className="flex justify-start">
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/60 uppercase tracking-wider">
              <i className="fas fa-file-alt mr-2 opacity-40"></i>
              Regarding: {contextName}
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 bg-[#f8fafc]">
          {parsedNotes.length > 0 ? (
            parsedNotes.map((msg, idx) => {
              const me = isMe(msg);

              let avatarGradient = "from-emerald-500 to-teal-600";
              let avatarShadow = "shadow-emerald-500/20";
              if (msg.role === "Admin" || msg.role === "Super Admin") {
                avatarGradient = "from-purple-500 to-violet-600";
                avatarShadow = "shadow-purple-500/20";
              } else if (msg.role === "User") {
                avatarGradient = "from-blue-500 to-indigo-600";
                avatarShadow = "shadow-blue-500/20";
              }

              const avatarInitial = msg.sender.charAt(0).toUpperCase();

              return (
                <div
                  key={idx}
                  className={`flex gap-3 w-full animate-fadeIn ${
                    me ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {!me && (
                    <div
                      title={msg.sender}
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center font-black text-xs text-white shrink-0 shadow-md ${avatarShadow}`}
                    >
                      {avatarInitial}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[75%] ${me ? "items-end" : "items-start"}`}>
                    <span className={`text-[10px] font-bold mb-1.5 px-1 uppercase tracking-wider flex items-center gap-1.5 ${me ? "text-blue-500" : "text-slate-400"}`}>
                      <span>
                        {msg.sender}
                        {me && <span className="text-[9px] font-normal text-blue-500/70 lowercase ml-1">(you)</span>}
                      </span>
                      {msg.role !== "User" && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 normal-case tracking-normal">
                          {msg.role}
                        </span>
                      )}
                    </span>
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed ${
                        me
                          ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-md shadow-md shadow-blue-600/15"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-md shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                <i className="fas fa-comments text-2xl text-blue-400"></i>
              </div>
              <p className="text-sm font-bold text-slate-500">No conversation yet</p>
              <p className="text-xs text-slate-400 mt-1.5">Type a note below to start the conversation.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        {onSubmitNote && (
          <div className="shrink-0 px-8 py-5 border-t border-slate-100 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your note..."
                disabled={isSubmitting}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white shadow-sm transition-all disabled:opacity-50 placeholder:text-slate-400"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={isSubmitting || !inputValue.trim()}
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-blue-600/20 shrink-0 disabled:opacity-40 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <i className="fas fa-spinner fa-spin text-sm"></i>
                ) : (
                  <i className="fas fa-paper-plane text-sm"></i>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
