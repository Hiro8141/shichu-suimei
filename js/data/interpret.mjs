import { DAY_MASTER, TEN_STAR, ELEMENT_TENDENCY } from './interpretations.mjs';

function dominant(fiveElements) {
  let best = null;
  for (const [key, n] of Object.entries(fiveElements)) {
    if (!best || n > best.n) best = { key, n };
  }
  return best;
}

export function interpret(meishiki) {
  const dm = DAY_MASTER[meishiki.dayMaster];
  // 通変星（日柱の null を除外）を才能リストに
  const talents = [];
  for (const key of ['year', 'month', 'hour']) {
    const pillar = meishiki.pillars[key];
    if (pillar && pillar.tenStar) {
      talents.push({ star: pillar.tenStar, ...TEN_STAR[pillar.tenStar] });
    }
  }
  const dom = dominant(meishiki.fiveElements);
  return {
    dayMaster: { label: dm.label, alias: dm.alias, personality: dm.personality },
    talents,
    dominantElement: { key: dom.key, ...ELEMENT_TENDENCY[dom.key] },
  };
}
