import { interpret } from '../data/interpret.mjs';

function formatBirth(birth) {
  const base = `${birth.year}年${birth.month}月${birth.day}日`;
  if (Number.isInteger(birth.hour)) {
    const mm = String(birth.minute ?? 0).padStart(2, '0');
    return `${base} ${birth.hour}:${mm}`;
  }
  return `${base}（時刻不明）`;
}

export function buildViewModel(meishiki, birth) {
  const r = interpret(meishiki);
  const order = meishiki.hasHourPillar
    ? ['year', 'month', 'day', 'hour']
    : ['year', 'month', 'day'];
  const colLabel = { year: '年柱', month: '月柱', day: '日柱', hour: '時柱' };
  const columns = order.map(k => colLabel[k]);
  const cell = (fn) => order.map(k => fn(meishiki.pillars[k]));

  const tableRows = [
    { label: '天干', cells: cell(p => p.stem) },
    { label: '地支', cells: cell(p => p.branch) },
    { label: '通変星', cells: cell(p => p.tenStar ?? '―') },
    { label: '十二運', cells: cell(p => p.twelveStage) },
  ];

  return {
    name: birth.name ?? '',
    header: {
      birth: formatBirth(birth),
      catch: `あなたの日主は ${r.dayMaster.label} ─ ${r.dayMaster.alias}`,
    },
    columns,
    tableRows,
    personality: r.dayMaster.personality,
    talents: r.talents,
    dominantElement: r.dominantElement,
    radarCounts: meishiki.fiveElements,
    strength: r.strength,
    lacking: r.lackingElements,
    kakkyoku: r.kakkyoku,
    yojin: r.yojin,
    hasHourPillar: meishiki.hasHourPillar,
  };
}
