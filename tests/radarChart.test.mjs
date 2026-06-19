import { test } from 'node:test';
import assert from 'node:assert/strict';
import { radarSvg } from '../js/app/radarChart.mjs';

test('五行ラベルと5頂点を含むSVGを返す', () => {
  const svg = radarSvg({ wood: 1, fire: 2, earth: 0, metal: 3, water: 1 });
  assert.match(svg, /^<svg/);
  for (const label of ['木','火','土','金','水']) assert.ok(svg.includes(label), `${label} がある`);
  assert.ok((svg.match(/<polygon/g) || []).length >= 2);
});

test('全カウント0でも例外を投げずSVGを返す', () => {
  const svg = radarSvg({ wood: 0, fire: 0, earth: 0, metal: 0, water: 0 });
  assert.match(svg, /<svg/);
  assert.ok(!svg.includes('NaN'));
});
