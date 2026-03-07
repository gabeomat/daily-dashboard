export function fmt(n: number, prefix = "$") {
  return prefix + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function fmtD(n: number, prefix = "$") {
  return prefix + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function shortDate(d: string) {
  const p = d.split("-");
  return parseInt(p[1]) + "/" + parseInt(p[2]);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function enrichAd(d: { ad_spend: number | null; t18: number | null; t47: number | null; t333: number | null }) {
  const spend = d.ad_spend || 0;
  const t18 = d.t18 || 0;
  const t47 = d.t47 || 0;
  const t333 = d.t333 || 0;
  const revenue = t18 * 18 + t47 * 47 + t333 * 333;
  const conversions = t18 + t47 + t333;
  return { spend, t18, t47, t333, revenue, conversions };
}

export function buildWeekly(data: Array<{ date: string; ad_spend: number | null; t18: number | null; t47: number | null; t333: number | null }>) {
  const weeks: Record<string, { week: string; spend: number; revenue: number; conversions: number; t18: number; t47: number; t333: number }> = {};
  data.forEach((d) => {
    const dt = new Date(d.date + "T12:00:00");
    const jan1 = new Date(dt.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((dt.getTime() - jan1.getTime()) / 86400000);
    const wk = Math.ceil((dayOfYear + jan1.getDay() + 1) / 7);
    const key = dt.getFullYear() + "-W" + String(wk).padStart(2, "0");
    if (!weeks[key]) weeks[key] = { week: key, spend: 0, revenue: 0, conversions: 0, t18: 0, t47: 0, t333: 0 };
    const e = enrichAd(d);
    const w = weeks[key];
    w.spend += e.spend;
    w.revenue += e.revenue;
    w.conversions += e.conversions;
    w.t18 += e.t18;
    w.t47 += e.t47;
    w.t333 += e.t333;
  });
  return Object.values(weeks)
    .map((w) => ({
      ...w,
      spend: Math.round(w.spend * 100) / 100,
      roas: w.spend > 0 ? Math.round((w.revenue / w.spend) * 100) / 100 : 0,
      cac: w.conversions > 0 ? Math.round((w.spend / w.conversions) * 100) / 100 : 0,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}
