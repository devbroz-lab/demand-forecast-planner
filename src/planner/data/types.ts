import type { QuantileTable } from '../core/reorder';
export interface Product { sku_id: string; name: string; category: string; archetype: string; pack_label: string; lead_time_weeks: number; moq_units: number; case_pack_units: number; unit_cost_inr: number; unit_price_inr: number; holding_cost_pct_pa: number; limited_history?: boolean }
export interface Manifest { schema_version: string; data_version: string; source: 'mock' | 'pipeline'; origins: string[]; default_view: { sku_id: string; horizon_weeks: 4 | 8 | 13 | 26; service_level: 0.9 | 0.95 | 0.99 } }
export interface ProductsFile { categories: { id: string; name: string }[]; products: Product[] }
export interface Forecast { weekly: { p10: number[]; p50: number[]; p90: number[] }; cum_q: QuantileTable }
export interface Origin { origin: string; scenarios: Record<string, Forecast>; baseline_p50: number[]; drivers: Record<string, number>; state: { on_hand: number; on_order: number } }
export interface SkuFile { sku_id: string; history: { week_start: string[]; units_sold: (number | null)[]; stockout_flag: number[]; promo_depth_pct: number[] }; backtest_actuals: { week_start: string[]; true_demand: number[] }; origins: Origin[]; impact: Record<string, { fill_rate: number; avg_on_hand_value_inr: number; lost_margin_inr: number; total_imbalance_cost_inr: number }> }
export interface BacktestSummary { basis: { weeks: number; skus: number }; impact: SkuFile['impact'] }
export interface CalendarFile { events: { week_start: string; name: string; type: string }[] }
