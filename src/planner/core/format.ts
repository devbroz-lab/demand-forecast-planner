export const units = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n));
export const money = (n: number) => '₹' + units(n);
export const shortMoney = (n: number) => n >= 10000000 ? `₹${(n / 10000000).toFixed(1)} Cr` : n >= 100000 ? `₹${(n / 100000).toFixed(1)} L` : money(n);
export const date = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const addWeeks = (iso: string, weeks: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + weeks * 7); return d.toISOString().slice(0, 10); };
export const riskLabel = (r: {value: number; bound: 'below' | 'above' | null}) => r.bound === 'below' ? '<1%' : r.bound === 'above' ? '>95%' : `${Math.round(r.value * 100)}%`;
