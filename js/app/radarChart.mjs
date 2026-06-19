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
