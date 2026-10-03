import fs from 'node:fs';

const base = 'public/demo-data';
const LIVE = '2026-09-28';
const HISTORY = 156;
const HORIZON = 26;
const add = (iso, weeks) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
};
const weekIndex = (iso) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${LIVE}T00:00:00Z`)) / 604800000);
const arrayIndex = (iso) => weekIndex(iso) + HISTORY;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const roundOrder = (raw, pack, moq) => {
  if (raw <= 0) return 0;
  let qty = Math.ceil(raw / pack) * pack;
  if (qty < moq) qty = Math.ceil(moq / pack) * pack;
  return qty;
};
const noise = (i, j) => {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const line = (firm, name, pack, category, archetype, lead, cost, price, weekly, moq, casePack) => ({
  firm, name: `${firm} ${name}`, pack, category, archetype, lead, cost, price, weekly, moq, casePack,
});
const catalogue = [
  line('Ashcombe', 'Merino Overcoat', 'Single', 'apparel', 'festival', 4, 420, 980, 8, 8, 2),
  line('Ashcombe', 'Silk Blouse', 'Single', 'apparel', 'promo', 3, 160, 420, 22, 12, 4),
  line('Ashcombe', 'Cashmere Crew', 'Single', 'apparel', 'steady', 4, 190, 460, 14, 10, 2),
  line('Ashcombe', 'Wool Trouser', 'Single', 'apparel', 'steady', 3, 145, 360, 16, 8, 2),
  line('Ashcombe', 'Knit Polo', 'Single', 'apparel', 'promo', 2, 78, 190, 28, 12, 4),
  line('Ashcombe', 'Cashmere Scarf', 'Single', 'apparel', 'festival', 3, 95, 230, 18, 10, 2),
  line('Ashcombe', 'Tailored Jacket', 'Single', 'apparel', 'festival', 5, 340, 820, 6, 6, 1),
  line('Ashcombe', 'Cotton Shirt', 'Single', 'apparel', 'steady', 2, 58, 150, 36, 12, 6),
  line('Ashcombe', 'Evening Dress', 'Single', 'apparel', 'promo', 4, 290, 740, 5, 4, 1),
  line('Pell & Grey', 'Calfskin Tote', 'Single', 'leather', 'promo', 4, 310, 740, 10, 8, 2),
  line('Pell & Grey', 'Leather Belt', 'Single', 'leather', 'steady', 2, 70, 180, 36, 24, 6),
  line('Pell & Grey', 'Card Holder', 'Single', 'leather', 'steady', 2, 55, 140, 42, 24, 6),
  line('Pell & Grey', 'Weekend Bag', 'Single', 'leather', 'festival', 5, 440, 1050, 5, 4, 1),
  line('Pell & Grey', 'Leather Glove', 'Pair', 'leather', 'festival', 3, 68, 165, 14, 8, 2),
  line('Pell & Grey', 'Slim Wallet', 'Single', 'leather', 'steady', 2, 48, 125, 30, 12, 6),
  line('Pell & Grey', 'Shoulder Bag', 'Single', 'leather', 'promo', 4, 250, 610, 8, 6, 2),
  line('Pell & Grey', 'Leather Loafer', 'Pair', 'leather', 'steady', 4, 185, 460, 11, 6, 2),
  line('Pell & Grey', 'Travel Pouch', 'Single', 'leather', 'promo', 3, 88, 215, 16, 8, 2),
  line('Maison Elowen', 'Eau de Parfum', '50 ml', 'fragrance', 'festival', 3, 42, 145, 48, 24, 6),
  line('Maison Elowen', 'Hand Cream', '75 ml', 'fragrance', 'steady', 2, 9, 32, 80, 36, 12),
  line('Maison Elowen', 'Atelier Scent', '50 ml', 'fragrance', 'new_launch', 4, 48, 160, 12, 12, 6),
  line('Maison Elowen', 'Body Oil', '100 ml', 'fragrance', 'steady', 3, 22, 68, 24, 12, 6),
  line('Maison Elowen', 'Candle', '220 g', 'fragrance', 'festival', 3, 18, 58, 32, 12, 6),
  line('Maison Elowen', 'Eau de Toilette', '100 ml', 'fragrance', 'promo', 3, 28, 88, 38, 12, 6),
  line('Maison Elowen', 'Soap Trio', 'Set of 3', 'fragrance', 'steady', 2, 12, 38, 50, 24, 12),
  line('Maison Elowen', 'Room Spray', '100 ml', 'fragrance', 'promo', 2, 15, 44, 28, 12, 6),
  line('Maison Elowen', 'Discovery Set', 'Set', 'fragrance', 'festival', 4, 36, 98, 14, 6, 2),
  line('Calder & Sons', 'Steel Watch', 'Single', 'home', 'intermittent', 6, 640, 1650, 6, 4, 1),
  line('Calder & Sons', 'Linen Duvet', 'Queen', 'home', 'festival', 4, 140, 380, 12, 8, 2),
  line('Calder & Sons', 'Cashmere Throw', '130 × 180 cm', 'home', 'festival', 3, 80, 220, 16, 10, 2),
  line('Calder & Sons', 'Table Lamp', 'Single', 'home', 'steady', 4, 110, 275, 7, 4, 1),
  line('Calder & Sons', 'Dinner Plate', 'Single', 'home', 'steady', 3, 32, 78, 20, 8, 4),
  line('Calder & Sons', 'Wool Blanket', 'Queen', 'home', 'festival', 3, 75, 185, 13, 6, 2),
  line('Calder & Sons', 'Crystal Tumbler', 'Set of 2', 'home', 'promo', 3, 24, 62, 22, 8, 2),
  line('Calder & Sons', 'Linen Sheet', 'Queen', 'home', 'steady', 4, 90, 225, 9, 4, 2),
  line('Calder & Sons', 'Brass Clock', 'Single', 'home', 'steady', 5, 210, 520, 4, 2, 1),
].map((item, i) => ({
  ...item,
  i,
  sku_id: `sku_${String(i + 1).padStart(2, '0')}`,
  trend: ((i % 5) - 2) * 0.025,
  launch: item.archetype === 'new_launch' ? 140 : 0,
  gap: item.archetype === 'new_launch' ? 148 : 70,
}));

const categories = [
  ['all', 'All categories'],
  ['apparel', 'Apparel'],
  ['leather', 'Leather goods'],
  ['fragrance', 'Fragrance'],
  ['home', 'Home & timepieces'],
].map(([id, name]) => ({ id, name }));

const origins = Array.from({ length: 10 }, (_, i) => add('2025-09-29', i * 4)).concat(LIVE);
const historyThrough = add(LIVE, -1);
const events = [
  { week_start: '2023-11-20', name: 'Holiday 2023', type: 'season' },
  { week_start: '2024-11-25', name: 'Holiday 2024', type: 'season' },
  { week_start: '2025-11-24', name: 'Holiday 2025', type: 'season' },
  { week_start: '2026-03-16', name: 'Spring', type: 'season' },
  { week_start: '2026-06-15', name: 'Summer', type: 'season' },
  { week_start: '2026-11-23', name: 'Holiday', type: 'season' },
];
const holidayWeeks = events.filter((e) => e.name.startsWith('Holiday')).map((e) => weekIndex(e.week_start));
const probs = [0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99];
const zScore = { '0.05': -1.64, '0.10': -1.28, '0.25': -0.67, '0.50': 0, '0.75': 0.67, '0.90': 1.28, '0.95': 1.64, '0.99': 2.33 };
const keys = probs.map((p) => p.toFixed(2));
const historyWeeks = Array.from({ length: HISTORY }, (_, j) => add(LIVE, j - HISTORY));

const promoSlot = (product, j) => {
  if (product.archetype !== 'promo') return false;
  const period = 16 + (product.i % 5);
  return (j + product.i) % period <= 1;
};
const nearHoliday = (w) => holidayWeeks.some((h) => Math.abs(w - h) <= 3);

function trueDemand(product) {
  return historyWeeks.map((week, j) => {
    if (j < product.launch) return 0;
    const w = weekIndex(week);
    if (product.archetype === 'intermittent') {
      const chance = nearHoliday(w) ? 0.5 : 0.16;
      if (noise(product.i, j) > chance) return 0;
      return Math.max(1, Math.round(product.weekly * (1.5 + noise(product.i, j + 50))));
    }
    let level = product.weekly * (1 + product.trend * (w / 52));
    level *= 1 + 0.1 * Math.sin((w + 8) / 8.3);
    for (const h of holidayWeeks) {
      const height = product.archetype === 'festival' ? 2.1 : product.archetype === 'steady' ? 0.2 : 0.4;
      level += product.weekly * height * Math.exp(-((w - h) ** 2) / 6);
    }
    if (product.archetype === 'new_launch') level *= Math.min(1, 0.35 + (j - product.launch) / 14);
    if (promoSlot(product, j)) level *= 1.45 + 0.12 * (product.i % 3);
    else if (promoSlot(product, j - 1)) level *= 0.72;
    level *= 0.92 + 0.16 * noise(product.i, j + 7);
    return Math.max(0, Math.round(level));
  });
}

function remembered(obs, flags, idx) {
  if (idx < 0 || idx >= obs.length || obs[idx] == null) return null;
  return flags[idx] ? obs[idx] * 1.55 : obs[idx];
}
function coverTarget(obs, flags, j, product) {
  const avg = trailing(obs, flags, j, 4) ?? product.weekly * 0.5;
  const flat = avg * (product.lead + 3);
  let seasonal = 0;
  let known = 0;
  let calendar = 0;
  for (let h = 0; h <= product.lead; h++) {
    const units = remembered(obs, flags, j + h - 52);
    if (units != null) {
      seasonal += units;
      known += 1;
    }
    const week = historyWeeks[j + h];
    const festive = week ? nearHoliday(weekIndex(week)) : false;
    const lift = festive ? (product.archetype === 'festival' ? 1.9 : product.archetype === 'intermittent' ? 1.35 : 1.15) : 1;
    calendar += avg * lift;
  }
  let fromLastYear = 0;
  if (known >= Math.min(4, product.lead + 1)) {
    const levelThen = trailing(obs, flags, j - 52, 8) ?? avg;
    const scale = levelThen > 0 ? clamp(avg / levelThen, 0.7, 1.45) : 1;
    fromLastYear = seasonal * scale * 1.08;
  }
  return Math.max(flat, calendar, fromLastYear);
}
function trailing(obs, flags, end, n) {
  const vals = [];
  for (let i = end - 1; i >= 0 && vals.length < n; i--) {
    if (obs[i] == null || flags[i]) continue;
    vals.push(obs[i]);
  }
  return vals.length ? mean(vals) : null;
}

function simulateStockroom(product, demand) {
  let onHand = product.archetype === 'new_launch' ? 0 : Math.round(product.weekly * (product.lead + 1.5));
  const pipeline = [];
  const observed = Array(HISTORY).fill(null);
  const stockout = Array(HISTORY).fill(0);
  const dueQty = (j) => pipeline.filter((p) => p.at === j).reduce((s, p) => s + p.qty, 0);
  const onOrder = (j) => pipeline.filter((p) => p.at > j).reduce((s, p) => s + p.qty, 0);
  const receive = (j) => { onHand += dueQty(j); };
  const place = (j) => {
    if (j < product.launch) return;
    const raw = Math.max(0, coverTarget(observed, stockout, j, product) - (onHand + onOrder(j)));
    const qty = roundOrder(raw, product.casePack, product.moq);
    if (qty > 0) pipeline.push({ at: j + product.lead + 1, qty });
  };
  const snapshots = {};
  const shoot = (j) => snapshots[j] = {
    on_hand: onHand,
    on_order: onOrder(j),
    pipeline: pipeline.filter((p) => p.at > j).map((p) => ({ at: p.at, qty: p.qty })),
  };
  for (let j = 0; j < HISTORY; j++) {
    receive(j);
    shoot(j);
    place(j);
    if (j < product.launch) continue;
    const sold = Math.min(onHand, demand[j]);
    if (demand[j] > sold) stockout[j] = 1;
    onHand -= sold;
    observed[j] = j === product.gap ? null : sold;
  }
  receive(HISTORY);
  shoot(HISTORY);
  return { observed, stockout, snapshots };
}

function pointAt(product, obs, flags, originIndex, h, promoDepth) {
  const level = trailing(obs, flags, originIndex, 8) ?? product.weekly * (product.archetype === 'new_launch' ? 0.45 : 0.7);
  const prior = trailing(obs, flags, Math.max(0, originIndex - 8), 8) ?? level;
  const trend = (level - prior) / 8;
  const structural = Math.max(0, level + trend * h);
  const last = originIndex + h - 52;
  const lastUnits = remembered(obs, flags, last);
  let seasonal = null;
  if (lastUnits != null && last < originIndex) {
    const levelThen = trailing(obs, flags, last, 8) ?? level;
    const scale = levelThen > 0 ? clamp(level / levelThen, 0.65, 1.55) : 1;
    seasonal = lastUnits * scale;
  }
  const beforePromo = seasonal == null ? structural : 0.8 * seasonal + 0.2 * structural;
  const originDate = originIndex >= HISTORY ? LIVE : historyWeeks[originIndex];
  const festive = nearHoliday(weekIndex(add(originDate, h)));
  let point = beforePromo;
  if (promoDepth > 0 && (h === 1 || h === 2)) point *= 1 + (promoDepth / 100) * 1.6;
  if (promoDepth > 0 && h === 3) point *= 0.72;
  return { point: Math.max(0, point), level, prior, trend, structural, festive, beforePromo };
}

function forecast(product, obs, flags, originIndex, originDate, promoDepth) {
  const samples = [];
  for (let h = 0; h < HORIZON; h++) samples.push(pointAt(product, obs, flags, originIndex, h, 0));
  const level = samples[0].level;
  const errs = [];
  for (let k = Math.max(product.launch + 8, originIndex - 24); k < originIndex; k++) {
    if (obs[k] == null || flags[k]) continue;
    const back = pointAt(product, obs, flags, k, 0, 0).point;
    errs.push(obs[k] - back);
  }
  const residual = errs.length ? Math.sqrt(mean(errs.map((e) => e * e))) : 0.3 * level;
  const coverWeeks = product.lead + 1;
  const leanWeeks = product.lead + 2.65;
  const sigmaFloor = Math.max(0.2 * level, ((leanWeeks - coverWeeks) * level) / (1.64 * coverWeeks ** 0.85));
  const sigma = Math.max(1, sigmaFloor, residual);
  const withPromo = samples.map((sample, h) => {
    let point = sample.beforePromo;
    if (promoDepth > 0 && (h === 1 || h === 2)) point *= 1 + (promoDepth / 100) * 1.6;
    if (promoDepth > 0 && h === 3) point *= 0.72;
    const band = sigma * Math.sqrt(1 + h / 8);
    return {
      p50: Math.max(0, point),
      p10: Math.max(0, point - 1.28 * band),
      p90: Math.max(point, point + 1.28 * band),
      sample,
    };
  });
  const weekly = {
    p10: withPromo.map((row) => Math.round(row.p10)),
    p50: withPromo.map((row) => Math.round(row.p50)),
    p90: withPromo.map((row) => Math.round(row.p90)),
  };
  const cum50 = [];
  withPromo.forEach((row, h) => cum50.push((cum50[h - 1] ?? 0) + row.p50));
  const cumQ = {};
  for (const key of keys) {
    cumQ[key] = cum50.map((total, h) => Math.max(0, Math.round(total + zScore[key] * sigma * (h + 1) ** 0.85)));
    for (let h = 1; h < HORIZON; h++) cumQ[key][h] = Math.max(cumQ[key][h], cumQ[key][h - 1]);
  }
  for (let h = 0; h < HORIZON; h++) {
    for (let p = 1; p < keys.length; p++) cumQ[keys[p]][h] = Math.max(cumQ[keys[p]][h], cumQ[keys[p - 1]][h]);
  }
  const baseline = Array.from({ length: HORIZON }, (_, h) => {
    const last = originIndex + h - 52;
    if (last >= 0 && last < obs.length && obs[last] != null) return Math.round(obs[last]);
    return Math.round(level);
  });
  const festiveRows = withPromo.filter((row) => row.sample.festive);
  const quietRows = withPromo.filter((row) => !row.sample.festive);
  const gapOf = (row) => row.sample.beforePromo - row.sample.structural;
  let promoExtra = 0;
  let promoWeeks = 0;
  for (let j = Math.max(0, originIndex - 52); j < originIndex; j++) {
    if (!promoSlot(product, j) || obs[j] == null) continue;
    const base = trailing(obs, flags, j, 4);
    if (base == null) continue;
    promoExtra += obs[j] - base;
    promoWeeks += 1;
  }
  const drivers = {
    Trend: Math.round(samples[0].trend * 8),
    Seasonality: Math.round((quietRows.length ? quietRows.reduce((s, row) => s + gapOf(row), 0) / quietRows.length : 0)),
    Festival: Math.round(festiveRows.length ? Math.max(...festiveRows.map(gapOf)) : 0),
    'Promotion / price': Math.round(promoWeeks ? promoExtra / promoWeeks : withPromo.reduce((s, row) => s + row.p50 - row.sample.beforePromo, 0) / HORIZON),
    Momentum: Math.round((samples[0].level - samples[0].prior) / 2),
  };
  return { weekly, cum_q: cumQ, baseline, drivers, level: samples[0].level, sigma, originDate };
}

function orderQty(target, onHand, onOrder, product) {
  return roundOrder(Math.max(0, target - onHand - onOrder), product.casePack, product.moq);
}

function play(product, demand, snapshot, from, orderQtyValue) {
  let onHand = snapshot.on_hand;
  const pipe = snapshot.pipeline.map((p) => ({ ...p }));
  const arrival = from + product.lead + 1;
  if (orderQtyValue > 0) pipe.push({ at: arrival, qty: orderQtyValue });
  let shortfall = 0;
  let stockout = false;
  let onHandSum = 0;
  let steps = 0;
  for (let j = from; j < arrival && j < demand.length; j++) {
    onHand += pipe.filter((p) => p.at === j).reduce((s, p) => s + p.qty, 0);
    onHandSum += onHand;
    steps += 1;
    const sold = Math.min(onHand, demand[j]);
    if (demand[j] > sold) { shortfall += demand[j] - sold; stockout = true; }
    onHand -= sold;
  }
  const margin = product.price - product.cost;
  const leftover = Math.max(0, Math.round(onHand));
  return {
    order_units: orderQtyValue,
    stockout_before_delivery: stockout,
    shortfall_units: Math.round(shortfall),
    leftover_units: leftover,
    lost_margin: Math.round(shortfall * margin),
    holding_cost: Math.round((steps ? onHandSum / steps : onHand) * product.cost * 0.18 * Math.max(1, steps) / 52),
    cash: orderQtyValue * product.cost,
  };
}

function policyYear(product, demand, obs, flags, opening, kind, alpha) {
  let onHand = opening.on_hand;
  const pipe = opening.pipeline.map((p) => ({ ...p }));
  const sales = obs.slice(0, 104);
  const marks = flags.slice(0, 104);
  let demandSum = 0;
  let salesSum = 0;
  let onHandSum = 0;
  const start = HISTORY - 52;
  for (let j = start; j < HISTORY; j++) {
    onHand += pipe.filter((p) => p.at === j).reduce((s, p) => s + p.qty, 0);
    const ip = onHand + pipe.filter((p) => p.at > j).reduce((s, p) => s + p.qty, 0);
    let qty = 0;
    if (j >= product.launch) {
      if (kind === 'naive') {
        const avg = trailing(sales, marks, j, 4) ?? product.weekly * 0.5;
        qty = orderQty(avg * (product.lead + 3), onHand, ip - onHand, product);
      } else {
        const view = forecast(product, sales, marks, j, historyWeeks[j], 0);
        const cover = Math.min(HORIZON - 1, product.lead);
        qty = orderQty(view.cum_q[alpha][cover], onHand, ip - onHand, product);
      }
      if (qty > 0) pipe.push({ at: j + product.lead + 1, qty });
    }
    const sold = Math.min(onHand, demand[j]);
    if (demand[j] > sold) marks[j] = 1;
    onHand -= sold;
    sales[j] = j === product.gap ? null : sold;
    demandSum += demand[j];
    salesSum += sold;
    onHandSum += onHand;
  }
  const weeks = 52;
  const margin = product.price - product.cost;
  const avgOnHand = onHandSum / weeks;
  const lost = Math.round((demandSum - salesSum) * margin);
  const holding = Math.round(avgOnHand * product.cost * 0.18);
  return {
    fill_rate: demandSum > 0 ? Math.round((salesSum / demandSum) * 1000) / 1000 : 1,
    avg_on_hand_value: Math.round(avgOnHand * product.cost),
    lost_margin: lost,
    total_imbalance_cost: lost + holding,
  };
}

function explain(product, origin, originIndex, view, recentStockout) {
  const peakH = view.weekly.p50.reduce((best, n, h) => (n > view.weekly.p50[best] ? h : best), 0);
  const peak = view.weekly.p50[peakH];
  const recent = Math.max(1, Math.round(view.level));
  const relation = peak > recent * 1.15 ? 'above' : peak < recent * 0.85 ? 'below' : 'close to';
  const when = originIndex === HISTORY ? 'the latest week' : `the week of ${new Date(`${origin}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}`;
  const peakLabel = new Date(`${add(origin, peakH)}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const caution = product.archetype === 'new_launch'
    ? 'The sales history is still short, so the band stays wide.'
    : product.archetype === 'intermittent'
      ? 'Quiet weeks are normal for this line and are not a break in the trend.'
      : recentStockout
        ? 'A recent week sold through, so recorded sales understate what customers wanted.'
        : 'The band is the uncertainty around that outlook, read from how this line has varied in the store.';
  return `${product.name} is bought from ${product.firm} and held in Harrow & Vale stock. From ${when}, store sales point to a peak near ${peak} units in the week of ${peakLabel}, ${relation} recent sales of about ${recent} a week. ${caution} The next purchase order has to cover the ${product.lead}-week lead time from ${product.firm}.`;
}

const emptyImpact = () => ({ fill_rate: 0, avg_on_hand_value: 0, lost_margin: 0, total_imbalance_cost: 0 });
const catalogueImpact = { naive: emptyImpact(), model_90: emptyImpact(), model_95: emptyImpact(), model_99: emptyImpact() };

fs.rmSync(base, { recursive: true, force: true });
fs.mkdirSync(`${base}/sku`, { recursive: true });
fs.mkdirSync(`${base}/explanations`, { recursive: true });
const write = (path, data) => fs.writeFileSync(`${base}/${path}`, JSON.stringify(data));

const publicProducts = catalogue.map((product) => ({
  sku_id: product.sku_id,
  name: product.name,
  pack_label: product.pack,
  category: product.category,
  archetype: product.archetype,
  lead_time_weeks: product.lead,
  unit_cost: product.cost,
  unit_price: product.price,
  moq_units: product.moq,
  case_pack_units: product.casePack,
  holding_cost_pct_pa: 0.18,
  limited_history: product.archetype === 'new_launch',
}));

for (const product of catalogue) {
  const demand = trueDemand(product);
  const stock = simulateStockroom(product, demand);
  const blocks = origins.map((origin) => {
    const index = arrayIndex(origin);
    const snap = stock.snapshots[index];
    const base = forecast(product, stock.observed, stock.stockout, index, origin, 0);
    const depths = index === HISTORY ? [0, 10, 20, 30] : [0];
    const scenarios = Object.fromEntries(depths.map((depth) => [`promo_${depth}`, depth === 0 ? { weekly: base.weekly, cum_q: base.cum_q } : ((view) => ({ weekly: view.weekly, cum_q: view.cum_q }))(forecast(product, stock.observed, stock.stockout, index, origin, depth))]));
    const block = {
      origin,
      scenarios,
      baseline_p50: base.baseline,
      drivers: base.drivers,
      state: { on_hand: snap.on_hand, on_order: snap.on_order },
    };
    if (index < HISTORY) {
      const ipOrder = snap.on_order;
      const naiveTarget = (trailing(stock.observed, stock.stockout, index, 4) ?? product.weekly * 0.5) * (product.lead + 3);
      const cover = Math.min(HORIZON - 1, product.lead);
      const naiveQty = orderQty(naiveTarget, snap.on_hand, ipOrder, product);
      const modelQty = orderQty(base.cum_q['0.95'][cover], snap.on_hand, ipOrder, product);
      block.replay = {
        naive: play(product, demand, snap, index, naiveQty),
        model: play(product, demand, snap, index, modelQty),
      };
    }
    return { block, base };
  });
  const opening = stock.snapshots[HISTORY - 52];
  const impact = {
    naive: policyYear(product, demand, stock.observed, stock.stockout, opening, 'naive', '0.95'),
    model_90: policyYear(product, demand, stock.observed, stock.stockout, opening, 'model', '0.90'),
    model_95: policyYear(product, demand, stock.observed, stock.stockout, opening, 'model', '0.95'),
    model_99: policyYear(product, demand, stock.observed, stock.stockout, opening, 'model', '0.99'),
  };
  for (const key of Object.keys(catalogueImpact)) {
    catalogueImpact[key].fill_rate += impact[key].fill_rate;
    catalogueImpact[key].avg_on_hand_value += impact[key].avg_on_hand_value;
    catalogueImpact[key].lost_margin += impact[key].lost_margin;
    catalogueImpact[key].total_imbalance_cost += impact[key].total_imbalance_cost;
  }
  const recentStockout = stock.stockout.slice(-8).some(Boolean);
  write(`sku/${product.sku_id}.json`, {
    sku_id: product.sku_id,
    history: {
      week_start: historyWeeks,
      units_sold: stock.observed,
      stockout_flag: stock.stockout,
      promo_depth_pct: historyWeeks.map((_, j) => (promoSlot(product, j) ? 20 : 0)),
    },
    backtest_actuals: {
      week_start: historyWeeks.slice(-52),
      true_demand: demand.slice(-52),
    },
    origins: blocks.map((entry) => entry.block),
    impact,
  });
  write(`explanations/${product.sku_id}.json`, {
    sku_id: product.sku_id,
    meta: { model: 'store-history mock', prompt_version: 'retail-1', generated_at: '2026-10-03' },
    by_origin: Object.fromEntries(origins.map((origin, i) => [origin, explain(product, origin, arrayIndex(origin), blocks[i].base, recentStockout)])),
  });
}
for (const key of Object.keys(catalogueImpact)) catalogueImpact[key].fill_rate = Math.round((catalogueImpact[key].fill_rate / catalogue.length) * 1000) / 1000;

write('manifest.json', {
  schema_version: '1.0.0',
  data_version: 'mock-2026.10-harrow-retail',
  generated_at: '2026-10-03',
  source: 'mock',
  origins,
  history_through: historyThrough,
  default_view: { sku_id: 'sku_01', horizon_weeks: 13, service_level: 0.95 },
  files: {},
});
write('products.json', { categories, products: publicProducts });
write('calendar.json', { events });
write('backtest_summary.json', { basis: { weeks: 52, skus: catalogue.length }, impact: catalogueImpact, frontier: [], metrics: {} });

console.log(`Generated ${catalogue.length} supplied lines for Harrow & Vale`);
