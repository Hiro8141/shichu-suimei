import { COMPAT } from '../data/interpretations.mjs';

// compareCompatibility の結果に文言を当てて表示用に整える純関数
export function buildCompatView(result) {
  const { dayStem, dayBranch, element } = result.aspects;
  return {
    stars: result.stars,
    comment: COMPAT.band[result.band],
    aspects: [
      { title: '惹かれ合い', ...COMPAT.dayStem[dayStem.relation] },
      { title: '生活の噛み合い', ...COMPAT.dayBranch[dayBranch.relation] },
      { title: '補い合い', ...COMPAT.element[element.relation] },
    ],
  };
}
