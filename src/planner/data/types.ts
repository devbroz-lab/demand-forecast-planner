import type { QuantileTable } from '../core/reorder';
export interface ImpactFigures { fill_rate: number; avg_on_hand_value: number; lost_margin: number; total_imbalance_cost: number }
export interface ReplaySide { order_units: number; stockout_before_delivery: boolean; shortfall_units: number; leftover_units: number; lost_margin: number; holding_cost: number; cash: number }
export interface Product { sku_id: string; name: string; category: string; archetype: string; pack_label: string; lead_time_weeks: number; moq_units: number; case_pack_units: number; unit_cost: number; unit_price: number; holding_cost_pct_pa: number; limited_history?: boolean }
export interface Manifest { schema_version: string; data_version: string; source: 'mock' | 'pipeline'; origins: string[]; history_through: string; default_view: { sku_id: string; horizon_weeks: 4 | 8 | 13 | 26; service_level: 0.9 | 0.95 | 0.99 } }
export interface ProductsFile { categories: { id: string; name: string }[]; products: Product[] }
export interface Forecast { weekly: { p10: number[]; p50: number[]; p90: number[] }; cum_q: QuantileTable }
export interface Origin { origin: string; scenarios: Record<string, Forecast>; baseline_p50: number[]; drivers: Record<string, number>; state: { on_hand: number; on_order: number }; replay?: { naive: ReplaySide; model: ReplaySide } }
export interface SkuFile { sku_id: string; history: { week_start: string[]; units_sold: (number | null)[]; stockout_flag: number[]; promo_depth_pct: number[] }; backtest_actuals: { week_start: string[]; true_demand: number[] }; origins: Origin[]; impact: Record<string, ImpactFigures> }
export interface BacktestSummary { basis: { weeks: number; skus: number }; impact: SkuFile['impact'] }
export interface CalendarFile { events: { week_start: string; name: string; type: string }[] }
