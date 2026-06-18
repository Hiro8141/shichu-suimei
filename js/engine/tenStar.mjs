import { STEM_INFO, ELEMENTS } from './tables.mjs';

// 五行の生剋: ELEMENTS = wood,fire,earth,metal,water （index 0..4）
// 生: (i+1)%5 を生じる   剋: (i+2)%5 を剋す
function relation(dayEl, otherEl) {
  const d = ELEMENTS.indexOf(dayEl);
  const o = ELEMENTS.indexOf(otherEl);
  if (d === o) return 'same';
  if ((d + 1) % 5 === o) return 'iGenerate'; // 我生
  if ((d + 2) % 5 === o) return 'iControl';  // 我剋
  if ((o + 2) % 5 === d) return 'controlsMe';// 剋我
  return 'generatesMe';                       // 生我 ((o+1)%5===d)
}

const TABLE = {
  same:        ['比肩', '劫財'], // [同陰陽, 異陰陽]
  iGenerate:   ['食神', '傷官'],
  iControl:    ['偏財', '正財'],
  controlsMe:  ['偏官', '正官'],
  generatesMe: ['偏印', '印綬'],
};

// dayStem: 日干, otherStem: 対象の天干
export function tenStar(dayStem, otherStem) {
  const day = STEM_INFO[dayStem];
  const other = STEM_INFO[otherStem];
  const rel = relation(day.element, other.element);
  const sameYin = day.yin === other.yin;
  return TABLE[rel][sameYin ? 0 : 1];
}
