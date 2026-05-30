"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { format, isToday, isYesterday } from "date-fns";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/api/client";
import { useStoredSession } from "@/lib/auth/hooks";
import { appConfig } from "@/lib/config";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import type {
  ChatMessage,
  ChatParticipant,
  ChatThread,
} from "@/components/chat/chat.types";

type ChatBoxProps = {
  userServiceId: number;
  title?: string;
  counterpart?: ChatParticipant | null;
};

type SocketAckError = Error | null;

function unwrapResponse<T>(payload: { data?: T } | T): T {
  if (payload && typeof payload === "object" && "data" in (payload as { data?: T })) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
}

function formatMessageTime(value: string) {
  const date = new Date(value);

  if (isToday(date)) {
    return format(date, "h:mm a");
  }

  if (isYesterday(date)) {
    return `Yesterday - ${format(date, "h:mm a")}`;
  }

  return format(date, "dd MMM - h:mm a");
}

export function ChatBox({
  userServiceId,
  title = "Chat with Expert",
  counterpart,
}: ChatBoxProps) {
  const { user, token, status } = useStoredSession();
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingName, setTypingName] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingAtRef = useRef(0);
  const currentUserId = Number(user?.id ?? user?.user_id ?? 0);

  const counterpartLabel = useMemo(
    () => counterpart?.name || "Conversation",
    [counterpart?.name],
  );

  const markThreadAsRead = useCallback(async (threadId: number) => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    try {
      if (socketRef.current?.connected) {
        await new Promise<void>((resolve, reject) => {
          socketRef.current
            ?.timeout(5000)
            .emit("markAsRead", { threadId }, (ackError: SocketAckError) => {
              if (ackError) {
                reject(ackError);
                return;
              }

              resolve();
            });
        });
      } else {
        await apiClient.patch(`/chat/messages/${threadId}/read`);
      }

      setUnreadCount(0);
    } catch (markError) {
      console.error("Failed to mark thread as read", markError);
    }
  }, []);

  useEffect(() => {
    if (!userServiceId) {
      return;
    }

    let cancelled = false;

    const loadChat = async () => {
      try {
        const threadResponse = await apiClient.get(`/chat/thread/${userServiceId}`);
        const threadData = unwrapResponse<ChatThread>(threadResponse.data);
        if (cancelled) {
          return;
        }

        setThread(threadData);
        setUnreadCount(threadData.unreadCount ?? 0);

        const messagesResponse = await apiClient.get(`/chat/messages/${threadData.id}`);
        const messageData = unwrapResponse<ChatMessage[]>(messagesResponse.data) ?? [];
        if (cancelled) {
          return;
        }

        setMessages(messageData);

        if ((threadData.unreadCount ?? 0) > 0) {
          await markThreadAsRead(threadData.id);
        }
      } catch (loadError) {
        console.error("Failed to load chat", loadError);
        if (!cancelled) {
          setError("Unable to load this conversation right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadChat();

    return () => {
      cancelled = true;
    };
  }, [markThreadAsRead, userServiceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingName]);

  useEffect(() => {
    if (!thread?.id) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && unreadCount > 0) {
        void markThreadAsRead(thread.id);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [markThreadAsRead, thread?.id, unreadCount]);

  useEffect(() => {
    if (!token || !userServiceId || status !== "authenticated") {
      return;
    }

    const socket = io(`${appConfig.backendUrl}/chat`, {
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("joinRoom", { userServiceId });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("newMessage", (message: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) {
          return prev;
        }

        return [...prev, message];
      });

      setThread((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: message.message,
              lastMessageAt: message.createdAt,
              latestMessagePreview: message.message,
            }
          : prev,
      );

      if (message.senderId === currentUserId) {
        return;
      }

      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void markThreadAsRead(message.threadId);
      } else {
        setUnreadCount((prev) => prev + 1);
        toast(
          () => (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">
                New message from {message.sender.name}
              </span>
              <span className="line-clamp-2 text-sm font-semibold text-slate-800">
                {message.message}
              </span>
            </div>
          ),
          { position: "bottom-right", duration: 4000, id: `msg-${message.id}` },
        );
      }
    });

    socket.on("typing", (payload: { userId: number; name?: string }) => {
      if (payload.userId === currentUserId) {
        return;
      }

      setTypingName(payload.name ?? "Someone");

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => setTypingName(null), 1800);
    });

    socket.on("socketError", (payload: { message?: string }) => {
      setError(payload.message ?? "Socket connection failed.");
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [currentUserId, markThreadAsRead, status, token, userServiceId]);

  const emitTyping = useCallback(() => {
    const now = Date.now();

    if (!socketRef.current?.connected || now - lastTypingAtRef.current < 1200) {
      return;
    }

    lastTypingAtRef.current = now;
    socketRef.current.emit("typing", { userServiceId });
  }, [userServiceId]);

  const handleSend = useCallback(async () => {
    const message = input.trim();

    if (!message || !thread) {
      return;
    }

    if (!socketRef.current?.connected) {
      toast.error("Chat is reconnecting. Please try again.");
      return;
    }

    setSending(true);
    setInput("");

    try {
      await new Promise<ChatMessage>((resolve, reject) => {
        socketRef.current
          ?.timeout(8000)
          .emit(
            "sendMessage",
            { userServiceId, message },
            (ackError: SocketAckError, response?: ChatMessage) => {
              if (ackError || !response) {
                reject(ackError ?? new Error("No response received"));
                return;
              }

              resolve(response);
            },
          );
      });
    } catch (sendError) {
      console.error("Failed to send message", sendError);
      setInput(message);
      toast.error("Message could not be sent.");
    } finally {
      setSending(false);
    }
  }, [input, thread, userServiceId]);

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <ChatHeader
        title={title}
        subtitle={counterpartLabel}
        latestMessagePreview={thread?.latestMessagePreview ?? thread?.lastMessage ?? null}
        unreadCount={unreadCount}
        isConnected={isConnected}
      />

      <div className="flex h-[32rem] flex-col bg-slate-50/70">
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin" />
              <p className="text-xs font-semibold">Loading conversation...</p>
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-slate-500">
              <MessageSquare className="h-10 w-10 text-slate-300" />
              <div>
                <p className="text-sm font-semibold text-slate-700">Chat unavailable</p>
                <p className="text-xs">{error}</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <i className="fas fa-comments text-2xl" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">No messages yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Start with a quick update or question for this service.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === currentUserId}
                  formattedTime={formatMessageTime(message.createdAt)}
                />
              ))}
              {typingName ? (
                <div className="px-2 text-xs font-medium text-slate-400">
                  {typingName} is typing...
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput
          value={input}
          disabled={loading || !!error || !isConnected}
          sending={sending}
          onChange={(value) => {
            setInput(value);
            if (value.trim()) {
              emitTyping();
            }
          }}
          onSend={() => void handleSend()}
        />
      </div>
    </section>
  );
}
