import type { CategoryId } from './types';

export const CATEGORIES: { id: CategoryId; title: string }[] = [
  { id: 'personality', title: 'Личность' },
  { id: 'emotional', title: 'Эмоциональное состояние' },
  { id: 'wellbeing', title: 'Самооценка и благополучие' },
  { id: 'relationships', title: 'Отношения' },
  { id: 'eq', title: 'Эмоциональный интеллект' },
  { id: 'career', title: 'Профориентация' },
  { id: 'neurodiversity', title: 'Нейроразнообразие' },
  { id: 'values', title: 'Ценности' },
];

export const categoryTitle = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.title ?? id;

/** Короткие названия для подписей на диаграммах. */
export const CATEGORY_SHORT: Record<CategoryId, string> = {
  personality: 'Личность',
  emotional: 'Эмоции',
  wellbeing: 'Благополучие',
  relationships: 'Отношения',
  eq: 'Эмо. интеллект',
  career: 'Профориентация',
  neurodiversity: 'Нейроразнообразие',
  values: 'Ценности',
};
