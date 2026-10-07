export type CategoryId =
  | 'personality'
  | 'emotional'
  | 'wellbeing'
  | 'relationships'
  | 'eq'
  | 'career'
  | 'neurodiversity'
  | 'values';

export interface ScaleOption {
  value: number;
  label: string;
}

/** Варианты ответа, общие для всех вопросов теста. */
export interface ScaleDef {
  type: 'likert' | 'binary' | 'choice';
  options: ScaleOption[];
}

export interface Question {
  id: string;
  text: string;
  /** Обратный ключ: значение инвертируется как (min + max - value). */
  reversed?: boolean;
  /** id подшкалы из scoring.subscales. */
  subscale?: string;
  /** Дихотомический ключ: 1 балл, если выбран один из этих вариантов (value), иначе 0. */
  scoreWhen?: number[];
  /** Пункт показывается, но в подсчёт не входит (например, «отвлекающие» пункты LOT-R). */
  filler?: boolean;
}

export interface Subscale {
  id: string;
  title: string;
  description?: string;
}

export type ScoringMethod =
  | 'sum' // одна шкала «total», сумма
  | 'average' // одна шкала «total», среднее
  | 'subscales' // по подшкалам (aggregate: sum | average)
  | 'typeMax'; // как subscales + определяется доминирующий тип (максимум)

export interface Scoring {
  method: ScoringMethod;
  /** Для subscales/typeMax: как агрегировать внутри подшкалы. По умолчанию sum. */
  aggregate?: 'sum' | 'average';
  subscales?: Subscale[];
  /** Название итоговой шкалы для sum/average. */
  totalTitle?: string;
}

export type Level = 'low' | 'mid' | 'high' | 'severe';

/** Диапазон: выбирается последний, у которого min <= значение (max — справочный). */
export interface InterpretationRange {
  min: number;
  max: number;
  title: string;
  description: string;
  level?: Level;
}

export interface Safety {
  /**
   * Показать мягкий блок помощи, если значение шкалы >= min (высокие баллы) или <= max (низкие,
   * например WHO-5). Можно задать список правил по разным шкалам; достаточно сработать одному.
   */
  helpAboveScore?: HelpRule | HelpRule[];
  /** Показать блок экстренной помощи, если ответ на вопрос > value (сырой ответ). */
  crisisQuestions?: { questionId: string; above: number }[];
}

export interface TestDef {
  id: string;
  /**
   * ready — можно проходить; draft — заготовка; reference — справочная карточка известной методики,
   * которую нельзя воспроизводить: ссылка на официальный источник и открытые аналоги на сайте.
   */
  status?: 'ready' | 'draft' | 'reference';
  /** Для reference: официальный сайт методики. */
  officialUrl?: string;
  /** Для reference: кто и на каких условиях распространяет методику. */
  restriction?: string;
  /** Для reference: id открытых тестов на сайте, которые можно пройти вместо неё. */
  analogs?: string[];
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: CategoryId;
  tags: string[];
  duration: number;
  questionCount: number;
  author: string;
  year: number;
  source: string;
  license: string;
  popular?: boolean;
  /** Краткое имя для подписей (если автоматическое получается неудачным). */
  shortName?: string;
  /** Сведения о переводе (например, «рабочий перевод, не валидирован»). */
  translationNote?: string;
  instructions: string;
  scale: ScaleDef;
  questions: Question[];
  scoring: Scoring;
  /** ключ — id подшкалы или «total». */
  interpretation: Record<string, InterpretationRange[]>;
  disclaimer?: string;
  isClinical: boolean;
  safety?: Safety;
  /**
   * interactive (по умолчанию) — вопросы проходятся на сайте. external — вопросы не воспроизводятся:
   * пользователь проходит тест на сайте оригинала и вводит номера ответов, а сайт считает результат.
   */
  mode?: 'interactive' | 'external';
  external?: ExternalInfo;
  /** Двумерная плоскость из двух шкал (например, ECR-R): точка и четыре квадранта. */
  plane?: Plane;
  /** Что осталось проверить/дописать перед публикацией. */
  todo?: string[];
}

export type TestSummary = Omit<
  TestDef,
  'questions' | 'interpretation' | 'fullDescription' | 'instructions' | 'scale' | 'scoring'
>;

export type Answers = Record<string, number>;

export interface ScaleResult {
  id: string;
  title: string;
  description?: string;
  value: number; // сумма или среднее
  min: number;
  max: number;
  percent: number; // 0..100
  answered: number;
  total: number;
  range?: InterpretationRange;
}

export interface ScoreResult {
  scales: ScaleResult[];
  /** Для typeMax — id доминирующих типов. */
  dominant: string[];
  complete: boolean;
}

export interface SafetyOutcome {
  showHelp: boolean;
  crisis: boolean;
}

export interface HistoryEntry {
  id: string;
  testId: string;
  testTitle: string;
  completedAt: string; // ISO
  answers: Answers;
}

export interface Plane {
  /** id подшкал по горизонтали и вертикали. */
  x: string;
  y: string;
  xLabel: string;
  yLabel: string;
  /** Граница между «низко» и «высоко» в единицах шкал. */
  split: number;
  /** Квадранты: [низ-лево, низ-право, верх-лево, верх-право]. */
  quadrants: { name: string; description: string }[];
}

export interface HelpRule {
  scale: string;
  min?: number;
  max?: number;
}

export interface ExternalInfo {
  url: string;
  urlLabel: string;
  /** Пояснение, как пройти тест на сайте оригинала. */
  note: string;
}
