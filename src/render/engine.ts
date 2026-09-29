import { Engine } from '@babylonjs/core/Engines/engine';

/** WebGL2 engine. Antialias on desktop only, no stencil. */
export function createEngine(canvas: HTMLCanvasElement, touch: boolean): Engine {
  const engine = new Engine(
    canvas,
    !touch,
    {
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
      disableWebGL2Support: false,
      audioEngine: false,
    } as never,
    false,
  );
  engine.enableOfflineSupport = false;
  return engine;
}
