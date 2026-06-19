import { tenStar } from './tenStar.mjs';

// 味方（比劫＝同五行、印＝生んでくれる五行）
const SUPPORT = new Set(['比肩', '劫財', '印綬', '偏印']);
// 敵（食傷・財・官殺）
const DRAIN = new Set(['食神', '傷官', '偏財', '正財', '偏官', '正官']);

function sign(dayStem, stem) {
  const star = tenStar(dayStem, stem);
  if (SUPPORT.has(star)) return 1;
  if (DRAIN.has(star)) return -1;
  return 0;
}

// meishiki を入力に身強身弱を判定する。月支（月令）は重み3。日干自身は除外。
export function judgeStrength(meishiki) {
  const dayStem = meishiki.dayMaster;
  const p = meishiki.pillars;
  let score = 0, support = 0, drain = 0;
  const add = (s, w) => {
    score += s * w;
    if (s > 0) support += w;
    else if (s < 0) drain += w;
  };
  // 天干（日干は除外）
  const stems = [p.year.stem, p.month.stem];
  if (p.hasHourPillar) stems.push(p.hour.stem);
  for (const st of stems) add(sign(dayStem, st), 1);
  // 地支の本気。月支のみ重み3
  const branches = [
    { pillar: p.year, w: 1 }, { pillar: p.month, w: 3 }, { pillar: p.day, w: 1 },
  ];
  if (p.hasHourPillar) branches.push({ pillar: p.hour, w: 1 });
  for (const { pillar, w } of branches) add(sign(dayStem, pillar.hiddenStems[0]), w);

  let level;
  if (score >= 2) level = '身強';
  else if (score <= -2) level = '身弱';
  else level = '中庸';
  return { level, score, support, drain };
}
