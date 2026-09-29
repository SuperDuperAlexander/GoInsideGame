import { Scene } from '@babylonjs/core/scene';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import type { Engine } from '@babylonjs/core/Engines/engine';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PALETTE } from '../config/palette';
import { WalkMap, type ChapterLayout } from '../logic/walkmap';
import { buildGround, buildSky } from './Ground';
import { FollowCamera } from './FollowCamera';
import { Walker } from './Walker';
import { PlayerVisual } from '../player/PlayerVisual';

/** The outer region: scene, ground, sky, town, player, camera. Built from chapters/ch1.json. */
export class OuterWorld {
  readonly scene: Scene;
  readonly map: WalkMap;
  readonly camera: FollowCamera;
  readonly walker: Walker;
  readonly player: PlayerVisual;
  glow: GlowLayer | null = null;

  constructor(engine: Engine, readonly layout: ChapterLayout, o: { safe: boolean }) {
    const scene = new Scene(engine);
    this.scene = scene;
    const haze = PALETTE.outer.haze;
    scene.clearColor = Color4.FromHexString(`${haze}FF`);
    scene.skipPointerMovePicking = true;
    scene.autoClear = true;
    this.map = new WalkMap(layout);
    this.camera = new FollowCamera(scene, this.map);
    scene.activeCamera = this.camera.camera;
    buildSky(scene);
    const ground = buildGround(scene, this.map);
    ground.freezeWorldMatrix();
    this.walker = new Walker(this.map);
    this.player = new PlayerVisual(scene, 'player', { withLight: true });
    if (!o.safe) {
      this.glow = new GlowLayer('glow', scene, { mainTextureRatio: 0.35, blurKernelSize: 32 });
      this.glow.intensity = 0.9;
      for (const m of this.player.glowMeshes) this.glow.addIncludedOnlyMesh(m);
    }
  }

  addGlow(m: Mesh): void {
    this.glow?.addIncludedOnlyMesh(m);
  }
}
