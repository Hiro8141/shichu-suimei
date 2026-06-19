import { tenStar } from './tenStar.mjs';

// 月支の本気蔵干の通変星で格局を判定する（簡易法）。
// 比肩→建禄格、劫財→月刃格、それ以外は通変星名＋「格」。
export function judgeKakkyoku(meishiki) {
  const honki = meishiki.pillars.month.hiddenStems[0];
  const star = tenStar(meishiki.dayMaster, honki);
  let name;
  if (star === '比肩') name = '建禄格';
  else if (star === '劫財') name = '月刃格';
  else name = star + '格';
  return { name, star };
}
