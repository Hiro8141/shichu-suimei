import { STEM_INFO, ELEMENTS } from './tables.mjs';
import { judgeYojin } from './yojin.mjs';

const GAN_GOU = ['甲己', '乙庚', '丙辛', '丁壬', '戊癸'];
const ROKU_GOU = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'];
const SHICHI_CHU = ['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'];
const hasPair = (list, a, b) => list.includes(a + b) || list.includes(b + a);

export function dayStemRelation(a, b) {
  if (hasPair(GAN_GOU, a, b)) return '干合';
  const ea = ELEMENTS.indexOf(STEM_INFO[a].element);
  const eb = ELEMENTS.indexOf(STEM_INFO[b].element);
  if (ea === eb) return '比和';
  if ((ea + 1) % 5 === eb || (eb + 1) % 5 === ea) return '相生';
  return '相剋';
}

export function dayBranchRelation(a, b) {
  if (hasPair(ROKU_GOU, a, b)) return '六合';
  if (hasPair(SHICHI_CHU, a, b)) return '七冲';
  return '中立';
}

export function elementComplement(self, partner) {
  const selfYojin = judgeYojin(self).element;
  const partnerYojin = judgeYojin(partner).element;
  const partnerSupportsSelf = (partner.fiveElements[selfYojin] || 0) > 0;
  const selfSupportsPartner = (self.fiveElements[partnerYojin] || 0) > 0;
  if (partnerSupportsSelf && selfSupportsPartner) return 'mutual';
  if (partnerSupportsSelf || selfSupportsPartner) return 'oneway';
  return 'none';
}

const STEM_POINTS = { '干合': 2, '比和': 2, '相生': 2, '相剋': 1 };
const BRANCH_POINTS = { '六合': 2, '中立': 1, '七冲': 0 };
const ELEMENT_POINTS = { mutual: 2, oneway: 1, none: 0 };

export function compareCompatibility(self, partner) {
  const dayStem = dayStemRelation(self.dayMaster, partner.dayMaster);
  const dayBranch = dayBranchRelation(self.pillars.day.branch, partner.pillars.day.branch);
  const element = elementComplement(self, partner);
  const total = STEM_POINTS[dayStem] + BRANCH_POINTS[dayBranch] + ELEMENT_POINTS[element];
  const stars = Math.min(5, Math.max(1, Math.round(total * 5 / 6)));
  const band = total >= 5 ? 'excellent' : total >= 3 ? 'good' : 'challenging';
  return {
    stars, total, band,
    aspects: {
      dayStem: { relation: dayStem },
      dayBranch: { relation: dayBranch },
      element: { relation: element },
    },
  };
}
