import fs from 'node:fs';
import path from 'node:path';
import type { FallbackTables, DisturbanceTable } from '../../src/logic/contentTypes';
import type { ChapterLayout } from '../../src/logic/walkmap';

const root = path.resolve(__dirname, '../../public/data');
export const tables = JSON.parse(fs.readFileSync(path.join(root, 'fallback.json'), 'utf8')) as FallbackTables;
export const disturbances = JSON.parse(
  fs.readFileSync(path.join(root, 'disturbances.json'), 'utf8'),
) as DisturbanceTable;
export const strings = JSON.parse(fs.readFileSync(path.join(root, 'content/en.json'), 'utf8')) as Record<
  string,
  string
>;
export const ch1 = JSON.parse(fs.readFileSync(path.join(root, 'chapters/ch1.json'), 'utf8')) as ChapterLayout;

export class MemStore {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}
