import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEMS, BRANCHES, STEM_INFO, HIDDEN_STEMS } from '../js/engine/tables.mjs';

test('十干・十二支が正しい順序で定義されている', () => {
  assert.deepEqual(STEMS, ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']);
  assert.deepEqual(BRANCHES, ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']);
});

test('日干の五行・陰陽が引ける', () => {
  assert.deepEqual(STEM_INFO['庚'], { element: 'metal', yin: false });
  assert.deepEqual(STEM_INFO['乙'], { element: 'wood', yin: true });
});

test('蔵干（本気）が引ける', () => {
  assert.equal(HIDDEN_STEMS['子'][0], '癸');
  assert.equal(HIDDEN_STEMS['寅'][0], '甲');
});
