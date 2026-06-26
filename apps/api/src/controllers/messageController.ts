import { Request, Response } from 'express';
import { messageService, SendMessageSchema, StartConversationSchema } from '../services/messageService';

export const getConversationsController = async (req: Request, res: Response): Promise<void> => {
  const conversations = await messageService.getConversations(req.userId as string);
  res.json({ success: true, data: conversations });
};

export const startConversationController = async (req: Request, res: Response): Promise<void> => {
  const parsed = StartConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: parsed.error.errors[0]?.message } });
    return;
  }
  const conv = await messageService.getOrCreateConversation(req.userId as string, parsed.data.otherUserId);
  res.json({ success: true, data: conv });
};

export const getConversationDetailController = async (req: Request, res: Response): Promise<void> => {
  const detail = await messageService.getConversationDetail(req.userId as string, req.params.conversationId);
  res.json({ success: true, data: detail });
};

export const sendMessageController = async (req: Request, res: Response): Promise<void> => {
  const parsed = SendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: parsed.error.errors[0]?.message } });
    return;
  }
  const message = await messageService.sendMessage(req.userId as string, req.params.conversationId, parsed.data);
  res.status(201).json({ success: true, data: message });
};

export const markReadController = async (req: Request, res: Response): Promise<void> => {
  await messageService.markRead(req.userId as string, req.params.conversationId);
  res.json({ success: true, data: null });
};

export const getUnreadCountController = async (req: Request, res: Response): Promise<void> => {
  const count = await messageService.getTotalUnread(req.userId as string);
  res.json({ success: true, data: { unreadCount: count } });
};
