import type { SceneSpec } from './sceneSpec';

export type ChipKey = 'want' | 'afraid' | 'angry' | 'excited' | 'pushAway' | 'unsure';

export interface FallbackTables {
  soul: Record<string, string>;
  round1: {
    chips: ChipKey[];
    text: Record<ChipKey, string>;
    scene: Record<ChipKey, SceneSpec>;
    keywords: Record<ChipKey, string[]>;
    /** Answers to each type's soul question, one per chip key (so the answers fit the question). */
    byType: Record<string, Record<ChipKey, string>>;
  };
  round2: {
    question: Record<ChipKey, string>;
    themes: Record<ChipKey, string[]>;
    keywords: Record<string, string[]>;
    /** Follow-up question per type and chip key (fits the answer given). */
    byType: Record<string, Record<ChipKey, string>>;
  };
  themeList: string[];
  seedTemplate: string;
}

export interface DisturbanceTypeDef {
  colorKey: string;
  labelKey: string;
  forms: [string, string, string];
  sound: string;
  soundNote: string;
}

export interface DisturbanceTable {
  version: number;
  order: string[];
  types: Record<string, DisturbanceTypeDef>;
}

export type Strings = Record<string, string>;
