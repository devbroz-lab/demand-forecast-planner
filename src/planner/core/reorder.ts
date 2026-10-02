export type QuantileKey = '0.05' | '0.10' | '0.25' | '0.50' | '0.75' | '0.90' | '0.95' | '0.99';
export type QuantileTable = Record<QuantileKey, number[]>;
export const probabilities: QuantileKey[] = ['0.05', '0.10', '0.25', '0.50', '0.75', '0.90', '0.95', '0.99'];
export interface ReorderInput { cumQ: QuantileTable; leadTimeWeeks: number; reviewWeeks: 1; serviceLevel: 0.9 | 0.95 | 0.99; onHand: number; onOrder: number; casePack: number; moq: number; unitCostInr: number; roundMoqToCases?: boolean }
export interface Probability { value: number; bound: 'below' | 'above' | null }
export interface ReorderResult { orderUpTo: number; safetyStock: number; orderQty: number; cashInr: number; leadTimeRisk: Probability; coverRisk: Probability; expectedLeft: number; orderBy: { kind: 'now' } | { kind: 'week'; weeksFromOrigin: number } | { kind: 'not-needed'; withinWeeks: number } }
export function normalise(table: QuantileTable): QuantileTable {
  const result = {} as QuantileTable;
  for (const key of probabilities) result[key] = table[key].map((value, i) => Math.max(0, value, i > 0 ? result[key][i - 1] : 0));
  for (let h = 0; h < result['0.50'].length; h++) for (let p = 1; p < probabilities.length; p++) result[probabilities[p]][h] = Math.max(result[probabilities[p]][h], result[probabilities[p - 1]][h]);
  return result;
}
export function quantile(table: QuantileTable, weeks: number, probability: number): number {
  if (weeks <= 0) return 0;
  const h = Math.min(Math.max(1, weeks), table['0.50'].length) - 1;
  const index = probabilities.findIndex(p => Number(p) >= probability);
  if (index <= 0) return table[probabilities[0]][h];
  if (index < 0) return table[probabilities[probabilities.length - 1]][h];
  const low = probabilities[index - 1], high = probabilities[index];
  return table[low][h] + (table[high][h] - table[low][h]) * (probability - Number(low)) / (Number(high) - Number(low));
}
export function risk(table: QuantileTable, weeks: number, stock: number): Probability {
  if (weeks <= 0) return { value: 0, bound: 'below' };
  const points = probabilities.map(p => ({ p: Number(p), value: quantile(table, weeks, Number(p)) }));
  let index = -1;
  for (let i = 0; i < points.length; i++) if (points[i].value <= stock) index = i;
  if (index < 0) return { value: 0.95, bound: 'above' };
  if (index === points.length - 1) return { value: 0.01, bound: 'below' };
  const a = points[index], b = points[index + 1];
  const cdf = a.p + (b.value === a.value ? 0 : (stock - a.value) / (b.value - a.value) * (b.p - a.p));
  return { value: 1 - cdf, bound: null };
}
export function recommendOrder(input: ReorderInput): ReorderResult {
  const table = normalise(input.cumQ);
  const position = Math.max(0, input.onHand + input.onOrder);
  const weeks = Math.min(table['0.50'].length, input.leadTimeWeeks + input.reviewWeeks);
  const orderUpTo = Math.round(quantile(table, weeks, input.serviceLevel));
  const safetyStock = Math.max(0, Math.round(orderUpTo - quantile(table, weeks, 0.5)));
  const raw = Math.max(0, orderUpTo - position);
  const pack = Math.max(1, input.casePack);
  let orderQty = raw > 0 ? Math.ceil(raw / pack) * pack : 0;
  if (raw > 0 && orderQty < input.moq) orderQty = input.roundMoqToCases === false ? input.moq : Math.ceil(input.moq / pack) * pack;
  let orderBy: ReorderResult['orderBy'] = { kind: 'now' };
  const maxT = Math.max(0, table['0.50'].length - input.leadTimeWeeks);
  for (let t = 0; t <= maxT; t++) {
    if (position - quantile(table, t + input.leadTimeWeeks, 0.5) >= safetyStock) orderBy = t === maxT ? { kind: 'not-needed', withinWeeks: maxT } : { kind: 'week', weeksFromOrigin: t };
    else break;
  }
  return { orderUpTo, safetyStock, orderQty, cashInr: orderQty * input.unitCostInr, leadTimeRisk: risk(table, input.leadTimeWeeks, position), coverRisk: risk(table, weeks, position + orderQty), expectedLeft: Math.round(position + orderQty - quantile(table, weeks, 0.5)), orderBy };
}
