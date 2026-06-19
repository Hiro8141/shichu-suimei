import { STEM_INFO, ELEMENTS } from './tables.mjs';
import { judgeStrength } from './shinStrength.mjs';

const ELEMENT_NAME = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
const COLOR = { wood: '青・緑', fire: '赤', earth: '黄・茶', metal: '白・銀', water: '青・黒' };
const DIRECTION = { wood: '東', fire: '南', earth: '中央', metal: '西', water: '北' };

// 抑扶法による用神。身弱→日主を生む五行、身強→日主が生む五行、中庸→日主と同じ五行。
export function judgeYojin(meishiki) {
  const level = judgeStrength(meishiki).level;
  const dayEl = STEM_INFO[meishiki.dayMaster].element;
  const i = ELEMENTS.indexOf(dayEl);
  let element;
  if (level === '身弱') element = ELEMENTS[(i + 4) % 5];      // 日主を生む（印）
  else if (level === '身強') element = ELEMENTS[(i + 1) % 5]; // 日主が生む（食傷）
  else element = dayEl;                                       // 中庸
  return {
    level,
    element,
    elementName: ELEMENT_NAME[element],
    color: COLOR[element],
    direction: DIRECTION[element],
    affinity: `${ELEMENT_NAME[element]}の気が強い人と好相性`,
  };
}
