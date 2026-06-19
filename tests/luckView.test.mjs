import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLuckView } from '../js/app/luckView.mjs';

const luck = {
  startAge: 7,
  daYun: [
    { ganZhi: '癸未', stem: '癸', branch: '未', startAge: 7, startYear: 1996, tenStar: '偏印', isCurrent: false,
      liuNian: [ { year: 1996, ganZhi: '丙子', stem: '丙', tenStar: '傷官', age: 7, isCurrent: false } ] },
    { ganZhi: '丙戌', stem: '丙', branch: '戌', startAge: 37, startYear: 2026, tenStar: '傷官', isCurrent: true,
      liuNian: [ { year: 2026, ganZhi: '丙午', stem: '丙', tenStar: '傷官', age: 37, isCurrent: true } ] },
  ],
};

test('各大運に年齢ラベルと運勢文が付く', () => {
  const v = buildLuckView(luck);
  assert.equal(v.daYun[0].ageLabel, '7〜16歳');
  assert.ok(v.daYun[0].fortune.length > 0);
});

test('年運にも運勢文が付く', () => {
  const v = buildLuckView(luck);
  assert.ok(v.daYun[0].liuNian[0].fortune.length > 0);
});

test('null を渡すと null', () => {
  assert.equal(buildLuckView(null), null);
});
