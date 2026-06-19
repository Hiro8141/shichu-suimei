# 機能② 大運・年運 設計書

- 作成日: 2026-06-19
- ステータス: 設計確定（実装計画待ち）
- 対象プロジェクト: shichu-suimei（四柱推命PWA）
- 位置づけ: 「もっと細かい分析」ロードマップの第2弾（①身強身弱＋五行可視化は完了・公開済み）

## 0. 背景

四柱推命の「大運」は人生を10年区切りで見る運勢の流れ、「年運」は1年ごとの運勢。本機能は既存アプリに大運・年運を追加する。計算の核である**立運数（起運年齢）・順逆・各干支は採用済みの `lunar-javascript` に計算させ**（`EightChar.getYun(性別)` → `getDaYun()` / `getLiuNian()`）、本プロジェクトは通変星の判定と運勢解釈文に集中する。

後続機能（③格局・用神、④相性診断）は別サイクル。本書は②のみ。

## 1. スコープ

含む：
- 性別の入力（任意）
- 大運の時系列リスト（全大運＋現在地ハイライト）
- 各大運をタップで年運10年を展開（現在の大運は初期展開、今年の年運をハイライト）
- 各大運・年運に干支＋通変星＋運勢の傾向文
- 結果画面への統合

含まない（後続機能）：格局・用神、相性診断。五行・身強身弱（①で実装済み）。

## 2. 入力まわりの変更

- `index.html` の入力フォームに **性別** を追加：未選択／男／女（既定は未選択）。
- `js/app/main.mjs` の `readBirth()` が `gender`（`'male' | 'female' | null`）を返す。
- 保存レコードにも `gender` を含める。既存の性別なしレコードは大運を出さず共存する（再表示時 `gender` が無ければ大運セクション非表示）。

## 3. 大運・年運エンジン `js/engine/luck.mjs`

純ロジック寄り（lunar の Solar を注入、既存 `pillars.mjs` と同じ流儀）。

### 3.1 API

```
computeLuckCycles(Solar, birth, dayMaster, now = new Date())
```
- `birth`：`{ year, month, day, hour?, minute?, gender }`。`gender` が無ければ `null` を返す（呼び出し側で非表示）。
- `dayMaster`：日干（既存 meishiki から渡す）。通変星判定に使う。
- `now`：現在日時。テスト用に注入可能。

### 3.2 処理

1. `Solar.fromYmdHms(...).getLunar().getEightChar()` から `EightChar` を得る（時刻なしは正午で計算、既存 `computePillars` と同じ方針）。
2. 性別コード `genderCode = (gender === 'male') ? 1 : 0` で `ec.getYun(genderCode)` を取得。
3. `yun.getDaYun()` は10要素。**先頭 `[0]`（起運前の期間）は除外**し、`[1]` 以降を大運とする。
4. 現在年齢 `age = floor((now - 生年月日) / 1年)`。
5. 各大運について：
   - `ganZhi`（例 `'癸未'`）、`stem`=`ganZhi[0]`、`branch`=`ganZhi[1]`
   - `startAge`=`getStartAge()`、`startYear`=`getStartYear()`
   - `tenStar`=`tenStar(dayMaster, stem)`（既存）
   - `isCurrent` = `startAge <= age < startAge + 10`
   - `liuNian`：`getLiuNian()` から `{ year:getYear(), ganZhi:getGanZhi(), stem, tenStar(dayMaster,stem), age:getAge(), isCurrent: year === now.getFullYear() }`
6. 戻り値：
```
{ startAge, daYun: [ { ganZhi, stem, branch, startAge, startYear, tenStar,
                       isCurrent, liuNian: [ { year, ganZhi, stem, tenStar, age, isCurrent } ] } ] }
```

### 3.3 既知の検証値

- 1990-06-19・男：起運 約7歳、先頭大運 `癸未`（開始年齢7・開始年1996）。日主 `乙` に対し `癸` の通変星は **偏印**。
- 女性にすると順逆が変わり大運の干支列が変わる（方向反転の確認用）。

## 4. 診断文の追加 `js/data/interpretations.mjs`

`LUCK_STAR`：通変星10種ごとの**運勢の傾向文**（本プロジェクトで執筆）。大運・年運で共用。各キーは通変星名（比肩・劫財・食神・傷官・偏財・正財・偏官・正官・偏印・印綬）。

例：
- 比肩：「自立とマイペースが吉。仲間と対等に協力する時期。意地の張り合いには注意」
- 正官：「責任や評価が高まる時期。筋を通すと信頼を得る。無理は禁物」
- 偏印：「学び・探究・転換の時期。独自の発想が活きる。気移りに注意」

（10種すべて執筆する。文章は本プロジェクトで用意。）

## 5. UI統合とレスポンシブ

- `js/app/viewModel.mjs`：`birth.gender` がある場合のみ `computeLuckCycles` を呼び、表示用 `luck` を組み立てて返す。各大運・年運に `LUCK_STAR` の運勢文を当てる。性別なしなら `luck: null`。
- `js/app/main.mjs`：結果画面末尾に **「大運・年運」セクション**を追加。
  - 性別なし → 「性別を選ぶと大運・年運が見られます」と案内
  - 性別あり → 大運を時系列リスト表示（干支・年齢帯・通変星・運勢文）。**現在の大運をハイライト**
  - 各大運見出しを**タップで年運10年を開閉**（現在の大運は初期状態で展開、今年の年運をハイライト）
- 開閉はクリックイベントで `hidden` クラスをトグル（命式表など既存パターンに倣う）。
- レスポンシブ：iPhone SE（375px）でリスト・展開が崩れない。年運が縦に伸びても横スクロールを出さない。

## 6. テスト

- `luck`（`tests/luck.test.mjs`）
  - 1990-06-19・男で起運年齢・先頭大運の干支（`癸未`）・通変星（`偏印`）が期待通り
  - `now` を固定し、`isCurrent` が正しい大運と今年の年運に立つこと
  - 女性で大運の干支列が男性と変わること（順逆反転）
  - 各大運の `liuNian` が10年分そろうこと
  - `gender` 無しなら `null` を返すこと
- `viewModel`：`gender` ありで `luck` が組み立ち、各行に運勢文が付くこと／無しで `luck === null`
- 既存42テストが引き続き全て通ること

## 7. スコープ外（将来）

- 干支の合・冲など大運と命式の相互作用の精密判定
- 格局・用神（機能③）、相性診断（機能④）
