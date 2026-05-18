import { Request, Response } from 'express';
import { movieListService, CreateListSchema, UpdateListSchema, AddItemSchema } from '../services/movieListService';

export const getListsController = async (req: Request, res: Response): Promise<void> => {
  const lists = await movieListService.getLists(req.userId as string);
  res.json({ success: true, data: lists });
};

export const getPublicListsController = async (req: Request, res: Response): Promise<void> => {
  const lists = await movieListService.getPublicLists(req.params.userId);
  res.json({ success: true, data: lists });
};

export const getListDetailController = async (req: Request, res: Response): Promise<void> => {
  const detail = await movieListService.getListDetail(req.params.listId, req.userId as string);
  res.json({ success: true, data: detail });
};

export const createListController = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateListSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: parsed.error.errors[0]?.message } });
    return;
  }
  const list = await movieListService.createList(req.userId as string, parsed.data);
  res.status(201).json({ success: true, data: list });
};

export const updateListController = async (req: Request, res: Response): Promise<void> => {
  const parsed = UpdateListSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: parsed.error.errors[0]?.message } });
    return;
  }
  const list = await movieListService.updateList(req.userId as string, req.params.listId, parsed.data);
  res.json({ success: true, data: list });
};

export const deleteListController = async (req: Request, res: Response): Promise<void> => {
  await movieListService.deleteList(req.userId as string, req.params.listId);
  res.json({ success: true, data: null });
};

export const addItemController = async (req: Request, res: Response): Promise<void> => {
  const parsed = AddItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: parsed.error.errors[0]?.message } });
    return;
  }
  const item = await movieListService.addItem(req.userId as string, req.params.listId, parsed.data);
  res.status(201).json({ success: true, data: item });
};

export const removeItemController = async (req: Request, res: Response): Promise<void> => {
  await movieListService.removeItem(req.userId as string, req.params.listId, req.params.tmdbId);
  res.json({ success: true, data: null });
};
