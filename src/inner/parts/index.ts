import type { Part } from '../../logic/sceneSpec';
import { buildCanyon } from './canyon';
import { buildCracks } from './cracks';
import { buildDoor } from './door';
import { buildFog } from './fog';
import type { PartContext, PartHandle } from './kit';
import { buildLight } from './light';
import { buildParticles } from './particles';
import { buildPlants } from './plants';
import { buildNarrowSpace, buildOpenSpace } from './spaces';
import { buildWall } from './wall';
import { buildWater } from './water';
import { buildWind } from './wind';

/** The fixed kit of inner-world parts (TECH §5.7). */
export const KIT: Record<Part, (ctx: PartContext) => PartHandle> = {
  fog: buildFog,
  wall: buildWall,
  water: buildWater,
  light: buildLight,
  wind: buildWind,
  plants: (ctx) => buildPlants(ctx),
  cracks: buildCracks,
  canyon: buildCanyon,
  door: buildDoor,
  openSpace: buildOpenSpace,
  narrowSpace: buildNarrowSpace,
  particles: (ctx) => buildParticles(ctx, ctx.reduced ? 45 : 90),
};

export type { PartContext, PartHandle };
