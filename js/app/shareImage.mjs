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
