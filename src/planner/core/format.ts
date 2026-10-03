export const units = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n));
export const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(n));
export const shortMoney = (n: number) => {
  const sign = n < 0 ? '-' : '';
  const value = Math.abs(n);
  if (value >= 1_000_000) return `${sign}$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${sign}$${(value / 1_000).toFixed(1)}K`;
  return (n < 0 ? '-' : '') + money(value);
};
export const date = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const addWeeks = (iso: string, weeks: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + weeks * 7); return d.toISOString().slice(0, 10); };
export const riskLabel = (r: {value: number; bound: 'below' | 'above' | null}) => r.bound === 'below' ? '<1%' : r.bound === 'above' ? '>95%' : `${Math.round(r.value * 100)}%`;
