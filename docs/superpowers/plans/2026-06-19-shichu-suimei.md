# 四柱推命占いアプリ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生年月日と任意の出生時間から四柱推命の命式（四柱＋通変星・十二運・五行）を計算し、性格・才能・適職を診断する、宇宙テーマの静的PWAを作る。

**Architecture:** カレンダー計算（干支算出）だけを実績ライブラリ `lunar-javascript` に委ね、通変星・十二運・五行・蔵干の判定と診断文組み立ては自作の純粋関数で行う。ライブラリ依存は1モジュールに隔離し、`Solar` クラスを引数で注入することで Node テストとブラウザの両方から同じエンジンコードを使う。UIはバニラJS、ビルド工程なし。

**Tech Stack:** HTML/CSS/バニラJS（ESモジュール、`"type":"module"`）、`lunar-javascript`、テストは Node 組み込み `node --test`、PWA（manifest＋Service Worker）、GitHub Pages公開。

参照仕様書: `docs/superpowers/specs/2026-06-19-shichu-suimei-design.md`

---

## ファイル構成

```
shichu-suimei/
  index.html                     入力＋結果の2画面を内包
  manifest.json                  PWAマニフェスト
  sw.js                          Service Worker（オフライン）
  package.json                   type:module, test スクリプト, lunar-javascript 依存
  css/
    style.css                    宇宙テーマ＋レスポンシブ（SE〜iPad）
  js/
    vendor/
      lunar.js                   lunar-javascript のブラウザ用UMD（ベンダリング）
    engine/
      tables.mjs                 十干・十二支・五行・陰陽・蔵干などの定数表
      pillars.mjs                Solar注入で四柱の干支を算出（ライブラリ隔離）
      tenStar.mjs                通変星の判定
      twelveStage.mjs            十二運の判定
      fiveElements.mjs           五行バランス集計
      meishiki.mjs               上記を統合して命式オブジェクトを生成
    data/
      interpretations.mjs        診断文データ（日干・通変星・五行）
      interpret.mjs              命式→診断文の組み立て
    app/
      viewModel.mjs              命式＋診断文→表示用データ（純粋関数）
      storage.mjs                localStorage 保存・読み出し
      shareImage.mjs             結果カードの画像化・共有
      main.mjs                   DOM配線（入力→計算→描画、保存/シェア）
  tests/
    pillars.test.mjs
    tenStar.test.mjs
    twelveStage.test.mjs
    fiveElements.test.mjs
    meishiki.test.mjs
    interpret.test.mjs
    viewModel.test.mjs
    storage.test.mjs
  docs/superpowers/...           仕様書・本計画
```

---

## Task 1: プロジェクト雛形と依存導入

**Files:**
- Create: `package.json`
- Create: `tests/smoke.test.mjs`
- Create: `js/engine/tables.mjs`（次タスクで中身、ここでは空ファイル作成不要）

- [ ] **Step 1: package.json を作成**

`package.json`:
```json
{
  "name": "shichu-suimei",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  },
  "dependencies": {
    "lunar-javascript": "^1.6.12"
  }
}
```

- [ ] **Step 2: 依存をインストール**

Run: `npm install`
Expected: `node_modules/lunar-javascript` が作成され、エラーなく終了する。

- [ ] **Step 3: スモークテストを書く**

`tests/smoke.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pkg from 'lunar-javascript';

test('lunar-javascript が Solar を提供する', () => {
  const { Solar } = pkg;
  assert.equal(typeof Solar.fromYmdHms, 'function');
});
```

- [ ] **Step 4: テスト実行で成功を確認**

Run: `npm test`
Expected: PASS（1 test passed）

- [ ] **Step 5: コミット**

```bash
git init
git add package.json package-lock.json tests/smoke.test.mjs .gitignore
git commit -m "chore: scaffold project with lunar-javascript"
```
（`.gitignore` に `node_modules/` を記載しておく）

---

## Task 2: 定数表モジュール（tables.mjs）

**Files:**
- Create: `js/engine/tables.mjs`
- Test: `tests/pillars.test.mjs`（このタスクでは tables 部分のみ先に検証）

- [ ] **Step 1: 失敗するテストを書く**

`tests/pillars.test.mjs`:
```js
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
```

- [ ] **Step 2: 失敗を確認**

Run: `node --test tests/pillars.test.mjs`
Expected: FAIL（Cannot find module tables.mjs）

- [ ] **Step 3: 最小実装**

`js/engine/tables.mjs`:
```js
export const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
export const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

// 五行は木火土金水を wood/fire/earth/metal/water で表す
export const ELEMENTS = ['wood','fire','earth','metal','water'];

export const STEM_INFO = {
  '甲': { element: 'wood',  yin: false }, '乙': { element: 'wood',  yin: true },
  '丙': { element: 'fire',  yin: false }, '丁': { element: 'fire',  yin: true },
  '戊': { element: 'earth', yin: false }, '己': { element: 'earth', yin: true },
  '庚': { element: 'metal', yin: false }, '辛': { element: 'metal', yin: true },
  '壬': { element: 'water', yin: false }, '癸': { element: 'water', yin: true },
};

// 地支の蔵干（先頭が本気）。通変星・五行集計に使う
export const HIDDEN_STEMS = {
  '子': ['癸'],            '丑': ['己','癸','辛'],
  '寅': ['甲','丙','戊'],  '卯': ['乙'],
  '辰': ['戊','乙','癸'],  '巳': ['丙','庚','戊'],
  '午': ['丁','己'],       '未': ['己','丁','乙'],
  '申': ['庚','壬','戊'],  '酉': ['辛'],
  '戌': ['戊','辛','丁'],  '亥': ['壬','甲'],
};

// 地支そのものの五行（十二運や五行表示の補助）
export const BRANCH_ELEMENT = {
  '子':'water','丑':'earth','寅':'wood','卯':'wood','辰':'earth','巳':'fire',
  '午':'fire','未':'earth','申':'metal','酉':'metal','戌':'earth','亥':'water',
};
```

- [ ] **Step 4: テスト成功を確認**

Run: `node --test tests/pillars.test.mjs`
Expected: PASS（3 tests）

- [ ] **Step 5: コミット**

```bash
git add js/engine/tables.mjs tests/pillars.test.mjs
git commit -m "feat: add stem/branch/element constant tables"
```

---

## Task 3: 四柱の干支算出（pillars.mjs・ライブラリ隔離）

`Solar` クラスを引数注入する純粋寄りの関数にし、ライブラリ依存をこのモジュールだけに閉じ込める。時刻未入力なら時柱を返さない。

**Files:**
- Create: `js/engine/pillars.mjs`
- Test: `tests/pillars.test.mjs`（追記）

- [ ] **Step 1: 失敗するテストを追記**

`tests/pillars.test.mjs` の末尾に追記:
```js
import pkg from 'lunar-javascript';
import { computePillars } from '../js/engine/pillars.mjs';
const { Solar } = pkg;

test('時刻ありの命式で4柱の干支が出る', () => {
  // 1990-06-19 14:25 生まれ
  const p = computePillars(Solar, { year: 1990, month: 6, day: 19, hour: 14, minute: 25 });
  assert.equal(p.year.stem + p.year.branch, '庚午');
  assert.equal(p.day.stem.length, 1);   // 日柱の天干が1文字
  assert.ok(p.hour, '時柱が存在する');
  assert.equal(p.hasHourPillar, true);
});

test('時刻なしなら時柱を省略する', () => {
  const p = computePillars(Solar, { year: 1990, month: 6, day: 19 });
  assert.equal(p.hour, undefined);
  assert.equal(p.hasHourPillar, false);
  assert.ok(p.year && p.month && p.day);
});

test('立春前後で年柱が切り替わる', () => {
  // 2024 立春は 2/4。2/3 はまだ前年(癸卯)、2/5 は甲辰
  const before = computePillars(Solar, { year: 2024, month: 2, day: 3, hour: 12, minute: 0 });
  const after  = computePillars(Solar, { year: 2024, month: 2, day: 5, hour: 12, minute: 0 });
  assert.equal(before.year.stem + before.year.branch, '癸卯');
  assert.equal(after.year.stem + after.year.branch, '甲辰');
});
```

- [ ] **Step 2: 失敗を確認**

Run: `node --test tests/pillars.test.mjs`
Expected: FAIL（computePillars 未定義）

- [ ] **Step 3: 最小実装**

`js/engine/pillars.mjs`:
```js
import { HIDDEN_STEMS } from './tables.mjs';

// branch から { stem, branch, hiddenStems } の柱オブジェクトを作る
function makePillar(ganZhi) {
  const stem = ganZhi.charAt(0);
  const branch = ganZhi.charAt(1);
  return { stem, branch, hiddenStems: HIDDEN_STEMS[branch] };
}

// Solar: lunar-javascript の Solar クラス（Node では import、ブラウザでは window.Solar を渡す）
// birth: { year, month, day, hour?, minute? }
export function computePillars(Solar, birth) {
  const hasHour = Number.isInteger(birth.hour);
  // 時刻不明時は正午で計算し、時柱は使わない（仕様: 3柱診断）
  const h = hasHour ? birth.hour : 12;
  const m = hasHour ? (birth.minute ?? 0) : 0;
  const solar = Solar.fromYmdHms(birth.year, birth.month, birth.day, h, m, 0);
  const ec = solar.getLunar().getEightChar(); // 年柱は立春基準

  const pillars = {
    year: makePillar(ec.getYear()),
    month: makePillar(ec.getMonth()),
    day: makePillar(ec.getDay()),
    hasHourPillar: hasHour,
  };
  if (hasHour) pillars.hour = makePillar(ec.getTime());
  return pillars;
}
```

注: `lunar-javascript` は CommonJS のため、Node では `import pkg from 'lunar-javascript'; const { Solar } = pkg;` の形で読み込む。ブラウザでは Task 12 でベンダリングする UMD が `window.Solar` を生やす。`getYear()/getMonth()/getDay()/getTime()` は「庚午」のような2文字の干支文字列を返す。

- [ ] **Step 4: テスト成功を確認**

Run: `node --test tests/pillars.test.mjs`
Expected: PASS（全テスト）
※ もし立春境界の期待値がライブラリのバージョン差で異なる場合は、実値をログ出力して仕様の干支と突き合わせ、テスト側の期待値を実際の正解干支に修正する（ロジックではなくテスト期待値の確認）。

- [ ] **Step 5: コミット**

```bash
git add js/engine/pillars.mjs tests/pillars.test.mjs
git commit -m "feat: compute four pillars (gan-zhi) via lunar-javascript with optional hour"
```

---

## Task 4: 通変星の判定（tenStar.mjs）

日干と対象の天干の五行関係・陰陽から通変星を返す。

**Files:**
- Create: `js/engine/tenStar.mjs`
- Test: `tests/tenStar.test.mjs`

- [ ] **Step 1: 失敗するテストを書く**

`tests/tenStar.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tenStar } from '../js/engine/tenStar.mjs';

test('同じ五行・同じ陰陽は比肩', () => {
  assert.equal(tenStar('庚', '庚'), '比肩'); // 金陽 vs 金陽
});
test('同じ五行・異なる陰陽は劫財', () => {
  assert.equal(tenStar('庚', '辛'), '劫財'); // 金陽 vs 金陰
});
test('我が生じる関係（金→水）同陰陽は食神', () => {
  assert.equal(tenStar('庚', '壬'), '食神'); // 金陽 → 水陽
});
test('我が生じる関係 異陰陽は傷官', () => {
  assert.equal(tenStar('庚', '癸'), '傷官'); // 金陽 → 水陰
});
test('我が剋す関係（金→木）同陰陽は偏財', () => {
  assert.equal(tenStar('庚', '甲'), '偏財'); // 金陽 剋 木陽
});
test('我が剋す関係 異陰陽は正財', () => {
  assert.equal(tenStar('庚', '乙'), '正財');
});
test('我を剋す関係（火→金）同陰陽は偏官', () => {
  assert.equal(tenStar('庚', '丙'), '偏官'); // 火陽 剋 金陽
});
test('我を剋す関係 異陰陽は正官', () => {
  assert.equal(tenStar('庚', '丁'), '正官');
});
test('我を生じる関係（土→金）同陰陽は偏印', () => {
  assert.equal(tenStar('庚', '戊'), '偏印'); // 土陽 生 金陽
});
test('我を生じる関係 異陰陽は印綬', () => {
  assert.equal(tenStar('庚', '己'), '印綬');
});
```

- [ ] **Step 2: 失敗を確認**

Run: `node --test tests/tenStar.test.mjs`
Expected: FAIL（tenStar 未定義）

- [ ] **Step 3: 最小実装**

`js/engine/tenStar.mjs`:
```js
import { STEM_INFO, ELEMENTS } from './tables.mjs';

// 五行の生剋: ELEMENTS = wood,fire,earth,metal,water （index 0..4）
// 生: (i+1)%5 を生じる   剋: (i+2)%5 を剋す
function relation(dayEl, otherEl) {
  const d = ELEMENTS.indexOf(dayEl);
  const o = ELEMENTS.indexOf(otherEl);
  if (d === o) return 'same';
  if ((d + 1) % 5 === o) return 'iGenerate'; // 我生
  if ((d + 2) % 5 === o) return 'iControl';  // 我剋
  if ((o + 2) % 5 === d) return 'controlsMe';// 剋我
  return 'generatesMe';                       // 生我 ((o+1)%5===d)
}

const TABLE = {
  same:        ['比肩', '劫財'], // [同陰陽, 異陰陽]
  iGenerate:   ['食神', '傷官'],
  iControl:    ['偏財', '正財'],
  controlsMe:  ['偏官', '正官'],
  generatesMe: ['偏印', '印綬'],
};

// dayStem: 日干, otherStem: 対象の天干
export function tenStar(dayStem, otherStem) {
  const day = STEM_INFO[dayStem];
  const other = STEM_INFO[otherStem];
  const rel = relation(day.element, other.element);
  const sameYin = day.yin === other.yin;
  return TABLE[rel][sameYin ? 0 : 1];
}
```

- [ ] **Step 4: テスト成功を確認**

Run: `node --test tests/tenStar.test.mjs`
Expected: PASS（10 tests）

- [ ] **Step 5: コミット**

```bash
git add js/engine/tenStar.mjs tests/tenStar.test.mjs
git commit -m "feat: add ten-star (tsuhensei) classification"
```

---

## Task 5: 十二運の判定（twelveStage.mjs）

日干ごとの長生の起点と進行方向（陽干＝順行、陰干＝逆行）から、地支に対する十二運を算出する。

**Files:**
- Create: `js/engine/twelveStage.mjs`
- Test: `tests/twelveStage.test.mjs`

- [ ] **Step 1: 失敗するテストを書く**

`tests/twelveStage.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { twelveStage } from '../js/engine/twelveStage.mjs';

test('陽干 甲は亥で長生、午で死', () => {
  assert.equal(twelveStage('甲', '亥'), '長生');
  assert.equal(twelveStage('甲', '午'), '死');
});
test('陽干 庚は巳で長生、申で建禄', () => {
  assert.equal(twelveStage('庚', '巳'), '長生');
  assert.equal(twelveStage('庚', '申'), '建禄');
});
test('陰干 乙は午で長生（逆行）、寅で帝旺', () => {
  assert.equal(twelveStage('乙', '午'), '長生');
  assert.equal(twelveStage('乙', '寅'), '帝旺');
});
```

- [ ] **Step 2: 失敗を確認**

Run: `node --test tests/twelveStage.test.mjs`
Expected: FAIL（twelveStage 未定義）

- [ ] **Step 3: 最小実装**

`js/engine/twelveStage.mjs`:
```js
import { BRANCHES, STEM_INFO } from './tables.mjs';

const STAGES = ['長生','沐浴','冠帯','建禄','帝旺','衰','病','死','墓','絶','胎','養'];

// 各日干の「長生」の地支（起点）
const LONG_SHENG_START = {
  '甲':'亥','丙':'寅','戊':'寅','庚':'巳','壬':'申', // 陽干
  '乙':'午','丁':'酉','己':'酉','辛':'子','癸':'卯', // 陰干
};

// dayStem: 日干, branch: 対象の地支
export function twelveStage(dayStem, branch) {
  const startBranch = LONG_SHENG_START[dayStem];
  const startIdx = BRANCHES.indexOf(startBranch);
  const branchIdx = BRANCHES.indexOf(branch);
  const forward = !STEM_INFO[dayStem].yin; // 陽干=順行, 陰干=逆行
  const steps = forward
    ? (branchIdx - startIdx + 12) % 12
    : (startIdx - branchIdx + 12) % 12;
  return STAGES[steps];
}
```

- [ ] **Step 4: テスト成功を確認**

Run: `node --test tests/twelveStage.test.mjs`
Expected: PASS（3 tests）

- [ ] **Step 5: コミット**

```bash
git add js/engine/twelveStage.mjs tests/twelveStage.test.mjs
git commit -m "feat: add twelve-stage (junishi-un) classification"
```

---

## Task 6: 五行バランス集計（fiveElements.mjs）

四柱の天干と地支（蔵干の本気）を木火土金水で集計する。

**Files:**
- Create: `js/engine/fiveElements.mjs`
- Test: `tests/fiveElements.test.mjs`

- [ ] **Step 1: 失敗するテストを書く**

`tests/fiveElements.test.mjs`:
```js
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
```

- [ ] **Step 2: 失敗を確認**

Run: `node --test tests/fiveElements.test.mjs`
Expected: FAIL（countFiveElements 未定義）

- [ ] **Step 3: 最小実装**

`js/engine/fiveElements.mjs`:
```js
import { STEM_INFO } from './tables.mjs';

function addStem(counts, stem) {
  counts[STEM_INFO[stem].element] += 1;
}

// pillars: computePillars の戻り値
export function countFiveElements(pillars) {
  const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const list = [pillars.year, pillars.month, pillars.day];
  if (pillars.hasHourPillar && pillars.hour) list.push(pillars.hour);
  for (const p of list) {
    addStem(counts, p.stem);                 // 天干
    addStem(counts, p.hiddenStems[0]);       // 地支の本気
  }
  return counts;
}
```

- [ ] **Step 4: テスト成功を確認**

Run: `node --test tests/fiveElements.test.mjs`
Expected: PASS（2 tests）

- [ ] **Step 5: コミット**

```bash
git add js/engine/fiveElements.mjs tests/fiveElements.test.mjs
git commit -m "feat: add five-element balance counting"
```

---

## Task 7: 命式の統合（meishiki.mjs）

各柱に通変星・十二運を付与し、日干・五行を含む命式オブジェクトを生成する。日柱の天干は日主自身なので通変星は付けない。

**Files:**
- Create: `js/engine/meishiki.mjs`
- Test: `tests/meishiki.test.mjs`

- [ ] **Step 1: 失敗するテストを書く**

`tests/meishiki.test.mjs`:
```js
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
```

- [ ] **Step 2: 失敗を確認**

Run: `node --test tests/meishiki.test.mjs`
Expected: FAIL（buildMeishiki 未定義）

- [ ] **Step 3: 最小実装**

`js/engine/meishiki.mjs`:
```js
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
```

- [ ] **Step 4: テスト成功を確認**

Run: `node --test tests/meishiki.test.mjs`
Expected: PASS（2 tests）

- [ ] **Step 5: コミット**

```bash
git add js/engine/meishiki.mjs tests/meishiki.test.mjs
git commit -m "feat: assemble full meishiki (pillars + ten-star + stage + elements)"
```

---

## Task 8: 診断文データと組み立て（interpretations.mjs / interpret.mjs）

要素別の短文を持ち、命式から拾って組み立てる。原稿は四柱推命の解釈に沿った確定文として下記に全件記載する（プレースホルダなし）。

**Files:**
- Create: `js/data/interpretations.mjs`
- Create: `js/data/interpret.mjs`
- Test: `tests/interpret.test.mjs`

- [ ] **Step 1: 失敗するテストを書く**

`tests/interpret.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpret } from '../js/data/interpret.mjs';

const sampleMeishiki = {
  dayMaster: '庚',
  hasHourPillar: false,
  pillars: {
    year:  { stem: '庚', branch: '午', tenStar: '比肩', twelveStage: '沐浴' },
    month: { stem: '壬', branch: '午', tenStar: '食神', twelveStage: '沐浴' },
    day:   { stem: '庚', branch: '申', tenStar: null,   twelveStage: '建禄' },
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
  assert.ok(!stars.includes(null)); // 日柱はnullなので入らない
});

test('最も多い五行の傾向文が出る', () => {
  const r = interpret(sampleMeishiki);
  assert.equal(r.dominantElement.key, 'metal');
  assert.ok(r.dominantElement.text.length > 0);
});
```

- [ ] **Step 2: 失敗を確認**

Run: `node --test tests/interpret.test.mjs`
Expected: FAIL（interpret 未定義）

- [ ] **Step 3: データを実装**

`js/data/interpretations.mjs`:
```js
// 日干10種：基本性格（メイン文章）
export const DAY_MASTER = {
  '甲': { label: '甲（きのえ）', alias: '大樹の人',
    personality: 'まっすぐ上へ伸びる大樹のような人。向上心と責任感が強く、リーダー役を任されやすい一方、頑固で折れにくい一面もあります。' },
  '乙': { label: '乙（きのと）', alias: '草花の人',
    personality: 'しなやかな草花のように、環境へ柔軟に適応できる人。協調性と粘り強さが魅力で、人との縁を大切にしますが、迷いやすさが出ることも。' },
  '丙': { label: '丙（ひのえ）', alias: '太陽の人',
    personality: '太陽のように明るく情熱的で、周囲を照らす存在。裏表がなく行動的ですが、熱しやすく冷めやすい移ろいやすさもあります。' },
  '丁': { label: '丁（ひのと）', alias: '灯火の人',
    personality: 'ろうそくの灯のように、人の心を静かに温める人。感受性が豊かで気配り上手。繊細ゆえに気分の波が出やすい面もあります。' },
  '戊': { label: '戊（つちのえ）', alias: '山の人',
    personality: '大きな山のようにどっしりと構える人。包容力と安定感があり頼られますが、動き出すまで時間がかかり、頑固に映ることも。' },
  '己': { label: '己（つちのと）', alias: '田畑の人',
    personality: '作物を育てる田畑のように、面倒見がよく実務に強い人。堅実で献身的ですが、心配性で抱え込みやすい一面があります。' },
  '庚': { label: '庚（かのえ）', alias: '鋼の人',
    personality: '鍛えられた鋼のように芯が強く、正義感のある努力家。一度決めたら筋を通す意志の硬さが魅力ですが、融通の利かなさが出ることも。' },
  '辛': { label: '辛（かのと）', alias: '宝石の人',
    personality: '磨かれた宝石のように繊細で美意識が高い人。鋭い感性とプライドを持ち、こだわりが強い分、傷つきやすい一面もあります。' },
  '壬': { label: '壬（みずのえ）', alias: '大海の人',
    personality: '大海のようにスケールが大きく自由を好む人。発想力と社交性に富みますが、気分のままに流れやすいところがあります。' },
  '癸': { label: '癸（みずのと）', alias: '雨露の人',
    personality: '静かな雨や露のように、物事の本質を見抜く知性の人。思慮深く献身的ですが、内に溜め込み考えすぎる傾向があります。' },
};

// 通変星10種：才能・適職の短文
export const TEN_STAR = {
  '比肩': { talent: '自立心と行動力',     aptitude: '独立・専門職、自分のペースで進める仕事' },
  '劫財': { talent: '社交性と勝負強さ',   aptitude: '営業・交渉、人と競い合う環境' },
  '食神': { talent: '表現力と感性',       aptitude: '飲食・芸術・サービス、楽しさを生む仕事' },
  '傷官': { talent: '繊細な技術と批評眼', aptitude: 'クリエイター・専門技術、こだわりを活かす仕事' },
  '偏財': { talent: '商才と機転',         aptitude: '商売・企画、人とお金を動かす仕事' },
  '正財': { talent: '堅実な管理能力',     aptitude: '経理・事務・金融、信頼を積む仕事' },
  '偏官': { talent: '決断力と行動の速さ', aptitude: '起業・現場リーダー、勝負どころのある仕事' },
  '正官': { talent: '責任感と統率力',     aptitude: '公務・管理職、組織を率いる仕事' },
  '偏印': { talent: '独創的な発想',       aptitude: '研究・企画・専門職、ひらめきを活かす仕事' },
  '印綬': { talent: '知性と学習力',       aptitude: '教育・研究・士業、知識を扱う仕事' },
};

// 五行：最も多い五行の傾向
export const ELEMENT_TENDENCY = {
  wood:  { name: '木', text: '木が強め。成長意欲と優しさがあり、まっすぐ伸びていく発展型のタイプです。' },
  fire:  { name: '火', text: '火が強め。情熱的で表現力に富み、人を惹きつける華やかさを持ちます。' },
  earth: { name: '土', text: '土が強め。誠実で安定感があり、周囲から信頼を集める支え役のタイプです。' },
  metal: { name: '金', text: '金が強め。意志が固く筋を通す人で、一つの道を究める強さを持ちます。' },
  water: { name: '水', text: '水が強め。柔軟で知的、状況に応じて形を変える発想力を持つタイプです。' },
};
```

- [ ] **Step 4: 組み立てロジックを実装**

`js/data/interpret.mjs`:
```js
import { DAY_MASTER, TEN_STAR, ELEMENT_TENDENCY } from './interpretations.mjs';

function dominant(fiveElements) {
  let best = null;
  for (const [key, n] of Object.entries(fiveElements)) {
    if (!best || n > best.n) best = { key, n };
  }
  return best;
}

export function interpret(meishiki) {
  const dm = DAY_MASTER[meishiki.dayMaster];
  // 通変星（日柱の null を除外）を才能リストに
  const talents = [];
  for (const key of ['year', 'month', 'hour']) {
    const pillar = meishiki.pillars[key];
    if (pillar && pillar.tenStar) {
      talents.push({ star: pillar.tenStar, ...TEN_STAR[pillar.tenStar] });
    }
  }
  const dom = dominant(meishiki.fiveElements);
  return {
    dayMaster: { label: dm.label, alias: dm.alias, personality: dm.personality },
    talents,
    dominantElement: { key: dom.key, ...ELEMENT_TENDENCY[dom.key] },
  };
}
```

- [ ] **Step 5: テスト成功を確認**

Run: `node --test tests/interpret.test.mjs`
Expected: PASS（3 tests）

- [ ] **Step 6: コミット**

```bash
git add js/data/interpretations.mjs js/data/interpret.mjs tests/interpret.test.mjs
git commit -m "feat: add interpretation data and assembly"
```

---

## Task 9: 表示用ビューモデル（viewModel.mjs）

命式＋診断文を、DOM描画しやすい純粋なデータに変換する。命式表の行列構造もここで作る。

**Files:**
- Create: `js/app/viewModel.mjs`
- Test: `tests/viewModel.test.mjs`

- [ ] **Step 1: 失敗するテストを書く**

`tests/viewModel.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildViewModel } from '../js/app/viewModel.mjs';

const meishiki = {
  dayMaster: '庚', hasHourPillar: false,
  pillars: {
    year:  { stem: '庚', branch: '午', tenStar: '比肩', twelveStage: '沐浴' },
    month: { stem: '壬', branch: '午', tenStar: '食神', twelveStage: '沐浴' },
    day:   { stem: '庚', branch: '申', tenStar: null,   twelveStage: '建禄' },
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
  assert.deepEqual(vm.tableRows[0].cells, ['庚', '壬', '庚']);     // 天干
  assert.deepEqual(vm.tableRows[2].cells, ['比肩', '食神', '―']); // 日柱通変星は―
});

test('ヘッダーに日付と日主キャッチが入る', () => {
  const vm = buildViewModel(meishiki, { year: 1990, month: 6, day: 19, hour: 14, minute: 25 });
  assert.match(vm.header.birth, /1990/);
  assert.match(vm.header.catch, /庚/);
});
```

- [ ] **Step 2: 失敗を確認**

Run: `node --test tests/viewModel.test.mjs`
Expected: FAIL（buildViewModel 未定義）

- [ ] **Step 3: 最小実装**

`js/app/viewModel.mjs`:
```js
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
  const cell = (k, fn) => order.map(k2 => fn(meishiki.pillars[k2]));

  const tableRows = [
    { label: '天干', cells: cell('stem', p => p.stem) },
    { label: '地支', cells: cell('branch', p => p.branch) },
    { label: '通変星', cells: cell('tenStar', p => p.tenStar ?? '―') },
    { label: '十二運', cells: cell('twelveStage', p => p.twelveStage) },
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
    hasHourPillar: meishiki.hasHourPillar,
  };
}
```

- [ ] **Step 4: テスト成功を確認**

Run: `node --test tests/viewModel.test.mjs`
Expected: PASS（3 tests）

- [ ] **Step 5: コミット**

```bash
git add js/app/viewModel.mjs tests/viewModel.test.mjs
git commit -m "feat: build result view model from meishiki"
```

---

## Task 10: localStorage 保存・読み出し（storage.mjs）

複数人分の診断結果を保存し、一覧・削除できる。

**Files:**
- Create: `js/app/storage.mjs`
- Test: `tests/storage.test.mjs`

- [ ] **Step 1: 失敗するテストを書く**

`tests/storage.test.mjs`:
```js
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { saveRecord, listRecords, deleteRecord, _setStore } from '../js/app/storage.mjs';

// localStorage を模した簡易ストア
beforeEach(() => {
  const map = new Map();
  _setStore({
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, v),
  });
});

test('保存した記録を一覧で取得できる', () => {
  saveRecord({ name: '太郎', birth: { year: 1990, month: 6, day: 19 } });
  const list = listRecords();
  assert.equal(list.length, 1);
  assert.equal(list[0].name, '太郎');
  assert.ok(list[0].id);
});

test('idで削除できる', () => {
  const rec = saveRecord({ name: '花子', birth: { year: 2000, month: 1, day: 1 } });
  deleteRecord(rec.id);
  assert.equal(listRecords().length, 0);
});
```

- [ ] **Step 2: 失敗を確認**

Run: `node --test tests/storage.test.mjs`
Expected: FAIL（storage.mjs 未定義）

- [ ] **Step 3: 最小実装**

`js/app/storage.mjs`:
```js
const KEY = 'shichu-suimei.records';

// 既定はブラウザの localStorage。テストでは _setStore で差し替える
let store = (typeof localStorage !== 'undefined') ? localStorage : null;
export function _setStore(s) { store = s; }

function readAll() {
  const raw = store.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
function writeAll(list) {
  store.setItem(KEY, JSON.stringify(list));
}

export function saveRecord(record) {
  const list = readAll();
  const saved = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ...record };
  list.push(saved);
  writeAll(list);
  return saved;
}

export function listRecords() {
  return readAll();
}

export function deleteRecord(id) {
  writeAll(readAll().filter(r => r.id !== id));
}
```

- [ ] **Step 4: テスト成功を確認**

Run: `node --test tests/storage.test.mjs`
Expected: PASS（2 tests）

- [ ] **Step 5: コミット**

```bash
git add js/app/storage.mjs tests/storage.test.mjs
git commit -m "feat: add localStorage save/list/delete for records"
```

---

## Task 11: HTML雛形（入力画面＋結果画面）

**Files:**
- Create: `index.html`

- [ ] **Step 1: index.html を作成**

`index.html`:
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0b1026" />
  <title>四柱推命 ─ 星のうらない</title>
  <link rel="manifest" href="manifest.json" />
  <link rel="stylesheet" href="css/style.css" />
  <script src="js/vendor/lunar.js" defer></script>
  <script type="module" src="js/app/main.mjs"></script>
</head>
<body>
  <div class="stars" aria-hidden="true"></div>
  <main class="app">
    <!-- 入力画面 -->
    <section id="screen-input" class="screen">
      <h1 class="title">星のうらない<span>四柱推命</span></h1>
      <form id="birth-form" class="card">
        <label>お名前（任意）
          <input type="text" id="in-name" autocomplete="off" />
        </label>
        <div class="row">
          <label>年<input type="number" id="in-year" min="1900" max="2100" required /></label>
          <label>月<input type="number" id="in-month" min="1" max="12" required /></label>
          <label>日<input type="number" id="in-day" min="1" max="31" required /></label>
        </div>
        <label class="time-toggle">
          <input type="checkbox" id="in-unknown-time" /> 出生時間はわからない
        </label>
        <div class="row" id="time-row">
          <label>時<input type="number" id="in-hour" min="0" max="23" /></label>
          <label>分<input type="number" id="in-minute" min="0" max="59" value="0" /></label>
        </div>
        <button type="submit" class="primary">占う</button>
      </form>
      <button id="open-saved" class="link">保存した鑑定をみる</button>
    </section>

    <!-- 結果画面 -->
    <section id="screen-result" class="screen hidden">
      <button id="back-btn" class="link">← もどる</button>
      <div id="result-root"></div>
      <div class="actions">
        <button id="save-btn" class="primary">保存する</button>
        <button id="share-btn">画像でシェア</button>
      </div>
    </section>

    <!-- 保存一覧 -->
    <section id="screen-saved" class="screen hidden">
      <button id="saved-back-btn" class="link">← もどる</button>
      <h2>保存した鑑定</h2>
      <ul id="saved-list"></ul>
    </section>
  </main>
</body>
</html>
```

- [ ] **Step 2: ブラウザで表示確認**

Run: `npx http-server -p 8080`（または任意の静的サーバ）し、`http://localhost:8080` を開く。
Expected: スタイル未適用だが、入力フォームと各入力欄が表示される（lunar.js 未配置のためコンソールに404が出るが次タスクで解消）。

- [ ] **Step 3: コミット**

```bash
git add index.html
git commit -m "feat: add input/result/saved screen markup"
```

---

## Task 12: ライブラリのベンダリングとDOM配線（main.mjs）

ブラウザ用 `lunar.js`（UMD、`window.Solar` を生やす）を同梱し、フォーム送信→命式計算→結果描画を配線する。

**Files:**
- Create: `js/vendor/lunar.js`
- Create: `js/app/main.mjs`

- [ ] **Step 1: lunar.js をベンダリング**

Run:
```bash
cp node_modules/lunar-javascript/lunar.js js/vendor/lunar.js
```
（`node_modules/lunar-javascript/lunar.js` は UMD 版で、ブラウザでは `window.Solar` 等を公開する。存在するファイル名は `ls node_modules/lunar-javascript/` で確認し、UMD/ブラウザ向けの `lunar.js` を使う）

- [ ] **Step 2: main.mjs を実装**

`js/app/main.mjs`:
```js
import { buildMeishiki } from '../engine/meishiki.mjs';
import { buildViewModel } from './viewModel.mjs';
import { saveRecord, listRecords, deleteRecord } from './storage.mjs';
import { shareResult } from './shareImage.mjs';

const $ = sel => document.querySelector(sel);
const screens = {
  input: $('#screen-input'), result: $('#screen-result'), saved: $('#screen-saved'),
};
function show(name) {
  for (const [k, el] of Object.entries(screens)) el.classList.toggle('hidden', k !== name);
}

let currentVM = null;
let currentBirth = null;

function readBirth() {
  const unknown = $('#in-unknown-time').checked;
  const birth = {
    name: $('#in-name').value.trim(),
    year: +$('#in-year').value,
    month: +$('#in-month').value,
    day: +$('#in-day').value,
  };
  if (!unknown && $('#in-hour').value !== '') {
    birth.hour = +$('#in-hour').value;
    birth.minute = +$('#in-minute').value || 0;
  }
  return birth;
}

function renderResult(vm) {
  const cols = vm.columns.map(c => `<th>${c}</th>`).join('');
  const rows = vm.tableRows.map(r =>
    `<tr><th>${r.label}</th>${r.cells.map(c => `<td>${c}</td>`).join('')}</tr>`
  ).join('');
  const talents = vm.talents.map(t =>
    `<div class="chip"><span>${t.star}</span>${t.talent}</div>`
  ).join('');
  $('#result-root').innerHTML = `
    <div class="result-head">
      <p class="birth">${vm.header.birth}</p>
      <p class="catch">${vm.header.catch}</p>
    </div>
    <div class="meishiki-table card">
      <table><thead><tr><th></th>${cols}</tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="card section"><h3>基本性格</h3><p>${vm.personality}</p></div>
    <div class="card section"><h3>才能・適職</h3>${talents}</div>
    <div class="card section element-${vm.dominantElement.key}">
      <h3>五行の傾向</h3><p>${vm.dominantElement.text}</p>
    </div>
    ${vm.hasHourPillar ? '' : '<p class="note">出生時間が分かるともっと詳しく占えます。</p>'}
  `;
}

$('#birth-form').addEventListener('submit', e => {
  e.preventDefault();
  const birth = readBirth();
  const meishiki = buildMeishiki(window.Solar, birth);
  currentBirth = birth;
  currentVM = buildViewModel(meishiki, birth);
  renderResult(currentVM);
  show('result');
});

$('#in-unknown-time').addEventListener('change', e => {
  $('#time-row').classList.toggle('hidden', e.target.checked);
});

$('#back-btn').addEventListener('click', () => show('input'));
$('#save-btn').addEventListener('click', () => {
  if (currentBirth) { saveRecord({ name: currentBirth.name, birth: currentBirth }); alert('保存しました'); }
});
$('#share-btn').addEventListener('click', () => shareResult(currentVM, $('#result-root')));

function renderSaved() {
  const list = listRecords();
  $('#saved-list').innerHTML = list.length
    ? list.map(r => `<li data-id="${r.id}"><span>${r.name || '（無名）'} ・ ${r.birth.year}/${r.birth.month}/${r.birth.day}</span>
        <button class="open">ひらく</button><button class="del">削除</button></li>`).join('')
    : '<li class="empty">まだ保存がありません</li>';
}
$('#open-saved').addEventListener('click', () => { renderSaved(); show('saved'); });
$('#saved-back-btn').addEventListener('click', () => show('input'));
$('#saved-list').addEventListener('click', e => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = li.dataset.id;
  const rec = listRecords().find(r => r.id === id);
  if (e.target.classList.contains('del')) { deleteRecord(id); renderSaved(); }
  else if (e.target.classList.contains('open')) {
    const meishiki = buildMeishiki(window.Solar, rec.birth);
    currentBirth = rec.birth;
    currentVM = buildViewModel(meishiki, rec.birth);
    renderResult(currentVM); show('result');
  }
});
```

- [ ] **Step 3: ブラウザで動作確認**

Run: 静的サーバを起動し、生年月日（例 1990/6/19, 14:25）を入れて「占う」。
Expected: 結果画面に命式表（庚午…）・基本性格・才能・五行が表示される。「出生時間はわからない」をチェックすると時刻欄が隠れ、結果は3柱になり注記が出る。保存→一覧→ひらく→削除が動く。

- [ ] **Step 4: コミット**

```bash
git add js/vendor/lunar.js js/app/main.mjs
git commit -m "feat: wire up form-to-result flow with vendored lunar.js"
```

---

## Task 13: 画像シェア（shareImage.mjs）

結果カードを画像化してダウンロード／Web Share APIで共有する。外部依存を避けるため、ビューモデルから `<canvas>` に直接描画する。

**Files:**
- Create: `js/app/shareImage.mjs`

- [ ] **Step 1: shareImage.mjs を実装**

`js/app/shareImage.mjs`:
```js
// vm: buildViewModel の戻り値。結果を宇宙テーマの画像にして共有/保存する
export async function shareResult(vm, _rootEl) {
  if (!vm) return;
  const W = 720, H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 背景（夜空）
  ctx.fillStyle = '#0b1026';
  ctx.fillRect(0, 0, W, H);
  // 星
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 120; i++) {
    ctx.globalAlpha = Math.random() * 0.8 + 0.2;
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = '600 40px serif';
  ctx.fillText(vm.header.catch.replace('あなたの日主は ', ''), W / 2, 110);

  // 命式表
  const cols = vm.columns.length;
  const tableX = 90, tableY = 180, cellW = (W - 180) / cols, cellH = 70;
  ctx.font = '500 26px sans-serif';
  vm.tableRows.forEach((row, ri) => {
    ctx.fillStyle = '#9db2e6';
    ctx.textAlign = 'left';
    ctx.fillText(row.label, 20, tableY + ri * cellH + 45);
    ctx.textAlign = 'center';
    row.cells.forEach((c, ci) => {
      ctx.fillStyle = (row.label === '天干' || row.label === '地支') ? '#ffe9a8' : '#e6ecff';
      ctx.fillText(c, tableX + ci * cellW + cellW / 2, tableY + ri * cellH + 45);
    });
  });

  // 基本性格（折り返し）
  ctx.fillStyle = '#e6ecff';
  ctx.font = '400 24px sans-serif';
  ctx.textAlign = 'left';
  wrapText(ctx, vm.personality, 60, 560, W - 120, 38);

  ctx.fillStyle = '#9db2e6';
  ctx.font = '400 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('星のうらない ─ 四柱推命', W / 2, H - 40);

  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  const file = new File([blob], 'shichu-suimei.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: '四柱推命の鑑定結果' }); return; }
    catch { /* キャンセル時はダウンロードにフォールバック */ }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'shichu-suimei.png';
  a.click();
  URL.revokeObjectURL(url);
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  let line = '';
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, y); line = ch; y += lineH; }
    else line += ch;
  }
  if (line) ctx.fillText(line, x, y);
}
```

- [ ] **Step 2: ブラウザで動作確認**

Run: 結果画面で「画像でシェア」を押す。
Expected: 対応端末では共有シート、非対応では PNG がダウンロードされる。画像に日主・命式表・基本性格が宇宙背景で描かれている。

- [ ] **Step 3: コミット**

```bash
git add js/app/shareImage.mjs
git commit -m "feat: render result card to image and share/download"
```

---

## Task 14: 宇宙テーマCSS＋レスポンシブ（style.css）

iPhone SE（375px）〜 iPad（768〜1024px）で命式表が崩れないようにする。

**Files:**
- Create: `css/style.css`

- [ ] **Step 1: style.css を実装**

`css/style.css`:
```css
:root{
  --bg:#0b1026; --bg2:#141b3a; --card:rgba(30,40,80,.55);
  --ink:#e6ecff; --muted:#9db2e6; --gold:#ffe9a8; --line:rgba(157,178,230,.25);
}
*{box-sizing:border-box;}
body{
  margin:0; background:radial-gradient(120% 80% at 50% 0%, #1a2350 0%, var(--bg) 55%);
  color:var(--ink); font-family:"Hiragino Sans","Noto Sans JP",system-ui,sans-serif;
  min-height:100vh;
}
.stars{position:fixed; inset:0; pointer-events:none;
  background-image:radial-gradient(1px 1px at 20% 30%,#fff,transparent),
  radial-gradient(1px 1px at 70% 60%,#fff,transparent),
  radial-gradient(1.5px 1.5px at 40% 80%,#fff,transparent),
  radial-gradient(1px 1px at 85% 20%,#cdd,transparent);
  opacity:.5;}
.app{position:relative; max-width:760px; margin:0 auto; padding:24px 16px 48px;}
.screen.hidden,.hidden{display:none;}
.title{text-align:center; font-weight:600; letter-spacing:.08em;}
.title span{display:block; font-size:.5em; color:var(--gold); letter-spacing:.3em;}
.card{background:var(--card); border:1px solid var(--line); border-radius:16px;
  padding:18px; backdrop-filter:blur(6px); margin:14px 0;}
label{display:block; color:var(--muted); font-size:14px; margin:10px 0;}
input{width:100%; margin-top:6px; padding:12px; font-size:16px; border-radius:10px;
  border:1px solid var(--line); background:rgba(10,16,40,.6); color:var(--ink);}
.row{display:flex; gap:10px;}
.row label{flex:1;}
.time-toggle{display:flex; align-items:center; gap:8px;}
.time-toggle input{width:auto; margin:0;}
button{font-size:16px; padding:12px 18px; border-radius:12px; cursor:pointer;
  border:1px solid var(--line); background:rgba(255,255,255,.06); color:var(--ink);}
button.primary{background:linear-gradient(180deg,#3a4a8f,#26306a);
  border-color:var(--gold); color:var(--gold); font-weight:600; width:100%;}
button.link{background:none; border:none; color:var(--muted); padding:8px 0;}
.actions{display:flex; gap:10px; margin-top:16px;}
.actions button{flex:1;}

.result-head{text-align:center; margin:10px 0 4px;}
.result-head .birth{color:var(--muted); font-size:13px; margin:0;}
.result-head .catch{color:var(--gold); font-size:20px; font-weight:600; margin:4px 0;}

.meishiki-table table{width:100%; border-collapse:collapse; text-align:center; table-layout:fixed;}
.meishiki-table th,.meishiki-table td{padding:8px 2px; border-top:1px solid var(--line);}
.meishiki-table thead th{border:none; color:var(--muted); font-size:12px; font-weight:400;}
.meishiki-table tbody th{color:var(--muted); font-size:11px; font-weight:400; text-align:left; width:48px;}
.meishiki-table tbody tr:nth-child(-n+2) td{color:var(--gold); font-size:22px; font-weight:600;}
.meishiki-table tbody tr:nth-child(n+3) td{font-size:13px;}

.section h3{margin:0 0 8px; color:var(--gold); font-size:15px; font-weight:600;}
.section p{margin:0; line-height:1.8;}
.chip{display:inline-block; background:rgba(157,178,230,.12); border:1px solid var(--line);
  border-radius:10px; padding:8px 12px; margin:4px; font-size:13px;}
.chip span{color:var(--gold); margin-right:8px;}
.note{color:var(--muted); font-size:13px; text-align:center;}

/* 五行アクセント */
.element-wood{box-shadow:inset 3px 0 0 #3ad6a0;}
.element-fire{box-shadow:inset 3px 0 0 #ff6b6b;}
.element-earth{box-shadow:inset 3px 0 0 #e7c14a;}
.element-metal{box-shadow:inset 3px 0 0 #cfd6e6;}
.element-water{box-shadow:inset 3px 0 0 #5aa0ff;}

#saved-list{list-style:none; padding:0;}
#saved-list li{display:flex; align-items:center; gap:8px; padding:12px;
  border-bottom:1px solid var(--line);}
#saved-list li span{flex:1;}

/* iPhone SE 等の狭幅 */
@media (max-width:380px){
  .meishiki-table tbody tr:nth-child(-n+2) td{font-size:18px;}
  .meishiki-table tbody th{width:40px; font-size:10px;}
  .app{padding:16px 10px 40px;}
}
/* iPad 以上はゆったり */
@media (min-width:768px){
  .app{padding:40px 24px;}
  .result-head .catch{font-size:24px;}
}
```

- [ ] **Step 2: レスポンシブ確認**

Run: 静的サーバを起動し、ブラウザの開発者ツールで幅375px（iPhone SE）と768〜1024px（iPad）を切り替える。
Expected: どちらでも命式表が横スクロールせず収まり、宇宙テーマ（暗い夜空・金の干支・星）が表示される。

- [ ] **Step 3: コミット**

```bash
git add css/style.css
git commit -m "feat: add cosmic theme and responsive layout (SE to iPad)"
```

---

## Task 15: PWA化（manifest＋Service Worker）と最終確認

**Files:**
- Create: `manifest.json`
- Create: `sw.js`
- Modify: `js/app/main.mjs`（SW登録を追記）

- [ ] **Step 1: manifest.json を作成**

`manifest.json`:
```json
{
  "name": "星のうらない 四柱推命",
  "short_name": "四柱推命",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#0b1026",
  "theme_color": "#0b1026",
  "icons": [
    { "src": "assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
（`assets/icon-192.png` / `assets/icon-512.png` は夜空×星のシンプルなアイコンを用意する。なければ単色＋星の簡易PNGで可）

- [ ] **Step 2: sw.js を作成**

`sw.js`:
```js
const CACHE = 'shichu-suimei-v1';
const ASSETS = [
  './', './index.html', './css/style.css',
  './js/vendor/lunar.js', './js/app/main.mjs', './js/app/viewModel.mjs',
  './js/app/storage.mjs', './js/app/shareImage.mjs',
  './js/engine/meishiki.mjs', './js/engine/pillars.mjs', './js/engine/tenStar.mjs',
  './js/engine/twelveStage.mjs', './js/engine/fiveElements.mjs', './js/engine/tables.mjs',
  './js/data/interpret.mjs', './js/data/interpretations.mjs', './manifest.json',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

- [ ] **Step 3: main.mjs に SW 登録を追記**

`js/app/main.mjs` の末尾に追記:
```js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
```

- [ ] **Step 4: 全テストを実行**

Run: `npm test`
Expected: 全テストファイル（pillars/tenStar/twelveStage/fiveElements/meishiki/interpret/viewModel/storage/smoke）が PASS。

- [ ] **Step 5: PWA動作確認**

Run: 静的サーバで開き、開発者ツールの Application タブで manifest が読まれ、Service Worker が登録され、オフライン（Network: Offline）でもリロードして動くことを確認。
Expected: オフラインでも入力→鑑定が動作する。

- [ ] **Step 6: コミット**

```bash
git add manifest.json sw.js js/app/main.mjs assets/
git commit -m "feat: add PWA manifest and offline service worker"
```

---

## 完了の定義

- `npm test` が全件 PASS（計算エンジン・診断組み立て・ビューモデル・保存のユニットテスト）
- iPhone SE 幅と iPad 幅で命式表が崩れず、宇宙テーマで表示される
- 時刻あり＝4柱、時刻なし＝3柱＋注記、で正しく鑑定が出る
- 保存（複数人）・一覧・削除・画像シェアが動作する
- PWAとしてオフライン動作する

## スコープ外（将来）

大運・年運、相性診断、診断文のAI動的生成。
