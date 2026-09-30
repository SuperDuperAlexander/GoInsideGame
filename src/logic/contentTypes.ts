import type { SceneSpec } from './sceneSpec';

export type ChipKey = 'want' | 'afraid' | 'angry' | 'excited' | 'pushAway' | 'unsure';

export interface FallbackTables {
  soul: Record<string, string>;
  round1: {
    chips: ChipKey[];
    text: Record<ChipKey, string>;
    scene: Record<ChipKey, SceneSpec>;
    keywords: Record<ChipKey, string[]>;
  };
  round2: {
    question: Record<ChipKey, string>;
    themes: Record<ChipKey, string[]>;
    keywords: Record<string, string[]>;
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
