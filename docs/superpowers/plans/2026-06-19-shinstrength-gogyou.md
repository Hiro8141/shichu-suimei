# 身強身弱＋五行可視化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存の四柱推命PWAに「身強・中庸・身弱の判定」と「五行レーダー可視化」を追加し、結果画面の五行カードをリッチな分析セクションに拡張する。

**Architecture:** 純ロジックのエンジン（`shinStrength.mjs`）とSVG生成（`radarChart.mjs`）を追加し、`interpret.mjs`→`viewModel.mjs`→`main.mjs` の既存パイプラインに組み込む。スコアは既存 `tenStar` を再利用した味方/敵分類＋月令重み付け。

**Tech Stack:** Vanilla ES modules, `node --test`, 既存 lunar-javascript 命式エンジン。

**Project dir:** `C:\Users\hiroy\Desktop\Claude code\shichu-suimei`（Windows, Bash tool for git/node）。全コミット末尾に `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。

**前提（既存コードの事実）:**
- `js/engine/tenStar.mjs` → `tenStar(dayStem, otherStem)` が通変星名（比肩/劫財/食神/傷官/偏財/正財/偏官/正官/偏印/印綬）を返す。
- `buildMeishiki` が返す各 pillar は `{ stem, branch, hiddenStems, tenStar, twelveStage }`。`hiddenStems[0]` が本気。`meishiki` は `{ dayMaster, hasHourPillar, pillars:{year,month,day,hour?,hasHourPillar}, fiveElements:{wood,fire,earth,metal,water} }`。
- `js/data/interpret.mjs` → `interpret(meishiki)` が `{ dayMaster, talents, dominantElement }` を返す。
- `js/app/viewModel.mjs` → `buildViewModel(meishiki, birth)`。
- `js/app/main.mjs` の `renderResult(vm)` が結果HTMLを組み立てる。

---

### Task 1: 身強身弱エンジン `shinStrength.mjs`

**Files:**
- Create: `js/engine/shinStrength.mjs`
- Test: `tests/shinStrength.test.mjs`

- [ ] **Step 1: 失敗するテストを書く** — `tests/shinStrength.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { judgeStrength } from '../js/engine/shinStrength.mjs';

// 日主 甲（木・陽）。各 pillar に本気 hiddenStems を持たせる
test('味方が多く月支が得令なら身強', () => {
  const m = { dayMaster: '甲', hasHourPillar: true, fiveElements: {}, pillars: {
    year:  { stem: '壬', branch: '子', hiddenStems: ['癸'] },
    month: { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
    day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
    hour:  { stem: '癸', branch: '子', hiddenStems: ['癸'] },
    hasHourPillar: true,
  }};
  const r = judgeStrength(m);
  assert.equal(r.level, '身強');
  assert.equal(r.score, 9);
  assert.equal(r.drain, 0);
});

test('敵が多く月支が失令なら身弱', () => {
  const m = { dayMaster: '甲', hasHourPillar: true, fiveElements: {}, pillars: {
    year:  { stem: '庚', branch: '申', hiddenStems: ['庚','壬','戊'] },
    month: { stem: '丙', branch: '午', hiddenStems: ['丁','己'] },
    day:   { stem: '甲', branch: '戌', hiddenStems: ['戊','辛','丁'] },
    hour:  { stem: '戊', branch: '申', hiddenStems: ['庚','壬','戊'] },
    hasHourPillar: true,
  }};
  const r = judgeStrength(m);
  assert.equal(r.level, '身弱');
  assert.equal(r.score, -9);
  assert.equal(r.support, 0);
});

test('拮抗なら中庸', () => {
  const m = { dayMaster: '甲', hasHourPillar: true, fiveElements: {}, pillars: {
    year:  { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
    month: { stem: '丙', branch: '辰', hiddenStems: ['戊','乙','癸'] },
    day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
    hour:  { stem: '庚', branch: '子', hiddenStems: ['癸'] },
    hasHourPillar: true,
  }};
  assert.equal(judgeStrength(m).level, '中庸');
});

test('月支の得令/失令だけで判定が反転する', () => {
  const base = (monthBranch, hidden) => ({
    dayMaster: '甲', hasHourPillar: false, fiveElements: {}, pillars: {
      year:  { stem: '甲', branch: '申', hiddenStems: ['庚','壬','戊'] },
      month: { stem: '庚', branch: monthBranch, hiddenStems: hidden },
      day:   { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
      hasHourPillar: false,
    }});
  assert.equal(judgeStrength(base('子', ['癸'])).level, '身強');   // 月支=印(+3)
  assert.equal(judgeStrength(base('午', ['丁','己'])).level, '身弱'); // 月支=食傷(-3)
});

test('時柱なし（3柱）でも集計できる', () => {
  const m = { dayMaster: '甲', hasHourPillar: false, fiveElements: {}, pillars: {
    year:  { stem: '壬', branch: '子', hiddenStems: ['癸'] },
    month: { stem: '甲', branch: '寅', hiddenStems: ['甲','丙','戊'] },
    day:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
    hasHourPillar: false,
  }};
  assert.equal(judgeStrength(m).level, '身強');
});
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/shinStrength.test.mjs` / Expected: FAIL (`judgeStrength` 未定義)

- [ ] **Step 3: 実装** — `js/engine/shinStrength.mjs`

```js
import { tenStar } from './tenStar.mjs';

// 味方（比劫＝同五行、印＝生んでくれる五行）
const SUPPORT = new Set(['比肩', '劫財', '印綬', '偏印']);
// 敵（食傷・財・官殺）
const DRAIN = new Set(['食神', '傷官', '偏財', '正財', '偏官', '正官']);

function sign(dayStem, stem) {
  const star = tenStar(dayStem, stem);
  if (SUPPORT.has(star)) return 1;
  if (DRAIN.has(star)) return -1;
  return 0;
}

// meishiki を入力に身強身弱を判定する。月支（月令）は重み3。日干自身は除外。
export function judgeStrength(meishiki) {
  const dayStem = meishiki.dayMaster;
  const p = meishiki.pillars;
  let score = 0, support = 0, drain = 0;
  const add = (s, w) => {
    score += s * w;
    if (s > 0) support += w;
    else if (s < 0) drain += w;
  };
  // 天干（日干は除外）
  const stems = [p.year.stem, p.month.stem];
  if (p.hasHourPillar) stems.push(p.hour.stem);
  for (const st of stems) add(sign(dayStem, st), 1);
  // 地支の本気。月支のみ重み3
  const branches = [
    { pillar: p.year, w: 1 }, { pillar: p.month, w: 3 }, { pillar: p.day, w: 1 },
  ];
  if (p.hasHourPillar) branches.push({ pillar: p.hour, w: 1 });
  for (const { pillar, w } of branches) add(sign(dayStem, pillar.hiddenStems[0]), w);

  let level;
  if (score >= 2) level = '身強';
  else if (score <= -2) level = '身弱';
  else level = '中庸';
  return { level, score, support, drain };
}
```

- [ ] **Step 4: 成功を確認** — Run: `node --test tests/shinStrength.test.mjs` / Expected: PASS（5テスト）

- [ ] **Step 5: コミット**

```bash
git add js/engine/shinStrength.mjs tests/shinStrength.test.mjs
git commit -m "feat: add shin-strength (body strong/weak) judgment engine"
```

---

### Task 2: 五行レーダー `radarChart.mjs`

**Files:**
- Create: `js/app/radarChart.mjs`
- Test: `tests/radarChart.test.mjs`

- [ ] **Step 1: 失敗するテストを書く** — `tests/radarChart.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { radarSvg } from '../js/app/radarChart.mjs';

test('五行ラベルと5頂点を含むSVGを返す', () => {
  const svg = radarSvg({ wood: 1, fire: 2, earth: 0, metal: 3, water: 1 });
  assert.match(svg, /^<svg/);
  for (const label of ['木','火','土','金','水']) assert.ok(svg.includes(label), `${label} がある`);
  // データ多角形＋基準多角形＝ polygon 2つ以上
  assert.ok((svg.match(/<polygon/g) || []).length >= 2);
});

test('全カウント0でも例外を投げずSVGを返す', () => {
  const svg = radarSvg({ wood: 0, fire: 0, earth: 0, metal: 0, water: 0 });
  assert.match(svg, /<svg/);
  assert.ok(!svg.includes('NaN'));
});
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/radarChart.test.mjs` / Expected: FAIL（`radarSvg` 未定義）

- [ ] **Step 3: 実装** — `js/app/radarChart.mjs`

```js
const ORDER = ['wood', 'fire', 'earth', 'metal', 'water'];
const LABEL = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
const COLOR = { wood: '#3ad6a0', fire: '#ff6b6b', earth: '#e7c14a', metal: '#cfd6e6', water: '#5aa0ff' };

// 五行カウント {wood,fire,earth,metal,water} から五角形レーダーのSVG文字列を返す
export function radarSvg(counts) {
  const cx = 120, cy = 120, R = 90;
  const max = Math.max(1, ...ORDER.map(k => counts[k] || 0)); // 全0でも0除算しない
  const pt = (i, r) => {
    const ang = (-90 + i * 72) * Math.PI / 180; // 木=上、時計回り
    return [cx + r * Math.cos(ang), cy + r * Math.sin(ang)];
  };
  const fmt = ([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`;
  const base = ORDER.map((_, i) => fmt(pt(i, R))).join(' ');
  const data = ORDER.map((k, i) => fmt(pt(i, R * (counts[k] || 0) / max))).join(' ');
  const dots = ORDER.map((k, i) => {
    const [x, y] = pt(i, R);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${COLOR[k]}"/>`;
  }).join('');
  const labels = ORDER.map((k, i) => {
    const [x, y] = pt(i, R + 20);
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" fill="${COLOR[k]}" font-size="13" text-anchor="middle">${LABEL[k]}</text>`;
  }).join('');
  return `<svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" width="100%" role="img" aria-label="五行バランス">`
    + `<polygon points="${base}" fill="none" stroke="rgba(157,178,230,.25)" stroke-width="1"/>`
    + `<polygon points="${data}" fill="rgba(120,150,255,.22)" stroke="#9db2e6" stroke-width="1.5"/>`
    + dots + labels + `</svg>`;
}
```

- [ ] **Step 4: 成功を確認** — Run: `node --test tests/radarChart.test.mjs` / Expected: PASS（2テスト）

- [ ] **Step 5: コミット**

```bash
git add js/app/radarChart.mjs tests/radarChart.test.mjs
git commit -m "feat: add five-element radar SVG generator"
```

---

### Task 3: 診断文データ＋interpret 組み込み

**Files:**
- Modify: `js/data/interpretations.mjs`（末尾に追記）
- Modify: `js/data/interpret.mjs`
- Test: `tests/interpret.test.mjs`（既存サンプルに hiddenStems を足し、strength/lacking を検証）

- [ ] **Step 1: 失敗するテストに更新** — `tests/interpret.test.mjs` を以下で全置換

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpret } from '../js/data/interpret.mjs';

// 日主 庚。各地支に本気 hiddenStems を付与（身強身弱判定に必要）
const sampleMeishiki = {
  dayMaster: '庚',
  hasHourPillar: false,
  pillars: {
    year:  { stem: '庚', branch: '午', hiddenStems: ['丁','己'], tenStar: '比肩', twelveStage: '沐浴' },
    month: { stem: '壬', branch: '午', hiddenStems: ['丁','己'], tenStar: '食神', twelveStage: '沐浴' },
    day:   { stem: '庚', branch: '申', hiddenStems: ['庚','壬','戊'], tenStar: null, twelveStage: '建禄' },
    hasHourPillar: false,
  },
  fiveElements: { wood: 0, fire: 2, earth: 0, metal: 3, water: 1 },
};

test('日主の基本性格文が含まれる', () => {
  const r = interpret(sampleMeishiki);
  assert.equal(r.dayMaster.label, '庚（かのえ）');
  assert.ok(r.dayMaster.personality.length > 0);
});

test('通変星から才能/適職が拾われる（日柱は除外）', () => {
  const r = interpret(sampleMeishiki);
  const stars = r.talents.map(t => t.star);
  assert.ok(stars.includes('比肩'));
  assert.ok(stars.includes('食神'));
  assert.ok(!stars.includes(null));
});

test('最も多い五行の傾向文が出る', () => {
  const r = interpret(sampleMeishiki);
  assert.equal(r.dominantElement.key, 'metal');
  assert.ok(r.dominantElement.text.length > 0);
});

test('身強身弱の判定とアドバイス文が出る', () => {
  const r = interpret(sampleMeishiki);
  assert.equal(r.strength.level, '身弱'); // 月支 午(火=官殺)失令で身弱寄り
  assert.ok(r.strength.advice.length > 0);
});

test('不足している五行のコメントが出る', () => {
  const r = interpret(sampleMeishiki);
  const keys = r.lackingElements.map(l => l.key);
  assert.ok(keys.includes('wood'));   // fiveElements.wood === 0
  assert.ok(keys.includes('earth'));  // fiveElements.earth === 0
  assert.ok(r.lackingElements.every(l => l.text.length > 0));
});
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/interpret.test.mjs` / Expected: FAIL（`r.strength` undefined）

- [ ] **Step 3: データ追記** — `js/data/interpretations.mjs` の末尾に追記

```js
// 身強/中庸/身弱の開運アドバイス
export const STRENGTH = {
  '身強': { advice: '自分の力が満ちているタイプ。エネルギーを外へ出す「与える・動く」生き方が吉。抱え込むより、人や社会へ還元すると運が開けます。' },
  '中庸': { advice: '力のバランスが取れたタイプ。状況に応じて攻めと守りを切り替えられる柔軟さが強み。極端に振れず中道を行くと安定します。' },
  '身弱': { advice: '周囲と支え合って力を発揮するタイプ。無理な背伸びより、信頼できる人や環境の助けを借りること。学びと準備があなたを強くします。' },
};

// 不足（カウント0）の五行へのワンポイント
export const ELEMENT_LACK = {
  wood:  '木が不足気味。植物・成長・学びに触れると気が巡ります。',
  fire:  '火が不足気味。人との交流や情熱を傾ける対象を持つと活気が出ます。',
  earth: '土が不足気味。生活リズムや基盤を整えると安定します。',
  metal: '金が不足気味。けじめや形にこだわると芯が定まります。',
  water: '水が不足気味。休息・柔軟さ・知識を補うと流れが良くなります。',
};
```

- [ ] **Step 4: interpret 組み込み** — `js/data/interpret.mjs` を以下で全置換

```js
import { judgeStrength } from '../engine/shinStrength.mjs';
import { DAY_MASTER, TEN_STAR, ELEMENT_TENDENCY, STRENGTH, ELEMENT_LACK } from './interpretations.mjs';

function dominant(fiveElements) {
  let best = null;
  for (const [key, n] of Object.entries(fiveElements)) {
    if (!best || n > best.n) best = { key, n };
  }
  return best;
}

export function interpret(meishiki) {
  const dm = DAY_MASTER[meishiki.dayMaster];
  const talents = [];
  for (const key of ['year', 'month', 'hour']) {
    const pillar = meishiki.pillars[key];
    if (pillar && pillar.tenStar) {
      talents.push({ star: pillar.tenStar, ...TEN_STAR[pillar.tenStar] });
    }
  }
  const dom = dominant(meishiki.fiveElements);
  const sj = judgeStrength(meishiki);
  const lackingElements = Object.entries(meishiki.fiveElements)
    .filter(([, n]) => n === 0)
    .map(([key]) => ({ key, text: ELEMENT_LACK[key] }));
  return {
    dayMaster: { label: dm.label, alias: dm.alias, personality: dm.personality },
    talents,
    dominantElement: { key: dom.key, ...ELEMENT_TENDENCY[dom.key] },
    strength: { level: sj.level, advice: STRENGTH[sj.level].advice },
    lackingElements,
  };
}
```

- [ ] **Step 5: 成功を確認** — Run: `node --test tests/interpret.test.mjs` / Expected: PASS（5テスト）

- [ ] **Step 6: コミット**

```bash
git add js/data/interpretations.mjs js/data/interpret.mjs tests/interpret.test.mjs
git commit -m "feat: add strength advice and lacking-element text to interpretation"
```

---

### Task 4: viewModel への露出

**Files:**
- Modify: `js/app/viewModel.mjs`
- Test: `tests/viewModel.test.mjs`（既存サンプルに hiddenStems を足し、新フィールドを検証）

- [ ] **Step 1: テストを更新** — `tests/viewModel.test.mjs` を以下で全置換

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildViewModel } from '../js/app/viewModel.mjs';

const meishiki = {
  dayMaster: '庚', hasHourPillar: false,
  pillars: {
    year:  { stem: '庚', branch: '午', hiddenStems: ['丁','己'], tenStar: '比肩', twelveStage: '沐浴' },
    month: { stem: '壬', branch: '午', hiddenStems: ['丁','己'], tenStar: '食神', twelveStage: '沐浴' },
    day:   { stem: '庚', branch: '申', hiddenStems: ['庚','壬','戊'], tenStar: null, twelveStage: '建禄' },
    hasHourPillar: false,
  },
  fiveElements: { wood: 0, fire: 2, earth: 0, metal: 3, water: 1 },
};

test('時柱なしのとき列は年月日の3つ', () => {
  const vm = buildViewModel(meishiki, { name: '太郎', year: 1990, month: 6, day: 19 });
  assert.deepEqual(vm.columns, ['年柱', '月柱', '日柱']);
});

test('命式表の行に天干/地支/通変星/十二運がある', () => {
  const vm = buildViewModel(meishiki, { year: 1990, month: 6, day: 19 });
  const labels = vm.tableRows.map(r => r.label);
  assert.deepEqual(labels, ['天干', '地支', '通変星', '十二運']);
  assert.deepEqual(vm.tableRows[0].cells, ['庚', '壬', '庚']);
  assert.deepEqual(vm.tableRows[2].cells, ['比肩', '食神', '―']);
});

test('ヘッダーに日付と日主キャッチが入る', () => {
  const vm = buildViewModel(meishiki, { year: 1990, month: 6, day: 19, hour: 14, minute: 25 });
  assert.match(vm.header.birth, /1990/);
  assert.match(vm.header.catch, /庚/);
});

test('レーダー入力・身強身弱・不足五行が露出される', () => {
  const vm = buildViewModel(meishiki, { year: 1990, month: 6, day: 19 });
  assert.deepEqual(vm.radarCounts, meishiki.fiveElements);
  assert.ok(['身強', '中庸', '身弱'].includes(vm.strength.level));
  assert.ok(vm.strength.advice.length > 0);
  assert.ok(Array.isArray(vm.lacking));
});
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/viewModel.test.mjs` / Expected: FAIL（`vm.radarCounts` undefined）

- [ ] **Step 3: 実装更新** — `js/app/viewModel.mjs` の `return { ... }` ブロックを以下に差し替え（既存の name/header/columns/tableRows/personality/talents/dominantElement/hasHourPillar は維持し、3フィールド追加）

```js
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
    hasHourPillar: meishiki.hasHourPillar,
  };
```

- [ ] **Step 4: 成功を確認** — Run: `node --test tests/viewModel.test.mjs` / Expected: PASS（4テスト）。続けて `npm test` で全体パスを確認。

- [ ] **Step 5: コミット**

```bash
git add js/app/viewModel.mjs tests/viewModel.test.mjs
git commit -m "feat: expose radar counts, strength, and lacking elements in view model"
```

---

### Task 5: UI統合（main.mjs＋CSS＋sw.js）とブラウザ検証

**Files:**
- Modify: `js/app/main.mjs`（import 追加、`renderResult` の五行カードを差し替え）
- Modify: `css/style.css`（レーダー＋判定バッジのスタイル追記）
- Modify: `sw.js`（新ファイルをキャッシュ対象に追加）

- [ ] **Step 1: main.mjs の import に radarSvg を追加** — 既存の import 群の直後に追記

```js
import { radarSvg } from './radarChart.mjs';
```

- [ ] **Step 2: renderResult の五行カードを差し替え** — `js/app/main.mjs` の `renderResult` 内、次のブロック

```js
    <div class="card section element-${vm.dominantElement.key}">
      <h3>五行の傾向</h3><p>${vm.dominantElement.text}</p>
    </div>
```

を、以下へ置き換える

```js
    <div class="card section gogyou-section">
      <h3>五行バランス & 身強身弱</h3>
      <div class="radar">${radarSvg(vm.radarCounts)}</div>
      <p class="strength-badge strength-${vm.strength.level}">${vm.strength.level}</p>
      <p>${vm.strength.advice}</p>
      <p class="dominant element-${vm.dominantElement.key}">${vm.dominantElement.text}</p>
      ${vm.lacking.map(l => `<p class="note">${l.text}</p>`).join('')}
    </div>
```

- [ ] **Step 3: CSS 追記** — `css/style.css` の末尾に追記

```css
.gogyou-section .radar{max-width:260px; margin:6px auto 12px;}
.gogyou-section .dominant{margin-top:10px; padding-left:10px;}
.strength-badge{display:inline-block; padding:4px 16px; border-radius:14px; font-weight:600;
  font-size:15px; margin:4px 0 10px; border:1px solid var(--line);}
.strength-身強{color:#ff9b6b; border-color:#ff9b6b;}
.strength-中庸{color:#ffe9a8; border-color:#ffe9a8;}
.strength-身弱{color:#5aa0ff; border-color:#5aa0ff;}
```

- [ ] **Step 4: sw.js のキャッシュ一覧に新ファイルを追加** — `js/data/interpret.mjs` の行の直後などに2件追加（`ASSETS` 配列内）

```js
  './js/engine/shinStrength.mjs', './js/app/radarChart.mjs',
```

また同ファイル先頭のキャッシュ名を更新してSWを確実に入れ替える：

```js
const CACHE = 'shichu-suimei-v2';
```

- [ ] **Step 5: 全テスト実行** — Run: `npm test` / Expected: 全テストPASS（既存32＋新規 shinStrength5・radarChart2・interpret+2・viewModel+1）。

- [ ] **Step 6: ブラウザ検証** — このプロジェクトのディレクトリで静的サーバを起動（例 `python -m http.server 8210` をバックグラウンド）。`http://localhost:8210/` を開き、生年月日 1990/6/19 時刻 14:25 で「占う」。確認すること：
  - 「五行バランス & 身強身弱」セクションが表示され、五角形レーダーSVGが描画される
  - 身強/中庸/身弱のいずれかのバッジ＋アドバイス文が出る
  - コンソールにエラーが出ていない
  - iPhone SE幅（375px）でレーダー・セクションが崩れない（横スクロールが出ない）
  ヘッドレスブラウザが使えない場合は、`npm test` 全パス＋静的サーバが各ファイルを200で返すことを確認し、ブラウザ目視は pending と報告する。

- [ ] **Step 7: コミット**

```bash
git add js/app/main.mjs css/style.css sw.js
git commit -m "feat: integrate strength + radar into result screen"
```

---

## Self-Review（記入済み）

- **Spec coverage:** 身強身弱エンジン=Task1／五行レーダー=Task2／アドバイス文・過不足コメント=Task3／viewModel露出=Task4／UI統合・レスポンシブ・SWキャッシュ=Task5。仕様書6章のテストは各Taskのテスト＋Task5の全体実行でカバー。
- **Placeholder scan:** TBD/TODO・曖昧指示なし。全コードブロックを明示。
- **Type consistency:** `judgeStrength`→`{level,score,support,drain}`、`radarSvg(counts)`→string、`interpret`戻り値に`strength:{level,advice}`と`lackingElements:[{key,text}]`、viewModelで`strength`/`lacking`/`radarCounts`として露出。main.mjsは`vm.strength.level`/`vm.strength.advice`/`vm.lacking`/`vm.radarCounts`を参照——全て一致。
