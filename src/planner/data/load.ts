import type { Manifest, ProductsFile, SkuFile, CalendarFile, BacktestSummary } from './types';
const cache = new Map<string, Promise<unknown>>();
export function loadJson<T>(url: string, retry = false): Promise<T> {
  if (retry) cache.delete(url);
  if (!cache.has(url)) cache.set(url, fetch(url).then(response => { if (!response.ok) throw new Error(`Unable to load ${url}`); return response.json(); }).catch(error => { cache.delete(url); throw error; }));
  return cache.get(url) as Promise<T>;
}
export async function loadShell(base: string) {
  const manifest = await loadJson<Manifest>(`${base}manifest.json`);
  if (manifest.schema_version.split('.')[0] !== '1') throw new Error("This demo's data is out of date. Please refresh the page.");
  const [products, calendar, backtest] = await Promise.all([loadJson<ProductsFile>(`${base}products.json`), loadJson<CalendarFile>(`${base}calendar.json`), loadJson<BacktestSummary>(`${base}backtest_summary.json`)]);
  return { manifest, products, calendar, backtest };
}
export const loadProduct = (base: string, id: string, retry = false) => Promise.all([loadJson<SkuFile>(`${base}sku/${id}.json`, retry), loadJson<{by_origin: Record<string, string>}>(`${base}explanations/${id}.json`, retry)]);
