/** Small text helpers shared by the logic systems. */

/** True when `keyword` appears in `text` as a word or phrase start (lowercase text). */
export function hasKeyword(text: string, keyword: string): boolean {
  const k = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Short keywords must be whole words ("no" is not in "know"); longer ones may be word starts ("excit").
  const end = keyword.length <= 3 ? '(?![a-z])' : '';
  return new RegExp(`(^|[^a-z])${k}${end}`).test(text);
}

export function cleanText(text: string, max: number): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}
