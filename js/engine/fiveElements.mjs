import { STEM_INFO } from './tables.mjs';

function addStem(counts, stem) {
  counts[STEM_INFO[stem].element] += 1;
}

// pillars: computePillars の戻り値
export function countFiveElements(pillars) {
  const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const list = [pillars.year, pillars.month, pillars.day];
  if (pillars.hasHourPillar && pillars.hour) list.push(pillars.hour);
  for (const p of list) {
    addStem(counts, p.stem);                 // 天干
    addStem(counts, p.hiddenStems[0]);       // 地支の本気
  }
  return counts;
}
