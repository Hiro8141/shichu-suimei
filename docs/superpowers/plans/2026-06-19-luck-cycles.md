# 大運・年運 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 四柱推命PWAに大運（10年運）と年運を追加し、性別入力に応じて時系列で運勢を表示する。

**Architecture:** `lunar-javascript` の `EightChar.getYun(性別)`／`getDaYun()`／`getLiuNian()` に立運数・順逆・干支を計算させ、既存 `tenStar` で通変星を判定。計算は `js/engine/luck.mjs`、運勢文の付与は純関数 `js/app/luckView.mjs`、描画は `main.mjs`。`viewModel.mjs` は変更せず純粋なまま保つ。

**Tech Stack:** Vanilla ES modules, `node --test`, lunar-javascript（既存）。

**Project dir:** `C:\Users\hiroy\Desktop\Claude code\shichu-suimei`（Windows, Bash tool）。全コミット末尾に `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。

**前提（確認済みの事実）:**
- ブラウザでは `js/vendor/lunar.js` が `window.Solar` を露出。Node では `import pkg from 'lunar-javascript'; const { Solar } = pkg;`。
- `Solar.fromYmdHms(y,mo,d,h,mi,0).getLunar().getEightChar()` → `EightChar`。`ec.getDay().charAt(0)` が日干。
- `ec.getYun(genderCode)`：genderCode 男=1／女=0。`yun.getDaYun()` は10要素。`[0]` は起運前で `getGanZhi()===''`（除外する）。`[1]` 以降が大運。
- `DaYun`：`getGanZhi()`（例 `'癸未'`）, `getStartAge()`, `getStartYear()`, `getLiuNian()`。
- `LiuNian`：`getYear()`, `getGanZhi()`, `getAge()`。
- `js/engine/tenStar.mjs` → `tenStar(dayStem, otherStem)`。
- 既知の検証値（生年月日 1990-06-19、日干 乙）：
  - 男：大運[先頭] `癸未`(startAge 7, startYear 1996)、`tenStar(乙,癸)=偏印`。`now=2026` の現在大運 `丙戌`(startYear 2026)。年運先頭 1996 `丙子`。
  - 女：大運[先頭] `辛巳`、`tenStar(乙,辛)=偏官`（順逆反転）。

---

### Task 1: 大運・年運エンジン `luck.mjs`

**Files:** Create `js/engine/luck.mjs`, Test `tests/luck.test.mjs`.

- [ ] **Step 1: 失敗するテストを書く** — `tests/luck.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pkg from 'lunar-javascript';
import { computeLuckCycles } from '../js/engine/luck.mjs';
const { Solar } = pkg;

const birth = { year: 1990, month: 6, day: 19, hour: 14, minute: 25 };
const NOW = new Date('2026-06-19T12:00:00');

test('男性：先頭大運の干支・年齢・通変星・年運10年', () => {
  const r = computeLuckCycles(Solar, { ...birth, gender: 'male' }, '乙', NOW);
  assert.equal(r.daYun[0].ganZhi, '癸未');
  assert.equal(r.daYun[0].startAge, 7);
  assert.equal(r.daYun[0].startYear, 1996);
  assert.equal(r.daYun[0].tenStar, '偏印');
  assert.equal(r.daYun[0].liuNian.length, 10);
  assert.equal(r.daYun[0].liuNian[0].year, 1996);
});

test('女性：順逆が反転し先頭大運が変わる', () => {
  const r = computeLuckCycles(Solar, { ...birth, gender: 'female' }, '乙', NOW);
  assert.equal(r.daYun[0].ganZhi, '辛巳');
  assert.equal(r.daYun[0].tenStar, '偏官');
});

test('現在(2026)の大運と年運に isCurrent が1つだけ立つ', () => {
  const r = computeLuckCycles(Solar, { ...birth, gender: 'male' }, '乙', NOW);
  assert.equal(r.daYun.filter(d => d.isCurrent).length, 1);
  const cur = r.daYun.find(d => d.isCurrent);
  assert.equal(cur.ganZhi, '丙戌');
  assert.equal(cur.startYear, 2026);
  const curYear = cur.liuNian.find(y => y.isCurrent);
  assert.equal(curYear.year, 2026);
});

test('起運前 da[0] は除外される（全大運の干支が2文字）', () => {
  const r = computeLuckCycles(Solar, { ...birth, gender: 'male' }, '乙', NOW);
  assert.ok(r.daYun.length >= 8);
  assert.ok(r.daYun.every(d => d.ganZhi.length === 2));
});

test('性別が無ければ null を返す', () => {
  assert.equal(computeLuckCycles(Solar, birth, '乙', NOW), null);
});
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/luck.test.mjs` / Expected: FAIL（`computeLuckCycles` 未定義）

- [ ] **Step 3: 実装** — `js/engine/luck.mjs`

```js
import { tenStar } from './tenStar.mjs';

// 大運・年運を計算する。birth.gender が無ければ null。
// Solar は lunar-javascript の Solar（Node は import、ブラウザは window.Solar）。
// now は現在日時（テスト用に注入可能）。
export function computeLuckCycles(Solar, birth, dayMaster, now = new Date()) {
  if (!birth.gender) return null;
  const hasHour = Number.isInteger(birth.hour);
  const h = hasHour ? birth.hour : 12;
  const m = hasHour ? (birth.minute ?? 0) : 0;
  const ec = Solar.fromYmdHms(birth.year, birth.month, birth.day, h, m, 0).getLunar().getEightChar();
  const genderCode = birth.gender === 'male' ? 1 : 0;
  const all = ec.getYun(genderCode).getDaYun();
  const nowYear = now.getFullYear();

  const daYun = [];
  for (let i = 1; i < all.length; i++) {       // [0] は起運前なので除外
    const d = all[i];
    const ganZhi = d.getGanZhi();
    if (!ganZhi) continue;
    const stem = ganZhi.charAt(0), branch = ganZhi.charAt(1);
    const liuNian = d.getLiuNian().map(l => {
      const lg = l.getGanZhi();
      const ls = lg.charAt(0);
      const year = l.getYear();
      return { year, ganZhi: lg, stem: ls, tenStar: tenStar(dayMaster, ls), age: l.getAge(), isCurrent: year === nowYear };
    });
    daYun.push({
      ganZhi, stem, branch,
      startAge: d.getStartAge(), startYear: d.getStartYear(),
      tenStar: tenStar(dayMaster, stem),
      isCurrent: liuNian.some(y => y.year === nowYear),
      liuNian,
    });
  }
  return { startAge: daYun.length ? daYun[0].startAge : null, daYun };
}
```

- [ ] **Step 4: 成功を確認** — Run: `node --test tests/luck.test.mjs` / Expected: PASS（5テスト）。期待値は実ライブラリで検算済み。もし干支が違う場合は実装を変えず実際の戻り値を報告すること。

- [ ] **Step 5: コミット**

```bash
git add js/engine/luck.mjs tests/luck.test.mjs
git commit -m "feat: add luck cycles (daiun/nenun) engine via lunar-javascript getYun"
```

---

### Task 2: 運勢文データ＋luckView 組み立て

**Files:** Modify `js/data/interpretations.mjs`（末尾に追記）, Create `js/app/luckView.mjs`, Test `tests/luckView.test.mjs`.

- [ ] **Step 1: 失敗するテストを書く** — `tests/luckView.test.mjs`

```js
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
```

- [ ] **Step 2: 失敗を確認** — Run: `node --test tests/luckView.test.mjs` / Expected: FAIL（`buildLuckView` 未定義）

- [ ] **Step 3: データ追記** — `js/data/interpretations.mjs` の末尾に追記

```js
// 通変星10種ごとの「その時期の運勢」傾向文（大運・年運で共用）
export const LUCK_STAR = {
  '比肩': '自立とマイペースが吉。仲間と対等に協力できる時期。意地の張り合いには注意。',
  '劫財': '勝負運と社交が高まる時期。仲間と動くと伸びる。金銭や約束はきっちりと。',
  '食神': '楽しみや表現が広がる豊かな時期。衣食住が潤う。のんびりしすぎだけ注意。',
  '傷官': '才能と感性が冴える時期。創作や専門性が光る。言葉のとげ・批判に注意。',
  '偏財': '人とお金が動く活気の時期。商才や交際が実る。広げすぎ・浪費に注意。',
  '正財': '堅実に積み上がる安定の時期。信用と蓄えが増える。守りに入りすぎない工夫を。',
  '偏官': '挑戦と決断の時期。勢いで道が開ける。無理・衝突には注意。',
  '正官': '責任や評価が高まる時期。筋を通すと信頼を得る。背伸びと過労は禁物。',
  '偏印': '学び・探究・転換の時期。独自の発想が活きる。気移り・孤立に注意。',
  '印綬': '知性と支えに恵まれる時期。学問や目上の助けが力に。受け身になりすぎず。',
};
```

- [ ] **Step 4: 実装** — `js/app/luckView.mjs`

```js
import { LUCK_STAR } from '../data/interpretations.mjs';

// computeLuckCycles の戻り値に運勢文・年齢ラベルを付与する純関数
export function buildLuckView(luck) {
  if (!luck) return null;
  return {
    daYun: luck.daYun.map(d => ({
      ...d,
      ageLabel: `${d.startAge}〜${d.startAge + 9}歳`,
      fortune: LUCK_STAR[d.tenStar],
      liuNian: d.liuNian.map(y => ({ ...y, fortune: LUCK_STAR[y.tenStar] })),
    })),
  };
}
```

- [ ] **Step 5: 成功を確認** — Run: `node --test tests/luckView.test.mjs` / Expected: PASS（3テスト）。続けて `npm test` 全パスを確認。

- [ ] **Step 6: コミット**

```bash
git add js/data/interpretations.mjs js/app/luckView.mjs tests/luckView.test.mjs
git commit -m "feat: add luck-star fortune texts and luck view assembly"
```

---

### Task 3: 性別入力の追加

**Files:** Modify `index.html`, Modify `js/app/main.mjs`（`readBirth`）。

- [ ] **Step 1: index.html に性別セレクトを追加** — フォーム `#birth-form` 内、`time-toggle` の `<label class="time-toggle">…</label>` 行の直前に次を挿入

```html
        <label>性別（任意）
          <select id="in-gender">
            <option value="">未選択</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
        </label>
```

- [ ] **Step 2: main.mjs の readBirth に gender を追加** — `readBirth` 関数内、`return birth;` の直前に次を追加

```js
  birth.gender = $('#in-gender').value || null;
```

（保存は既存の `saveRecord({ name, birth })` が birth 全体を保存するため、gender も自動で含まれる。追加変更不要。）

- [ ] **Step 3: 構文確認** — Run: `node --check js/app/main.mjs` / Expected: 構文エラーなし。

- [ ] **Step 4: コミット**

```bash
git add index.html js/app/main.mjs
git commit -m "feat: add optional gender input for luck cycles"
```

---

### Task 4: 大運・年運の描画＋展開UI＋CSS＋SW

**Files:** Modify `js/app/main.mjs`, Modify `css/style.css`, Modify `sw.js`。

- [ ] **Step 1: main.mjs の import に追加** — 既存 import 群（`radarSvg` の行の後）に追記

```js
import { computeLuckCycles } from '../engine/luck.mjs';
import { buildLuckView } from './luckView.mjs';
```

- [ ] **Step 2: 現在の luck を保持する変数とレンダラを追加** — `main.mjs` 内、`let currentVM = null;` の near（既存のモジュール変数宣言の近く）に追加

```js
let currentLuck = null;
```

そして `renderResult` 関数の定義の直前に、次の純粋なレンダラ関数を追加

```js
function renderLuckSection(luckView) {
  if (!luckView) {
    return `<div class="card section luck-section"><h3>大運・年運</h3>`
      + `<p class="note">性別を選ぶと大運・年運が見られます。</p></div>`;
  }
  const items = luckView.daYun.map((d, i) => {
    const nen = d.liuNian.map(y =>
      `<li class="${y.isCurrent ? 'cur' : ''}"><span class="gz">${y.year} ${y.ganZhi}</span>`
      + `<span class="ts">${y.tenStar}</span><span class="ft">${y.fortune}</span></li>`).join('');
    return `<div class="daiun ${d.isCurrent ? 'cur' : ''}">`
      + `<button type="button" class="daiun-head" aria-expanded="${d.isCurrent}">`
      + `<span class="gz">${d.ganZhi}</span><span class="age">${d.ageLabel}</span>`
      + `<span class="ts">${d.tenStar}</span></button>`
      + `<div class="daiun-body ${d.isCurrent ? '' : 'hidden'}">`
      + `<p class="ft">${d.fortune}</p><ul class="nenun">${nen}</ul></div></div>`;
  }).join('');
  return `<div class="card section luck-section"><h3>大運・年運</h3>${items}</div>`;
}
```

- [ ] **Step 3: renderResult に大運セクションを差し込む** — `renderResult` 内のテンプレート末尾、次の行

```js
    ${vm.hasHourPillar ? '' : '<p class="note">出生時間が分かるともっと詳しく占えます。</p>'}
```

の**直前**に次を挿入

```js
    ${renderLuckSection(currentLuck)}
```

- [ ] **Step 4: 算出を2つの呼び出し箇所に追加** — `renderResult(currentVM)` を呼ぶ前に luck を算出する。

(a) 送信ハンドラ（`$('#birth-form').addEventListener('submit', …)`）内、`currentVM = buildViewModel(meishiki, birth);` の直後に追加

```js
  currentLuck = buildLuckView(computeLuckCycles(window.Solar, birth, meishiki.dayMaster));
```

(b) 保存一覧から開くハンドラ（`#saved-list` のクリック内、`open` ボタン分岐）で `currentVM = buildViewModel(meishiki, rec.birth);` の直後に追加

```js
    currentLuck = buildLuckView(computeLuckCycles(window.Solar, rec.birth, meishiki.dayMaster));
```

- [ ] **Step 5: 大運の開閉ハンドラを追加（委譲・1回だけ登録）** — `main.mjs` のイベント登録が並んでいる箇所（例 `$('#back-btn').addEventListener(...)` の近く）に追加

```js
$('#result-root').addEventListener('click', e => {
  const head = e.target.closest('.daiun-head');
  if (!head) return;
  const body = head.nextElementSibling;
  const hidden = body.classList.toggle('hidden');
  head.setAttribute('aria-expanded', String(!hidden));
});
```

- [ ] **Step 6: CSS 追記** — `css/style.css` の末尾に追記

```css
.luck-section .daiun{border:1px solid var(--line); border-radius:10px; margin:8px 0; overflow:hidden;}
.luck-section .daiun.cur{border-color:var(--gold);}
.daiun-head{display:flex; align-items:center; gap:10px; width:100%; text-align:left;
  background:rgba(255,255,255,.04); border:none; border-radius:0; padding:10px 12px; color:var(--ink);}
.daiun.cur .daiun-head{background:rgba(255,233,168,.12);}
.daiun-head .gz{font-size:18px; font-weight:600; color:var(--gold);}
.daiun-head .age{font-size:12px; color:var(--muted);}
.daiun-head .ts{margin-left:auto; font-size:13px;}
.daiun-body{padding:8px 12px 12px;}
.daiun-body .ft{margin:4px 0 10px; font-size:13px; line-height:1.7;}
.nenun{list-style:none; padding:0; margin:0;}
.nenun li{display:grid; grid-template-columns:auto auto 1fr; gap:8px; align-items:baseline;
  padding:6px 0; border-top:1px solid var(--line); font-size:12px;}
.nenun li.cur{color:var(--gold);}
.nenun .gz{font-weight:600;}
.nenun .ft{color:var(--muted); font-size:11px;}
```

- [ ] **Step 7: sw.js を更新** — `ASSETS` 配列に2件追加（`'./js/app/radarChart.mjs'` の行の後など）

```js
  './js/engine/luck.mjs', './js/app/luckView.mjs',
```

キャッシュ名を更新：

```js
const CACHE = 'shichu-suimei-v3';
```

- [ ] **Step 8: 全テスト実行** — Run: `npm test` / Expected: 全テストPASS（既存42＋ luck5＋luckView3＝50）。

- [ ] **Step 9: ブラウザ検証** — このプロジェクトのディレクトリで静的サーバを起動（`python -m http.server 8210` をバックグラウンド）。`http://localhost:8210/` を開く。
  - 性別「男性」、1990/6/19、時刻 14:25 で「占う」。確認：
    - 「大運・年運」セクションが出る。大運リストが時系列で並ぶ
    - 現在（2026年）の大運が金色でハイライトされ、初期状態で年運が展開している
    - 別の大運の見出しをクリックすると年運10年が開閉する
    - 今年(2026)の年運がハイライトされる
    - コンソールエラーなし
  - 性別「未選択」で占うと「性別を選ぶと大運・年運が見られます」が出る
  - iPhone SE 幅（375px）で `document.scrollWidth === clientWidth`（横スクロールなし）
  ヘッドレスブラウザが無ければ、`npm test` 全パス＋静的サーバが `js/engine/luck.mjs` と `js/app/luckView.mjs` を200で返すことを確認し、目視は pending と報告。

- [ ] **Step 10: コミット**

```bash
git add js/app/main.mjs css/style.css sw.js
git commit -m "feat: render daiun/nenun section with expandable annual fortune"
```

---

## Self-Review（記入済み）

- **Spec coverage:** 性別入力=Task3／大運・年運エンジン=Task1／運勢文・view組み立て=Task2／全大運＋現在地ハイライト・タップ展開・現在大運初期展開・性別なし案内・レスポンシブ=Task4／テスト=各Task＋Task4全体実行。
- **Placeholder scan:** TBD/TODOなし。LUCK_STAR は10種すべて記載。全コードブロック明示。
- **Type consistency:** `computeLuckCycles(Solar,birth,dayMaster,now)`→`{startAge, daYun:[{ganZhi,stem,branch,startAge,startYear,tenStar,isCurrent,liuNian:[{year,ganZhi,stem,tenStar,age,isCurrent}]}]}`／`buildLuckView(luck)`→`{daYun:[{…,ageLabel,fortune,liuNian:[{…,fortune}]}]}` または null。main.mjs は `currentLuck`（buildLuckView の戻り）を `renderLuckSection` に渡し、`d.ganZhi/ageLabel/tenStar/fortune/isCurrent`、`y.year/ganZhi/tenStar/fortune/isCurrent` を参照——一致。`birth.gender` は Task3 で付与、Task1/Task4 で参照——一致。
- **アーキ補足:** 仕様書は viewModel が luck を持つ案だったが、viewModel を純粋に保つため luck 計算は main.mjs（window.Solar 保有）、運勢文付与は純関数 luckView.mjs に分離。機能・出力は仕様書どおり。
