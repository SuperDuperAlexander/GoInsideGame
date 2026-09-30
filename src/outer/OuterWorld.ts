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
import { Town } from './Town';
import { Figures } from './Figures';
import { ColorZones } from './ColorZones';
import { Fountain } from './Fountain';
import { Gate } from './Gate';
import type { Tier } from '../core/perf';

/** The outer region: scene, ground, sky, town, player, camera. Built from chapters/ch1.json. */
export class OuterWorld {
  readonly scene: Scene;
  readonly map: WalkMap;
  readonly camera: FollowCamera;
  readonly walker: Walker;
  readonly player: PlayerVisual;
  readonly town: Town;
  readonly figures: Figures;
  readonly zones = new ColorZones();
  readonly fountain: Fountain;
  readonly gate: Gate;
  glow: GlowLayer | null = null;

  constructor(engine: Engine, readonly layout: ChapterLayout, o: { safe: boolean; tier: Tier }) {
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
    this.town = new Town(scene, this.map, o.tier);
    this.figures = new Figures(scene, this.map, layout.figures);
    this.walker = new Walker(this.map);
    this.player = new PlayerVisual(scene, 'player', { withLight: true });
    if (!o.safe) {
      this.glow = new GlowLayer('glow', scene, { mainTextureRatio: 0.35, blurKernelSize: 32 });
      this.glow.intensity = 0.9;
      for (const m of this.player.glowMeshes) this.glow.addIncludedOnlyMesh(m);
    }
    const g = (m: Mesh) => this.addGlow(m);
    this.fountain = new Fountain(scene, layout.fountain.x, layout.fountain.z, g);
    this.gate = new Gate(scene, this.map, this.town.cardMat, this.town.inkMat, g);
  }

  addGlow(m: Mesh): void {
    this.glow?.addIncludedOnlyMesh(m);
  }
}
