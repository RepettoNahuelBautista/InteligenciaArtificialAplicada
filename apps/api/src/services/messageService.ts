import { prisma } from '../db/client';
import { z } from 'zod';
import { AppError } from '../utils/errors';

export const SendMessageSchema = z.object({
  text: z.string().min(1).max(2000).trim(),
});

export const StartConversationSchema = z.object({
  otherUserId: z.string().min(1),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export interface ConversationSummary {
  id: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    text: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  messages: MessageItem[];
}

export interface MessageItem {
  id: string;
  senderId: string;
  text: string;
  readAt: string | null;
  createdAt: string;
}

class MessageService {
  private normalize(aId: string, bId: string) {
    return aId < bId
      ? { participantA: aId, participantB: bId }
      : { participantA: bId, participantB: aId };
  }

  private isParticipant(conv: { participantA: string; participantB: string }, userId: string) {
    return conv.participantA === userId || conv.participantB === userId;
  }

  async getOrCreateConversation(currentUserId: string, otherUserId: string): Promise<{ id: string }> {
    if (currentUserId === otherUserId) {
      throw new AppError('BAD_REQUEST', 400, 'No podés chatear con vos mismo');
    }
    const other = await prisma.user.findUnique({ where: { id: otherUserId }, select: { id: true } });
    if (!other) throw new AppError('NOT_FOUND', 404, 'Usuario no encontrado');

    const parts = this.normalize(currentUserId, otherUserId);
    const conv = await prisma.conversation.upsert({
      where: { participantA_participantB: parts },
      create: { ...parts },
      update: {},
      select: { id: true },
    });
    return conv;
  }

  async getConversations(userId: string): Promise<ConversationSummary[]> {
    const convs = await prisma.conversation.findMany({
      where: { OR: [{ participantA: userId }, { participantB: userId }] },
      include: {
        userA: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
        userB: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { text: true, senderId: true, createdAt: true },
        },
        _count: {
          select: {
            messages: { where: { readAt: null, senderId: { not: userId } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return convs.map((conv) => {
      const otherIsA = conv.participantB === userId;
      const otherUser = otherIsA ? conv.userA : conv.userB;
      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          displayName: otherUser.profile?.displayName ?? otherUser.email.split('@')[0],
          avatarUrl: otherUser.profile?.avatarUrl ?? null,
        },
        lastMessage: conv.messages[0]
          ? {
              text: conv.messages[0].text,
              senderId: conv.messages[0].senderId,
              createdAt: conv.messages[0].createdAt.toISOString(),
            }
          : null,
        unreadCount: conv._count.messages,
        updatedAt: conv.updatedAt.toISOString(),
      };
    });
  }

  async getConversationDetail(userId: string, conversationId: string): Promise<ConversationDetail> {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        userA: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
        userB: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, senderId: true, text: true, readAt: true, createdAt: true },
        },
      },
    });
    if (!conv) throw new AppError('NOT_FOUND', 404, 'Conversación no encontrada');
    if (!this.isParticipant(conv, userId)) {
      throw new AppError('FORBIDDEN', 403, 'No tenés acceso a esta conversación');
    }

    const otherUser = conv.participantB === userId ? conv.userA : conv.userB;
    return {
      id: conv.id,
      otherUser: {
        id: otherUser.id,
        displayName: otherUser.profile?.displayName ?? otherUser.email.split('@')[0],
        avatarUrl: otherUser.profile?.avatarUrl ?? null,
      },
      messages: conv.messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        text: m.text,
        readAt: m.readAt?.toISOString() ?? null,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async sendMessage(userId: string, conversationId: string, input: SendMessageInput): Promise<MessageItem> {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantA: true, participantB: true },
    });
    if (!conv) throw new AppError('NOT_FOUND', 404, 'Conversación no encontrada');
    if (!this.isParticipant(conv, userId)) {
      throw new AppError('FORBIDDEN', 403, 'No tenés acceso a esta conversación');
    }

    const message = await prisma.message.create({
      data: { conversationId, senderId: userId, text: input.text },
      select: { id: true, senderId: true, text: true, readAt: true, createdAt: true },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      senderId: message.senderId,
      text: message.text,
      readAt: message.readAt?.toISOString() ?? null,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async markRead(userId: string, conversationId: string): Promise<void> {
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participantA: true, participantB: true },
    });
    if (!conv) throw new AppError('NOT_FOUND', 404, 'Conversación no encontrada');
    if (!this.isParticipant(conv, userId)) {
      throw new AppError('FORBIDDEN', 403, 'No tenés acceso a esta conversación');
    }

    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async getTotalUnread(userId: string): Promise<number> {
    return prisma.message.count({
      where: {
        conversation: {
          OR: [{ participantA: userId }, { participantB: userId }],
        },
        senderId: { not: userId },
        readAt: null,
      },
    });
  }
}

export const messageService = new MessageService();
