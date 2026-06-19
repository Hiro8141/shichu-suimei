# 機能④ 相性診断 設計書

- 作成日: 2026-06-19
- ステータス: 設計確定（実装計画待ち）
- 対象プロジェクト: shichu-suimei（四柱推命PWA）
- 位置づけ: 「もっと細かい分析」ロードマップ最終（①身強身弱＋五行、②大運・年運、③格局・用神は完了済み）

## 0. 背景

2人の命式を比較して相性を診断する。既存の命式エンジン・通変星・五行、③の用神判定（`judgeYojin`）を再利用する。性別は不要。相手の命式全体は表示せず、相性に絞る。

## 1. スコープと導線

- 結果画面に「相性を見る」ボタンを追加。押すと相手の生年月日（＋任意で時刻）を入力するミニフォームが開く。
- 送信で相手の命式を計算し、自分との相性（★スコア＋3観点＋総合コメント）を表示。
- 含まない：相手の命式全体の表示、大運の重なりなど高度な相性論、3人以上の比較。

## 2. 相性エンジン `js/engine/compatibility.mjs`

純ロジック。以下を提供する（ヘルパも export してテスト容易にする）。

### 2.1 日干関係 `dayStemRelation(stemA, stemB)` → `'干合'|'比和'|'相生'|'相剋'`
- 干合ペア（順不同）：甲己・乙庚・丙辛・丁壬・戊癸 → `'干合'`
- それ以外は `STEM_INFO` の五行で判定：同五行→`'比和'`、一方が他方を生む→`'相生'`、それ以外（相剋）→`'相剋'`

### 2.2 日支関係 `dayBranchRelation(branchA, branchB)` → `'六合'|'七冲'|'中立'`
- 六合ペア：子丑・寅亥・卯戌・辰酉・巳申・午未 → `'六合'`
- 七冲ペア：子午・丑未・寅申・卯酉・辰戌・巳亥 → `'七冲'`
- それ以外 → `'中立'`

### 2.3 五行補完 `elementComplement(selfMeishiki, partnerMeishiki)` → `'mutual'|'oneway'|'none'`
- `selfYojin = judgeYojin(self).element`。相手の命式がその五行を持つ（`partner.fiveElements[selfYojin] > 0`）なら「相手が自分を補う」。
- `partnerYojin = judgeYojin(partner).element`。`self.fiveElements[partnerYojin] > 0` なら「自分が相手を補う」。
- 双方 → `'mutual'`、片方 → `'oneway'`、なし → `'none'`。

### 2.4 総合 `compareCompatibility(selfMeishiki, partnerMeishiki)`
- 日干（自分の日干＝`self.dayMaster`、相手の日干＝`partner.dayMaster`）、日支（`self.pillars.day.branch`、`partner.pillars.day.branch`）、五行補完を評価。
- 採点：
  - 日干：干合/比和/相生 → 2、相剋 → 1
  - 日支：六合 → 2、中立 → 1、七冲 → 0
  - 五行：mutual → 2、oneway → 1、none → 0
- `total`（1〜6）→ `stars = clamp(Math.round(total*5/6), 1, 5)`。
- `band`：total≥5 → `'excellent'`、3〜4 → `'good'`、≤2 → `'challenging'`。
- 出力：
```
{
  stars, total, band,
  aspects: {
    dayStem:   { relation },   // '干合'|'比和'|'相生'|'相剋'
    dayBranch: { relation },   // '六合'|'七冲'|'中立'
    element:   { relation },   // 'mutual'|'oneway'|'none'
  }
}
```

## 3. 診断文＋組み立て

- `js/data/interpretations.mjs` に `COMPAT` を追記：
  - `band`（excellent/good/challenging）ごとの総合コメント文。
  - 3観点の各関係ごとの `{ label, note }`（例 干合→`{label:'惹かれ合う', note:'強く引き合う特別な縁'}`）。
- `js/app/compatView.mjs`：`buildCompatView(result)` がエンジン結果に文言を当て、表示用に整える：
```
{ stars, comment,
  aspects: [ { title:'惹かれ合い', label, note },
             { title:'生活の噛み合い', label, note },
             { title:'補い合い', label, note } ] }
```

## 4. UI統合とレスポンシブ

- `index.html`：結果画面に「相性を見る」ボタンと、初期非表示の相手入力ミニフォーム（年・月・日＋任意の時・分）と相性結果の差し込み先を追加。
- `js/app/main.mjs`：
  - ボタンでミニフォームを開閉。
  - 送信で相手の `birth` を読み、`buildMeishiki(window.Solar, 相手)` → `compareCompatibility(自分, 相手)` → `buildCompatView` → 相性結果を描画。
  - 自分の命式（`currentMeishiki` 相当）が必要なので、結果描画時に self の meishiki を保持しておく。
  - 表示：★（5段階）、3観点（惹かれ合い／生活の噛み合い／補い合い）の label＋note、総合コメント。
- レスポンシブ：iPhone SE（375px）で崩れないこと。

## 5. テスト

- `compatibility`：
  - `dayStemRelation`：干合（甲己）／比和（甲甲）／相生（甲丙＝木生火）／相剋（甲庚）。
  - `dayBranchRelation`：六合（子丑）／七冲（子午）／中立（子寅）。
  - `elementComplement`／`compareCompatibility`：構造化結果（stars 1〜5、band、aspects）を既知サンプルで検証（例：日干相剋・日支中立・補完なし→低スコア）。
- `compatView`：構造化結果に label/note/comment が正しく当たること。
- 既存61テストが引き続き全て通ること。

## 6. スコープ外（将来）

- 三合・半合・支害など細かい支の関係、空亡、大運の重なり。
- 3人以上の相性、相性の時期（年運との連動）。
