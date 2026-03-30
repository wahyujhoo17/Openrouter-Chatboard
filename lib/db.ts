import { prisma } from "@/lib/prisma";

export type User = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  plan: "free" | "pro";
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: number;
  user_id: number;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
};

export type Message = {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
): Promise<User> {
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      plan: "FREE",
    },
  });
  return {
    ...user,
    password_hash: user.passwordHash,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  return {
    ...user,
    password_hash: user.passwordHash,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function getUserById(id: number): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return {
    ...user,
    password_hash: user.passwordHash,
    created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}

export async function createConversation(
  userId: number,
  model: string,
): Promise<Conversation> {
  const conversation = await prisma.conversation.create({
    data: {
      userId,
      model,
    },
  });
  return {
    ...conversation,
    user_id: conversation.userId,
    created_at: conversation.createdAt.toISOString(),
    updated_at: conversation.updatedAt.toISOString(),
  };
}

export async function getConversationsByUser(
  userId: number,
): Promise<Conversation[]> {
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { messages: true },
    take: 60,
  });
  return conversations.map((conv) => ({
    ...conv,
    user_id: conv.userId,
    created_at: conv.createdAt.toISOString(),
    updated_at: conv.updatedAt.toISOString(),
    message_count: conv.messages.length,
  }));
}

export async function getConversationById(
  id: number,
  userId: number,
): Promise<Conversation | null> {
  const conv = await prisma.conversation.findFirst({
    where: { id, userId },
    include: { messages: true },
  });
  if (!conv) return null;
  return {
    ...conv,
    user_id: conv.userId,
    created_at: conv.createdAt.toISOString(),
    updated_at: conv.updatedAt.toISOString(),
    message_count: conv.messages.length,
  };
}

export async function updateConversationTitle(
  id: number,
  title: string,
): Promise<void> {
  await prisma.conversation.update({ where: { id }, data: { title } });
}

export async function touchConversation(id: number): Promise<void> {
  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });
}

export async function deleteConversation(
  id: number,
  userId: number,
): Promise<void> {
  await prisma.conversation.deleteMany({ where: { id, userId } });
}

export async function saveMessage(
  conversationId: number,
  role: "user" | "assistant" | "system",
  content: string,
): Promise<Message> {
  const message = await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
    },
  });
  return {
    ...message,
    conversation_id: message.conversationId,
    created_at: message.createdAt.toISOString(),
  };
}

export async function getMessages(
  conversationId: number,
  limit = 200,
): Promise<Message[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return messages.map((m) => ({
    ...m,
    conversation_id: m.conversationId,
    created_at: m.createdAt.toISOString(),
  }));
}

export async function clearConversationMessages(
  conversationId: number,
  userId: number,
): Promise<void> {
  await prisma.message.deleteMany({
    where: {
      conversationId,
      conversation: { userId },
    },
  });
}
