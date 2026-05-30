export type ChatParticipant = {
  id: number;
  name: string;
  email?: string | null;
  role?: string | null;
};

export type ChatSender = {
  id: number;
  name: string;
  role: string;
  email?: string;
};

export type ChatThread = {
  id: number;
  userServiceId: number;
  status: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  latestMessagePreview?: string | null;
};

export type ChatMessage = {
  id: number;
  threadId: number;
  senderId: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  sender: ChatSender;
};
