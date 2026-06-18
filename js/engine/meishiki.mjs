import { computePillars } from './pillars.mjs';
import { tenStar } from './tenStar.mjs';
import { twelveStage } from './twelveStage.mjs';
import { countFiveElements } from './fiveElements.mjs';

function annotate(pillar, dayStem, isDay) {
  return {
    ...pillar,
    tenStar: isDay ? null : tenStar(dayStem, pillar.stem),
    twelveStage: twelveStage(dayStem, pillar.branch),
  };
}

export function buildMeishiki(Solar, birth) {
  const p = computePillars(Solar, birth);
  const dayMaster = p.day.stem;
  const pillars = {
    year:  annotate(p.year, dayMaster, false),
    month: annotate(p.month, dayMaster, false),
    day:   annotate(p.day, dayMaster, true),
    hasHourPillar: p.hasHourPillar,
  };
  if (p.hasHourPillar) pillars.hour = annotate(p.hour, dayMaster, false);
  return {
    pillars,
    dayMaster,
    hasHourPillar: p.hasHourPillar,
    fiveElements: countFiveElements(p),
  };
}
