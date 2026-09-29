/** All colours of the game (DESIGN_SYSTEM §2, §3). Nothing else may define a colour. */
export const PALETTE = {
  outer: {
    card100: '#E9E6E0',
    card200: '#D3CFC7',
    card300: '#B9B4AA',
    card400: '#9C968B',
    card500: '#7E786E',
    card600: '#625D55',
    card700: '#47433D',
    ink: '#2A2723',
    haze: '#CFCBC4',
  },
  disturb: {
    money: '#E0413A',
    phone: '#3A8DE0',
    person: '#E07A9C',
    recognition: '#F2B632',
    closedDoor: '#6E5BD6',
    crowd: '#F07A2A',
    house: '#E8C54A',
    conflict: '#3FB39A',
  },
  inner: {
    night: '#141526',
    ivory: '#F6F0E1',
    white: '#FFFDF7',
    gold: '#F0C46A',
    amber: '#E8964A',
    rose: '#E9B3A6',
    shadow: '#5B5670',
  },
  player: { paper: '#EDE8DC', paperShade: '#B7B0A2', heart: '#FFC867', heartCore: '#FFF3D1' },
  light: { beam: '#FFE3A3', bridge: '#FFD98A', zone: '#FFEBC2' },
  ui: {
    panel: 'rgba(246, 240, 225, 0.82)',
    panelDark: 'rgba(20, 21, 38, 0.72)',
    text: '#2A2723',
    textLight: '#FFFDF7',
    accent: '#C9892F',
    muted: '#7E786E',
  },
  restored: {
    ground: '#C9B98F',
    stone: '#D9A583',
    wood: '#A77B58',
    roof: '#B8644B',
    plant: '#8FA66B',
    water: '#8FB7D6',
    sky: '#BFD6E6',
    wall: '#E7D9BE',
  },
} as const;

export type DisturbanceType = keyof typeof PALETTE.disturb;
export type SurfaceType = keyof typeof PALETTE.restored;

/** '#RRGGBB' → [r, g, b] in 0..1. */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
