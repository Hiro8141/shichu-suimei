import { BRANCHES, STEM_INFO } from './tables.mjs';

const STAGES = ['長生','沐浴','冠帯','建禄','帝旺','衰','病','死','墓','絶','胎','養'];

// 各日干の「長生」の地支（起点）
const LONG_SHENG_START = {
  '甲':'亥','丙':'寅','戊':'寅','庚':'巳','壬':'申', // 陽干
  '乙':'午','丁':'酉','己':'酉','辛':'子','癸':'卯', // 陰干
};

// dayStem: 日干, branch: 対象の地支
export function twelveStage(dayStem, branch) {
  const startBranch = LONG_SHENG_START[dayStem];
  const startIdx = BRANCHES.indexOf(startBranch);
  const branchIdx = BRANCHES.indexOf(branch);
  const forward = !STEM_INFO[dayStem].yin; // 陽干=順行, 陰干=逆行
  const steps = forward
    ? (branchIdx - startIdx + 12) % 12
    : (startIdx - branchIdx + 12) % 12;
  return STAGES[steps];
}
