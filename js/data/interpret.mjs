import { judgeStrength } from '../engine/shinStrength.mjs';
import { DAY_MASTER, TEN_STAR, ELEMENT_TENDENCY, STRENGTH, ELEMENT_LACK } from './interpretations.mjs';

function dominant(fiveElements) {
  let best = null;
  for (const [key, n] of Object.entries(fiveElements)) {
    if (!best || n > best.n) best = { key, n };
  }
  return best;
}

export function interpret(meishiki) {
  const dm = DAY_MASTER[meishiki.dayMaster];
  const talents = [];
  for (const key of ['year', 'month', 'hour']) {
    const pillar = meishiki.pillars[key];
    if (pillar && pillar.tenStar) {
      talents.push({ star: pillar.tenStar, ...TEN_STAR[pillar.tenStar] });
    }
  }
  const dom = dominant(meishiki.fiveElements);
  const sj = judgeStrength(meishiki);
  const lackingElements = Object.entries(meishiki.fiveElements)
    .filter(([, n]) => n === 0)
    .map(([key]) => ({ key, text: ELEMENT_LACK[key] }));
  return {
    dayMaster: { label: dm.label, alias: dm.alias, personality: dm.personality },
    talents,
    dominantElement: { key: dom.key, ...ELEMENT_TENDENCY[dom.key] },
    strength: { level: sj.level, advice: STRENGTH[sj.level].advice },
    lackingElements,
  };
}
