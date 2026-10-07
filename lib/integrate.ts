import data from '../data/constructs.json';
import type { Characteristic } from './profile';
import type { CategoryId } from './types';

export type DomainId = 'personality' | 'emotional' | 'resources';

export interface ConstructSource {
  test: string;
  scale: string;
  invert?: boolean;
  weight: number;
}

export interface ConstructDef {
  id: string;
  domain: DomainId;
  title: string;
  low: string;
  high: string;
  sources: ConstructSource[];
}

export interface Domain {
  id: DomainId;
  title: string;
  category: CategoryId;
}

export const DOMAINS = data.domains as Domain[];
export const CONSTRUCTS = data.constructs as ConstructDef[];

export interface IntegratedSource {
  char: Characteristic;
  /** Значение с учётом направления шкалы (для invert — 100 − процент). */
  oriented: number;
  weight: number;
  invert: boolean;
}

export type Level = 'low' | 'mid' | 'high';
export type Consistency = 'none' | 'single' | 'consistent' | 'mixed' | 'divergent';
export type Confidence = 'none' | 'low' | 'medium' | 'high';

export interface Integrated {
  def: ConstructDef;
  sources: IntegratedSource[];
  /** Взвешенное среднее по источникам, 0–100 (null — данных нет). */
  score: number | null;
  min: number | null;
  max: number | null;
  spread: number;
  level: Level | null;
  consistency: Consistency;
  confidence: Confidence;
  /** Тесты с прямым (weight ≥ 1) соответствием, которые ещё не пройдены или выключены. */
  missingTests: string[];
}

export const LEVEL_LOW = 35;
export const LEVEL_HIGH = 65;

export const levelOf = (score: number): Level => (score < LEVEL_LOW ? 'low' : score > LEVEL_HIGH ? 'high' : 'mid');

export function buildIntegrated(chars: Characteristic[], defs: ConstructDef[] = CONSTRUCTS): Integrated[] {
  const byKey = new Map(chars.map((c) => [c.key, c]));
  const haveTests = new Set(chars.map((c) => c.testId));
  return defs.map((def) => {
    const sources: IntegratedSource[] = [];
    for (const s of def.sources) {
      const c = byKey.get(`${s.test}:${s.scale}`);
      if (!c) continue;
      sources.push({ char: c, oriented: s.invert ? 100 - c.percent : c.percent, weight: s.weight, invert: !!s.invert });
    }
    const wsum = sources.reduce((a, s) => a + s.weight, 0);
    const score = sources.length ? sources.reduce((a, s) => a + s.oriented * s.weight, 0) / wsum : null;
    const vals = sources.map((s) => s.oriented);
    const min = vals.length ? Math.min(...vals) : null;
    const max = vals.length ? Math.max(...vals) : null;
    const spread = min === null || max === null ? 0 : max - min;
    const distinctTests = new Set(sources.map((s) => s.char.testId)).size;

    let consistency: Consistency = 'none';
    if (sources.length) {
      if (distinctTests < 2) consistency = 'single';
      else consistency = spread <= 20 ? 'consistent' : spread <= 35 ? 'mixed' : 'divergent';
    }
    let confidence: Confidence = 'none';
    if (sources.length) {
      if (distinctTests < 2) confidence = 'low';
      else if (consistency === 'divergent') confidence = 'low';
      else if (consistency === 'mixed' || distinctTests < 3) confidence = 'medium';
      else confidence = 'high';
    }
    const missingTests = [...new Set(def.sources.filter((s) => s.weight >= 1 && !haveTests.has(s.test)).map((s) => s.test))];
    return { def, sources, score, min, max, spread, level: score === null ? null : levelOf(score), consistency, confidence, missingTests };
  });
}

/** Характеристики, не входящие ни в один конструкт как прямой источник. */
export function uncovered(chars: Characteristic[], defs: ConstructDef[] = CONSTRUCTS): Characteristic[] {
  const direct = new Set(defs.flatMap((d) => d.sources.filter((s) => s.weight >= 1).map((s) => `${s.test}:${s.scale}`)));
  return chars.filter((c) => !direct.has(c.key));
}

export const domainOf = (id: DomainId) => DOMAINS.find((d) => d.id === id)!;
