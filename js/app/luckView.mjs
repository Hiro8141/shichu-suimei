import { LUCK_STAR } from '../data/interpretations.mjs';

// computeLuckCycles の戻り値に運勢文・年齢ラベルを付与する純関数
export function buildLuckView(luck) {
  if (!luck) return null;
  return {
    daYun: luck.daYun.map(d => ({
      ...d,
      ageLabel: `${d.startAge}〜${d.startAge + 9}歳`,
      fortune: LUCK_STAR[d.tenStar],
      liuNian: d.liuNian.map(y => ({ ...y, fortune: LUCK_STAR[y.tenStar] })),
    })),
  };
}
