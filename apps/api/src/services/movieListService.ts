import { prisma } from '../db/client';
import { z } from 'zod';
import { AppError } from '../utils/errors';

export const CreateListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional().nullable(),
  isPublic: z.boolean().default(true),
});

export const UpdateListSchema = CreateListSchema.partial();

export const AddItemSchema = z.object({
  tmdbId: z.string().min(1),
  title: z.string().min(1).max(300),
  posterPath: z.string().nullable().optional(),
  contentType: z.enum(['movie', 'tv']),
});

export type CreateListInput = z.infer<typeof CreateListSchema>;
export type UpdateListInput = z.infer<typeof UpdateListSchema>;
export type AddItemInput = z.infer<typeof AddItemSchema>;

export interface ListSummary {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
}

export interface ListItem {
  id: string;
  tmdbId: string;
  title: string;
  posterPath: string | null;
  contentType: string;
  addedAt: string;
}

export interface ListDetail {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  isOwner: boolean;
  owner: { userId: string; displayName: string; avatarUrl: string | null };
  items: ListItem[];
  createdAt: string;
}

class MovieListService {
  async getLists(userId: string): Promise<ListSummary[]> {
    const lists = await prisma.movieList.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return lists.map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description ?? null,
      isPublic: l.isPublic,
      itemCount: l._count.items,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async getPublicLists(userId: string): Promise<ListSummary[]> {
    const lists = await prisma.movieList.findMany({
      where: { userId, isPublic: true },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return lists.map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description ?? null,
      isPublic: true,
      itemCount: l._count.items,
      createdAt: l.createdAt.toISOString(),
    }));
  }

  async getListDetail(listId: string, currentUserId: string): Promise<ListDetail> {
    const list = await prisma.movieList.findUnique({
      where: { id: listId },
      include: {
        items: { orderBy: { addedAt: 'desc' } },
        user: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
      },
    });
    if (!list) throw new AppError('NOT_FOUND', 404, 'Lista no encontrada');
    if (!list.isPublic && list.userId !== currentUserId) {
      throw new AppError('FORBIDDEN', 403, 'Esta lista es privada');
    }
    return {
      id: list.id,
      name: list.name,
      description: list.description ?? null,
      isPublic: list.isPublic,
      isOwner: list.userId === currentUserId,
      owner: {
        userId: list.user.id,
        displayName: list.user.profile?.displayName ?? list.user.email.split('@')[0],
        avatarUrl: list.user.profile?.avatarUrl ?? null,
      },
      items: list.items.map((i) => ({
        id: i.id,
        tmdbId: i.tmdbId,
        title: i.title,
        posterPath: i.posterPath ?? null,
        contentType: i.contentType,
        addedAt: i.addedAt.toISOString(),
      })),
      createdAt: list.createdAt.toISOString(),
    };
  }

  async createList(userId: string, input: CreateListInput): Promise<ListSummary> {
    const list = await prisma.movieList.create({
      data: { userId, name: input.name, description: input.description ?? null, isPublic: input.isPublic ?? true },
      include: { _count: { select: { items: true } } },
    });
    return { id: list.id, name: list.name, description: list.description, isPublic: list.isPublic, itemCount: 0, createdAt: list.createdAt.toISOString() };
  }

  async updateList(userId: string, listId: string, input: UpdateListInput): Promise<ListSummary> {
    const list = await prisma.movieList.findUnique({ where: { id: listId }, select: { userId: true } });
    if (!list) throw new AppError('NOT_FOUND', 404, 'Lista no encontrada');
    if (list.userId !== userId) throw new AppError('FORBIDDEN', 403, 'No podés editar esta lista');
    const updated = await prisma.movieList.update({
      where: { id: listId },
      data: { name: input.name, description: input.description, isPublic: input.isPublic },
      include: { _count: { select: { items: true } } },
    });
    return { id: updated.id, name: updated.name, description: updated.description, isPublic: updated.isPublic, itemCount: updated._count.items, createdAt: updated.createdAt.toISOString() };
  }

  async deleteList(userId: string, listId: string): Promise<void> {
    const list = await prisma.movieList.findUnique({ where: { id: listId }, select: { userId: true } });
    if (!list) throw new AppError('NOT_FOUND', 404, 'Lista no encontrada');
    if (list.userId !== userId) throw new AppError('FORBIDDEN', 403, 'No podés eliminar esta lista');
    await prisma.movieList.delete({ where: { id: listId } });
  }

  async addItem(userId: string, listId: string, input: AddItemInput): Promise<ListItem> {
    const list = await prisma.movieList.findUnique({ where: { id: listId }, select: { userId: true } });
    if (!list) throw new AppError('NOT_FOUND', 404, 'Lista no encontrada');
    if (list.userId !== userId) throw new AppError('FORBIDDEN', 403, 'No podés modificar esta lista');
    const item = await prisma.movieListItem.upsert({
      where: { listId_tmdbId: { listId, tmdbId: input.tmdbId } },
      create: { listId, tmdbId: input.tmdbId, title: input.title, posterPath: input.posterPath ?? null, contentType: input.contentType },
      update: {},
    });
    return { id: item.id, tmdbId: item.tmdbId, title: item.title, posterPath: item.posterPath ?? null, contentType: item.contentType, addedAt: item.addedAt.toISOString() };
  }

  async removeItem(userId: string, listId: string, tmdbId: string): Promise<void> {
    const list = await prisma.movieList.findUnique({ where: { id: listId }, select: { userId: true } });
    if (!list) throw new AppError('NOT_FOUND', 404, 'Lista no encontrada');
    if (list.userId !== userId) throw new AppError('FORBIDDEN', 403, 'No podés modificar esta lista');
    await prisma.movieListItem.deleteMany({ where: { listId, tmdbId } });
  }
}

export const movieListService = new MovieListService();
