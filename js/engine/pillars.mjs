import { HIDDEN_STEMS } from './tables.mjs';

// branch から { stem, branch, hiddenStems } の柱オブジェクトを作る
function makePillar(ganZhi) {
  const stem = ganZhi.charAt(0);
  const branch = ganZhi.charAt(1);
  return { stem, branch, hiddenStems: HIDDEN_STEMS[branch] };
}

// Solar: lunar-javascript の Solar クラス（Node では import、ブラウザでは window.Solar を渡す）
// birth: { year, month, day, hour?, minute? }
export function computePillars(Solar, birth) {
  const hasHour = Number.isInteger(birth.hour);
  // 時刻不明時は正午で計算し、時柱は使わない（仕様: 3柱診断）
  const h = hasHour ? birth.hour : 12;
  const m = hasHour ? (birth.minute ?? 0) : 0;
  const solar = Solar.fromYmdHms(birth.year, birth.month, birth.day, h, m, 0);
  const ec = solar.getLunar().getEightChar(); // 年柱は立春基準

  const pillars = {
    year: makePillar(ec.getYear()),
    month: makePillar(ec.getMonth()),
    day: makePillar(ec.getDay()),
    hasHourPillar: hasHour,
  };
  if (hasHour) pillars.hour = makePillar(ec.getTime());
  return pillars;
}
