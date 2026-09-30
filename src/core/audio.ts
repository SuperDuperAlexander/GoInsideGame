import { TUNING } from '../config/tuning';

/**
 * All sound, generated with Web Audio. Starts only after the first user interaction.
 * Outer ambience, one spatial loop per disturbance, heartbeat, breath, inner pads, chimes.
 */

type Loop = {
  gain: GainNode;
  panner: PannerNode;
  filter: BiquadFilterNode;
  type: string;
  timer: number;
  rate: number;
  connected: boolean;
  step: number;
};

const SCALES: Record<string, number[]> = {
  money: [659.3, 784, 987.8, 1318.5],
  phone: [220, 220, 0, 220],
  person: [146.8, 130.8, 0, 110],
  recognition: [392, 493.9, 587.3, 0],
  closedDoor: [73.4, 0, 69.3, 0],
  crowd: [196, 207.7, 185, 174.6],
  house: [523.3, 659.3, 784, 659.3],
  conflict: [55, 0, 49, 0],
};

export class Audio {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private outerBus: GainNode | null = null;
  private innerBus: GainNode | null = null;
  private ambience: GainNode | null = null;
  private wind: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private heart: GainNode | null = null;
  private breathGain: GainNode | null = null;
  private breathFilter: BiquadFilterNode | null = null;
  private noise: AudioBuffer | null = null;
  private loops: Loop[] = [];
  private heartTimer = 0;
  private clickTimer = 3;
  volume = TUNING.audio.master;
  private pads: OscillatorNode[] = [];
  private padFilter: BiquadFilterNode | null = null;

  /** Call from a user gesture. */
  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext ?? (window as never as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(ctx.destination);
    this.outerBus = ctx.createGain();
    this.outerBus.connect(this.master);
    this.innerBus = ctx.createGain();
    this.innerBus.gain.value = 0;
    this.innerBus.connect(this.master);

    // Brown noise buffer (murmur) shared by ambience, wind and breath.
    const len = ctx.sampleRate * 4;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    this.ambience = ctx.createGain();
    this.ambience.gain.value = TUNING.audio.ambienceMin;
    this.ambience.connect(this.outerBus);
    const murmur = this.noiseSource();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const mg = ctx.createGain();
    mg.gain.value = 0.5;
    murmur.connect(lp).connect(mg).connect(this.ambience);
    const windSrc = this.noiseSource();
    this.wind = ctx.createBiquadFilter();
    this.wind.type = 'bandpass';
    this.wind.frequency.value = 600;
    this.wind.Q.value = 1.2;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0.25;
    windSrc.connect(this.wind).connect(this.windGain).connect(this.ambience);

    this.heart = ctx.createGain();
    this.heart.gain.value = 0;
    this.heart.connect(this.master);

    const br = this.noiseSource();
    this.breathFilter = ctx.createBiquadFilter();
    this.breathFilter.type = 'bandpass';
    this.breathFilter.frequency.value = 900;
    this.breathFilter.Q.value = 0.8;
    this.breathGain = ctx.createGain();
    this.breathGain.gain.value = 0;
    br.connect(this.breathFilter).connect(this.breathGain).connect(this.master);

    // Inner pads: two detuned voices of a calm major chord.
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 900;
    this.padFilter.connect(this.innerBus);
    for (const [f, type] of [
      [196, 'sine'],
      [246.9, 'triangle'],
      [293.7, 'sine'],
      [197.2, 'triangle'],
    ] as [number, OscillatorType][]) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0.05;
      o.connect(g).connect(this.padFilter);
      o.start();
      this.pads.push(o);
    }
  }

  private noiseSource(): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    s.loopStart = Math.random();
    s.start(0, Math.random() * 3);
    return s;
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  /** One spatial loop for a disturbance. Returns its index. */
  addLoop(type: string, x: number, y: number, z: number): number {
    const ctx = this.ctx;
    if (!ctx || !this.outerBus) return -1;
    const panner = ctx.createPanner();
    panner.panningModel = 'equalpower';
    panner.distanceModel = 'linear';
    panner.refDistance = 2;
    panner.maxDistance = TUNING.disturb.audibleRange;
    panner.rolloffFactor = 1;
    panner.positionX.value = x;
    panner.positionY.value = y;
    panner.positionZ.value = z;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 6000;
    const gain = ctx.createGain();
    gain.gain.value = 0.22;
    gain.connect(filter).connect(panner).connect(this.outerBus);
    this.loops.push({ gain, panner, filter, type, timer: Math.random(), rate: 1, connected: false, step: 0 });
    return this.loops.length - 1;
  }

  setLoop(i: number, o: { volume?: number; rate?: number; connected?: boolean; x?: number; z?: number }): void {
    const l = this.loops[i];
    if (!l || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (o.volume !== undefined) l.gain.gain.setTargetAtTime(o.volume, t, 0.2);
    if (o.rate !== undefined) l.rate = o.rate;
    if (o.x !== undefined) l.panner.positionX.setTargetAtTime(o.x, t, 0.3);
    if (o.z !== undefined) l.panner.positionZ.setTargetAtTime(o.z, t, 0.3);
    if (o.connected !== undefined && o.connected !== l.connected) {
      l.connected = o.connected;
      // After connecting: −12 dB, slower, lower-pass filtered.
      l.filter.frequency.setTargetAtTime(o.connected ? 900 : 6000, t, 0.5);
      l.gain.gain.setTargetAtTime(o.connected ? 0.055 : 0.22, t, 0.5);
    }
  }

  clearLoops(): void {
    for (const l of this.loops) l.gain.disconnect();
    this.loops = [];
  }

  private tone(dest: AudioNode, freq: number, dur: number, vol: number, type: OscillatorType = 'sine', when = 0): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private voice(l: Loop): void {
    const ctx = this.ctx!;
    const notes = SCALES[l.type] ?? SCALES.money;
    const f = notes[l.step % notes.length];
    l.step++;
    if (!f) return;
    const slow = l.connected ? 0.7 : 1;
    switch (l.type) {
      case 'phone':
        this.tone(l.gain, f * slow, 0.18, 0.5, 'square');
        this.tone(l.gain, f * 1.01 * slow, 0.18, 0.3, 'sawtooth', 0.09);
        break;
      case 'conflict':
      case 'closedDoor':
        this.tone(l.gain, f * slow, 1.4, 0.9, 'sawtooth');
        break;
      case 'crowd': {
        const n = ctx.createBufferSource();
        n.buffer = this.noise;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = f * 3;
        bp.Q.value = 3;
        const g = ctx.createGain();
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.9, t + 0.2);
        g.gain.linearRampToValueAtTime(0, t + 0.9);
        n.connect(bp).connect(g).connect(l.gain);
        n.start(t, Math.random() * 3);
        n.stop(t + 1);
        break;
      }
      case 'recognition': {
        const n = ctx.createBufferSource();
        n.buffer = this.noise;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1800;
        const g = ctx.createGain();
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.5, t + 0.6);
        g.gain.linearRampToValueAtTime(0, t + 1.4);
        n.connect(hp).connect(g).connect(l.gain);
        n.start(t, Math.random() * 3);
        n.stop(t + 1.5);
        this.tone(l.gain, f * slow, 0.8, 0.3, 'triangle');
        break;
      }
      case 'person':
        this.tone(l.gain, f * slow, 1.6, 0.6, 'triangle');
        break;
      default:
        this.tone(l.gain, f * slow, 0.5, 0.45, 'triangle');
        if (l.type === 'money' && l.step % 8 === 0) this.tone(l.gain, 2093, 1.2, 0.25, 'sine', 0.1);
    }
  }

  /** Called per frame. `listener` = camera; `restless` 0..1; `heartbeat` 0..1 near a disturbance. */
  update(
    dt: number,
    listener: { x: number; y: number; z: number; yaw: number },
    restless: number,
    heartbeat: number,
    breathLevel: number,
    breathPhase: string,
    inner: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx || !this.ambience || !this.master) return;
    const t = ctx.currentTime;
    const L = ctx.listener;
    if (L.positionX) {
      L.positionX.setTargetAtTime(listener.x, t, 0.05);
      L.positionY.setTargetAtTime(listener.y, t, 0.05);
      L.positionZ.setTargetAtTime(listener.z, t, 0.05);
      L.forwardX.setTargetAtTime(Math.sin(listener.yaw), t, 0.05);
      L.forwardY.setTargetAtTime(0, t, 0.05);
      L.forwardZ.setTargetAtTime(Math.cos(listener.yaw), t, 0.05);
    }
    const a = TUNING.audio;
    const amb = (a.ambienceMin + (a.ambienceMax - a.ambienceMin) * restless) * (1 - 0.7 * heartbeat);
    this.ambience.gain.setTargetAtTime(amb, t, 0.4);
    if (this.wind) this.wind.frequency.setTargetAtTime(500 + Math.sin(t * 0.13) * 250 + restless * 400, t, 0.5);
    this.outerBus!.gain.setTargetAtTime(1 - inner, t, 0.3);
    this.innerBus!.gain.setTargetAtTime(inner * 0.9, t, 0.5);
    if (this.padFilter) this.padFilter.frequency.setTargetAtTime(700 + Math.sin(t * 0.2) * 300 + breathLevel * 400, t, 0.3);

    // Rare wood clicks.
    this.clickTimer -= dt;
    if (this.clickTimer < 0 && inner < 0.5) {
      this.clickTimer = 2 + Math.random() * 6 * (1 - restless * 0.6);
      this.tone(this.ambience, 1400 + Math.random() * 800, 0.05, 0.12, 'square');
    }
    for (const l of this.loops) {
      l.timer -= dt * l.rate;
      if (l.timer <= 0) {
        const base = l.type === 'conflict' || l.type === 'closedDoor' || l.type === 'person' ? 1.1 : 0.32;
        l.timer = base * (l.connected ? 2 : 1);
        if (inner < 0.5) this.voice(l);
      }
    }
    this.tickMelody(dt, inner);
    // Heartbeat: two low thumps at 60 bpm.
    if (this.heart) {
      this.heart.gain.setTargetAtTime(heartbeat * 0.7, t, 0.3);
      this.heartTimer -= dt;
      if (this.heartTimer <= 0) {
        this.heartTimer = 1;
        if (heartbeat > 0.02) {
          this.tone(this.heart, 55, 0.22, 0.9);
          this.tone(this.heart, 50, 0.2, 0.6, 'sine', 0.26);
        }
      }
    }
    // Breath: filtered noise swelling with the in-breath, softer on the out-breath.
    if (this.breathGain && this.breathFilter) {
      const v = breathPhase === 'inhale' ? 0.05 + breathLevel * 0.1 : breathPhase === 'exhale' ? breathLevel * 0.06 : 0;
      this.breathGain.gain.setTargetAtTime(v, t, 0.15);
      this.breathFilter.frequency.setTargetAtTime(600 + breathLevel * 900, t, 0.2);
    }
  }

  /** Soft bell: sine + harmonics, long decay. */
  chime(pitch = 1, vol = 0.18): void {
    if (!this.ctx || !this.master) return;
    const f = 880 * pitch;
    this.tone(this.master, f, 3.2, vol);
    this.tone(this.master, f * 2.01, 2.2, vol * 0.35);
    this.tone(this.master, f * 3.02, 1.4, vol * 0.15);
  }

  /** Gate / chapter end: rising pad + chime cluster. */
  swell(): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    for (const f of [196, 246.9, 293.7, 392]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f * 0.5, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 2.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 1.5);
      g.gain.linearRampToValueAtTime(0, t + 5);
      o.connect(g).connect(this.master);
      o.start(t);
      o.stop(t + 5.2);
    }
    [1, 1.25, 1.5, 2].forEach((p, i) => setTimeout(() => this.chime(p, 0.12), 1200 + i * 350));
  }

  private townGain: GainNode | null = null;
  private melody = false;
  private melodyTimer = 2;
  private melodyStep = 0;

  /**
   * The town's music grows with every connection: more warm voices in the outer world,
   * and with the "music" event a soft music-box tune from the windows.
   */
  worldGrow(connections: number, music: boolean): void {
    const ctx = this.ctx;
    if (!ctx || !this.outerBus) return;
    if (!this.townGain) {
      this.townGain = ctx.createGain();
      this.townGain.gain.value = 0;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      lp.connect(this.outerBus);
      this.townGain.connect(lp);
      // A calm major chord; voices join one by one (by the gain steps).
      [261.6, 329.6, 392, 523.3, 659.3].forEach((f, i) => {
        const o = ctx.createOscillator();
        o.type = i % 2 ? 'triangle' : 'sine';
        o.frequency.value = f * (1 + (i - 2) * 0.0015);
        const g = ctx.createGain();
        g.gain.value = 0.012 * (i < 2 ? 1 : 0.7);
        o.connect(g).connect(this.townGain!);
        o.start();
      });
    }
    this.townGain.gain.setTargetAtTime(Math.min(3, connections) / 3, ctx.currentTime, 2);
    this.melody = music;
  }

  private tickMelody(dt: number, inner: number): void {
    if (!this.melody || !this.outerBus || inner > 0.5) return;
    this.melodyTimer -= dt;
    if (this.melodyTimer > 0) return;
    const notes = [523.3, 659.3, 784, 659.3, 587.3, 523.3, 440, 523.3];
    this.tone(this.outerBus, notes[this.melodyStep % notes.length], 0.9, 0.05, 'sine');
    this.melodyStep++;
    this.melodyTimer = this.melodyStep % 8 === 0 ? 4 : 0.45;
  }

  /** A push: short dull thud. */
  thud(): void {
    if (!this.ctx || !this.master) return;
    this.tone(this.master, 70, 0.4, 0.5, 'sine');
    this.tone(this.master, 140, 0.2, 0.2, 'triangle');
  }
}

export const audio = new Audio();
