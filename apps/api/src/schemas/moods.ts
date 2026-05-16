import { z } from 'zod';

export interface Mood {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

export const MOODS: Mood[] = [
  {
    id: 'mystery',
    label: 'Misterio',
    emoji: '🕵️',
    description: 'Quiero intriga y suspense',
  },
  {
    id: 'relax',
    label: 'Desconectar',
    emoji: '😎',
    description: 'Algo tranquilo y relajante',
  },
  {
    id: 'emotional',
    label: 'Llorar',
    emoji: '😭',
    description: 'Quiero algo que me emocione',
  },
  {
    id: 'laugh',
    label: 'Reír',
    emoji: '😂',
    description: 'Necesito una buena risa',
  },
  {
    id: 'action',
    label: 'Acción',
    emoji: '💥',
    description: 'Quiero adrenalina',
  },
  {
    id: 'romantic',
    label: 'Amor',
    emoji: '💕',
    description: 'Una buena historia de amor',
  },
  {
    id: 'horror',
    label: 'Terror',
    emoji: '👻',
    description: 'Algo que me asuste',
  },
  {
    id: 'inspiring',
    label: 'Inspiración',
    emoji: '✨',
    description: 'Algo motivacional',
  },
];

export const SelectMoodSchema = z.object({
  moodId: z.enum([
    'mystery',
    'relax',
    'emotional',
    'laugh',
    'action',
    'romantic',
    'horror',
    'inspiring',
  ]),
});

export type SelectMoodInput = z.infer<typeof SelectMoodSchema>;
