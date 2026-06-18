import { test } from 'node:test';
import assert from 'node:assert/strict';
import pkg from 'lunar-javascript';
import { buildMeishiki } from '../js/engine/meishiki.mjs';
const { Solar } = pkg;

test('命式に日主・各柱の通変星・十二運・五行が入る', () => {
  const m = buildMeishiki(Solar, { year: 1990, month: 6, day: 19, hour: 14, minute: 25 });
  assert.ok('甲乙丙丁戊己庚辛壬癸'.includes(m.dayMaster));
  assert.equal(m.pillars.day.tenStar, null);          // 日柱は日主自身
  assert.equal(typeof m.pillars.year.tenStar, 'string');
  assert.equal(typeof m.pillars.year.twelveStage, 'string');
  assert.equal(m.hasHourPillar, true);
  const total = Object.values(m.fiveElements).reduce((a, b) => a + b, 0);
  assert.equal(total, 8); // 4柱 ×（天干＋本気）= 8
});

test('時刻なしは3柱・五行合計6', () => {
  const m = buildMeishiki(Solar, { year: 1990, month: 6, day: 19 });
  assert.equal(m.hasHourPillar, false);
  assert.equal(m.pillars.hour, undefined);
  const total = Object.values(m.fiveElements).reduce((a, b) => a + b, 0);
  assert.equal(total, 6);
});
