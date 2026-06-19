import { tenStar } from './tenStar.mjs';

// 大運・年運を計算する。birth.gender が無ければ null。
// Solar は lunar-javascript の Solar（Node は import、ブラウザは window.Solar）。
// now は現在日時（テスト用に注入可能）。
export function computeLuckCycles(Solar, birth, dayMaster, now = new Date()) {
  if (!birth.gender) return null;
  const hasHour = Number.isInteger(birth.hour);
  const h = hasHour ? birth.hour : 12;
  const m = hasHour ? (birth.minute ?? 0) : 0;
  const ec = Solar.fromYmdHms(birth.year, birth.month, birth.day, h, m, 0).getLunar().getEightChar();
  const genderCode = birth.gender === 'male' ? 1 : 0;
  const all = ec.getYun(genderCode).getDaYun();
  const nowYear = now.getFullYear();

  const daYun = [];
  for (let i = 1; i < all.length; i++) {       // [0] は起運前なので除外
    const d = all[i];
    const ganZhi = d.getGanZhi();
    if (!ganZhi) continue;
    const stem = ganZhi.charAt(0), branch = ganZhi.charAt(1);
    const liuNian = d.getLiuNian().map(l => {
      const lg = l.getGanZhi();
      const ls = lg.charAt(0);
      const year = l.getYear();
      return { year, ganZhi: lg, stem: ls, tenStar: tenStar(dayMaster, ls), age: l.getAge(), isCurrent: year === nowYear };
    });
    daYun.push({
      ganZhi, stem, branch,
      startAge: d.getStartAge(), startYear: d.getStartYear(),
      tenStar: tenStar(dayMaster, stem),
      isCurrent: liuNian.some(y => y.year === nowYear),
      liuNian,
    });
  }
  return { startAge: daYun.length ? daYun[0].startAge : null, daYun };
}
