import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countFiveElements } from '../js/engine/fiveElements.mjs';

test('天干と地支本気を五行で集計する', () => {
  const pillars = {
    year:  { stem: '庚', branch: '午', hiddenStems: ['丁','己'] },
    month: { stem: '壬', branch: '午', hiddenStems: ['丁','己'] },
    day:   { stem: '庚', branch: '申', hiddenStems: ['庚','壬','戊'] },
    hasHourPillar: false,
  };
  const c = countFiveElements(pillars);
  // 天干: 庚(金) 壬(水) 庚(金)  地支本気: 午→丁(火) 午→丁(火) 申→庚(金)
  assert.equal(c.metal, 3); // 庚,庚,申本気庚
  assert.equal(c.water, 1); // 壬
  assert.equal(c.fire, 2);  // 丁,丁
  assert.equal(c.wood, 0);
  assert.equal(c.earth, 0);
});

test('時柱があれば時柱も数える', () => {
  const pillars = {
    year:  { stem: '甲', branch: '子', hiddenStems: ['癸'] },
    month: { stem: '甲', branch: '子', hiddenStems: ['癸'] },
    day:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
    hour:  { stem: '甲', branch: '子', hiddenStems: ['癸'] },
    hasHourPillar: true,
  };
  const c = countFiveElements(pillars);
  assert.equal(c.wood, 4);  // 甲x4
  assert.equal(c.water, 4); // 子本気癸x4
});
