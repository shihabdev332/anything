import { createElement, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Crown,
  Download,
  PackageX,
  Printer,
  RefreshCw,
  ShoppingBag,
  Settings2,
  Save,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import axios from "axios";
import { serverUrl } from "../../config";
import { getOwnerPreferences, saveOwnerPreferences } from "./ownerPreferences";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "6m", label: "6 months" },
  { value: "12m", label: "12 months" },
  { value: "custom", label: "Custom dates" },
];

const panelClass = "rounded-2xl border border-[#243451] bg-[#10182B] shadow-[0_14px_45px_rgba(0,0,0,0.12)]";
const formatMoney = (value) => Number(value || 0).toLocaleString("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const formatCount = (value) => Number(value || 0).toLocaleString("en-US");
const toMonthInput = (date = new Date()) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

const displayBucket = (value) => {
  if (!value) return "";
  const date = new Date(value.length === 7 ? `${value}-01T00:00:00Z` : `${value}T00:00:00Z`);
  return date.toLocaleDateString("en-US", value.length === 7
    ? { month: "short", year: "2-digit", timeZone: "UTC" }
    : { month: "short", day: "numeric", timeZone: "UTC" });
};

const useOwnerAnalytics = (token, range = "30d", month = toMonthInput(), customFrom = "", customTo = "", refreshMinutes = getOwnerPreferences().refreshMinutes) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setAnalytics(null);
    if (range === "custom" && (!customFrom || !customTo)) {
      setLoading(false);
      setError("");
      return () => controller.abort();
    }
    setLoading(true);
    setError("");
    axios.get(`${serverUrl}/api/owner/analytics`, {
      headers: { Authorization: `Bearer ${token}`, "Cache-Control": "no-cache" },
      params: { range, month, ...(range === "custom" ? { from: customFrom, to: customTo } : {}) },
      signal: controller.signal,
      timeout: 15000,
    })
      .then(({ data }) => {
        if (!data?.success || !data.analytics) throw new Error(data?.message || "Could not load owner analytics");
        setAnalytics(data.analytics);
      })
      .catch((requestError) => {
        if (requestError.name === "CanceledError" || requestError.code === "ERR_CANCELED") return;
        setError(requestError.response?.data?.message || requestError.message || "Could not load owner analytics");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [token, range, month, customFrom, customTo, attempt]);

  useEffect(() => {
    if (!refreshMinutes) return undefined;
    const refreshTimer = window.setInterval(() => setAttempt((value) => value + 1), refreshMinutes * 60_000);
    return () => window.clearInterval(refreshTimer);
  }, [refreshMinutes]);

  return { analytics, loading, error, retry: () => setAttempt((value) => value + 1) };
};

const Sparkline = ({ values = [], color = "#8B5CF6" }) => {
  const points = values.map((value, index) => {
    const max = Math.max(1, ...values);
    const min = Math.min(0, ...values);
    const x = values.length < 2 ? 50 : 2 + (index / (values.length - 1)) * 96;
    const y = 25 - ((Number(value || 0) - min) / (max - min || 1)) * 21;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true" className="h-7 w-20 overflow-visible">
      <polyline points={points || "0,23 100,23"} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const ChangeBadge = ({ current, previous, lowerIsBetter = false }) => {
  if (previous === null || previous === undefined || !Number.isFinite(Number(previous))) {
    return <span className="text-[11px] font-medium text-[#9AAAC4]">No comparison data</span>;
  }
  const currentValue = Number(current || 0);
  const previousValue = Number(previous || 0);
  if (previousValue === 0) {
    return currentValue === 0
      ? <span className="text-[11px] font-medium text-[#9AAAC4]">No prior activity</span>
      : <span className="inline-flex items-center gap-1 rounded-full bg-[#34D399]/10 px-2 py-1 text-[11px] font-semibold text-[#34D399]"><Sparkles size={12} /> New activity</span>;
  }
  const delta = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  const positive = lowerIsBetter ? delta <= 0 : delta >= 0;
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${positive ? "bg-[#34D399]/10 text-[#34D399]" : "bg-rose-400/10 text-rose-300"}`}>
      {Icon ? <Icon size={12} /> : null}{Math.abs(delta).toFixed(1)}%
    </span>
  );
};

const MetricCard = ({ title, value, previous, detail, icon: Icon, sparkline, money = false, formatValue, loading, lowerIsBetter = false, tooltip }) => (
  <article title={tooltip} className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#243451] bg-[#10182B] p-4 transition duration-200 hover:border-[#9675FF]/50 hover:bg-[#18213A] sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-[#9AAAC4] sm:text-sm">{title}</p>
        {loading ? <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-[#243451]/50" /> : (
          <p className="mt-3 truncate text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-[1.7rem]">
            {value === null || value === undefined ? "—" : formatValue ? formatValue(value) : money ? formatMoney(value) : formatCount(value)}
          </p>
        )}
      </div>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#6D4AFF]/15 text-[#9675FF]">{createElement(Icon, { size: 18 })}</span>
    </div>
    <div className="mt-4 flex min-h-7 items-end justify-between gap-2">
      {loading ? <div className="h-5 w-24 animate-pulse rounded bg-[#243451]/60" /> : (
        <div className="min-w-0">
          <ChangeBadge current={value} previous={previous} lowerIsBetter={lowerIsBetter} />
          {detail && <p className="mt-1 truncate text-[10px] leading-4 text-[#9AAAC4] sm:text-[11px]">{detail}</p>}
        </div>
      )}
      {!loading && sparkline?.length > 1 && <Sparkline values={sparkline} color={title === "Orders" ? "#22D3EE" : "#8B5CF6"} />}
    </div>
  </article>
);

const LoadingPanel = ({ lines = 4 }) => (
  <div className={`${panelClass} animate-pulse p-5`}>
    <div className="h-5 w-40 rounded bg-[#243451]/50" />
    <div className="mt-5 space-y-3">{Array.from({ length: lines }, (_, index) => <div key={index} className="h-9 rounded-lg bg-[#243451]/50" />)}</div>
  </div>
);

const ErrorPanel = ({ message, retry }) => (
  <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.07] p-5 text-rose-100">
    <p className="text-sm font-semibold">Analytics could not be loaded</p>
    <p className="mt-1 text-xs text-rose-200/80">{message}</p>
    <button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-200/20 px-3 py-2 text-xs font-semibold transition hover:bg-rose-200/10"><RefreshCw size={13} /> Try again</button>
  </div>
);

const SectionHeading = ({ eyebrow, title, detail, action }) => (
  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9675FF]">{eyebrow}</p>}
      <h2 className="mt-1 text-lg font-bold tracking-tight text-[#F8FAFC] sm:text-xl">{title}</h2>
      {detail && <p className="mt-1 text-xs leading-5 text-[#9AAAC4] sm:text-sm">{detail}</p>}
    </div>
    {action}
  </div>
);

const makeSeries = (analytics, range, key) => {
  if (!analytics) return [];
  const now = new Date(analytics.generatedAt);
  const byBucket = new Map((analytics.series || []).map((point) => [point.bucket, point]));
  const customStart = range === "custom" ? new Date(analytics.period.start) : null;
  const customEnd = range === "custom" ? new Date(analytics.period.end) : null;
  const monthly = range === "6m" || range === "12m"
    || (range === "custom" && customEnd.getTime() - customStart.getTime() > 31 * 24 * 60 * 60 * 1000);
  if (range === "custom") {
    const first = monthly
      ? new Date(Date.UTC(customStart.getUTCFullYear(), customStart.getUTCMonth(), 1))
      : new Date(Date.UTC(customStart.getUTCFullYear(), customStart.getUTCMonth(), customStart.getUTCDate()));
    const lastDate = new Date(customEnd.getTime() - 1);
    const last = monthly
      ? new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), 1))
      : new Date(Date.UTC(lastDate.getUTCFullYear(), lastDate.getUTCMonth(), lastDate.getUTCDate()));
    const buckets = [];
    for (const date = new Date(first); date <= last; date.setUTCMonth(monthly ? date.getUTCMonth() + 1 : date.getUTCMonth()), date.setUTCDate(monthly ? 1 : date.getUTCDate() + 1)) {
      buckets.push(monthly ? date.toISOString().slice(0, 7) : date.toISOString().slice(0, 10));
    }
    return buckets.map((bucket) => ({
      bucket,
      label: displayBucket(bucket),
      value: Number(byBucket.get(bucket)?.[key] || 0),
      orders: Number(byBucket.get(bucket)?.orders || 0),
    }));
  }
  const count = range === "7d" ? 7 : range === "30d" ? 30 : range === "6m" ? 6 : 12;
  const buckets = Array.from({ length: count }, (_, index) => {
    if (monthly) {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count + 1 + index, 1));
      return date.toISOString().slice(0, 7);
    }
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - count + 1 + index));
    return date.toISOString().slice(0, 10);
  });
  return buckets.map((bucket) => ({
    bucket,
    label: displayBucket(bucket),
    value: Number(byBucket.get(bucket)?.[key] || 0),
    orders: Number(byBucket.get(bucket)?.orders || 0),
  }));
};

const TrendChart = ({ data, title, money }) => {
  if (!data.length) {
    return <div className="grid min-h-60 place-items-center text-center text-sm text-[#9AAAC4]">No order activity in this date range.</div>;
  }
  const chartWidth = 760;
  const chartHeight = 230;
  const left = 42;
  const right = chartWidth - 16;
  const top = 18;
  const bottom = chartHeight - 36;
  const maxValue = Math.max(1, ...data.map(({ value }) => value));
  const points = data.map(({ value }, index) => {
    const x = data.length === 1 ? (left + right) / 2 : left + ((right - left) * index) / (data.length - 1);
    const y = bottom - (value / maxValue) * (bottom - top);
    return { x, y, value };
  });
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const areaPoints = `${left},${bottom} ${linePoints} ${right},${bottom}`;
  const labelIndexes = [...new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])];
  const seriesColor = money ? "#8B5CF6" : "#22D3EE";

  return (
    <div className="w-full overflow-hidden">
      <svg role="img" aria-label={title} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-56 w-full overflow-visible sm:h-64">
        <defs>
          <linearGradient id="owner-chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={seriesColor} stopOpacity="0.28" /><stop offset="100%" stopColor={seriesColor} stopOpacity="0" /></linearGradient>
        </defs>
        {[0, 1, 2, 3].map((step) => {
          const y = top + ((bottom - top) * step) / 3;
          return <line key={step} x1={left} y1={y} x2={right} y2={y} stroke="#243451" strokeDasharray="3 6" strokeOpacity="0.9" />;
        })}
        <polygon points={areaPoints} fill="url(#owner-chart-fill)" />
        <polyline points={linePoints} fill="none" stroke={seriesColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map(({ x, y, value }, index) => (
          <circle key={data[index].bucket} cx={x} cy={y} r="4" fill="#080B18" stroke={seriesColor} strokeWidth="2">
            <title>{`${data[index].label}: ${money ? formatMoney(value) : `${formatCount(value)} orders`}`}</title>
          </circle>
        ))}
        {labelIndexes.map((index) => (
          <text key={data[index].bucket} x={points[index].x} y={chartHeight - 8} textAnchor={index === 0 ? "start" : index === data.length - 1 ? "end" : "middle"} fill="#9AAAC4" fontSize="11">{data[index].label}</text>
        ))}
      </svg>
    </div>
  );
};

const SmallBarList = ({ items, labelKey, valueKey, money = true, empty = "No records for this period." }) => {
  if (!items?.length) return <p className="py-6 text-center text-xs text-[#9AAAC4]">{empty}</p>;
  const maximum = Math.max(1, ...items.map((item) => Number(item[valueKey] || 0)));
  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        const label = item[labelKey] || "Unknown";
        return (
          <div key={`${label}-${index}`}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate font-medium text-[#9AAAC4]">{label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-[#F8FAFC]">{money ? formatMoney(value) : formatCount(value)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#243451]/50">
              <div className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE]" style={{ width: `${Math.max(value > 0 ? 2 : 0, (value / maximum) * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CategoryPerformance = ({ categories = [], loading }) => {
  const palette = ["#8B5CF6", "#22D3EE", "#34D399", "#FBBF24", "#9675FF", "#38BDF8", "#A78BFA", "#4ADE80"];
  const total = categories.reduce((sum, item) => sum + Number(item.currentSales || 0), 0);
  const stops = [];
  let cursor = 0;
  categories.forEach((item, index) => {
    const share = total ? (Number(item.currentSales || 0) / total) * 100 : 0;
    if (share <= 0) return;
    stops.push(`${palette[index % palette.length]} ${cursor}% ${cursor + share}%`);
    cursor += share;
  });

  if (loading) return <div className="mt-5 grid gap-5 sm:grid-cols-[170px_1fr]"><div className="mx-auto h-40 w-40 animate-pulse rounded-full bg-[#243451]/50" /><div className="space-y-3">{[1, 2, 3, 4].map((key) => <div key={key} className="h-8 animate-pulse rounded-lg bg-[#243451]/40" />)}</div></div>;
  if (!categories.length) return <p className="py-8 text-center text-xs text-[#9AAAC4]">Category performance will appear after products in those categories are ordered.</p>;

  return (
    <div className="mt-5 grid gap-6 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center">
      <div className="relative mx-auto grid h-40 w-40 place-items-center rounded-full" style={{ background: stops.length ? `conic-gradient(${stops.join(", ")})` : "#243451" }} role="img" aria-label={`${categories.length} product categories by order value`}>
        <div className="grid h-28 w-28 content-center justify-items-center rounded-full border border-[#243451] bg-[#10182B]">
          <span className="text-[10px] text-[#9AAAC4]">Category sales</span>
          <strong className="mt-1 max-w-24 truncate text-sm text-[#F8FAFC]">{formatMoney(total)}</strong>
          <span className="mt-0.5 text-[10px] text-[#9AAAC4]">{categories.length} categories</span>
        </div>
      </div>
      <div className="space-y-1">
        {categories.map((item, index) => {
          const sales = Number(item.currentSales || 0);
          const share = total ? (sales / total) * 100 : 0;
          const change = Number(item.previousSales || 0) > 0 ? ((sales - Number(item.previousSales)) / Number(item.previousSales)) * 100 : null;
          return <div key={item.category} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-xl px-3 py-2 transition hover:bg-[#243451]/30">
            <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#F8FAFC]"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: palette[index % palette.length] }} /><span className="truncate">{item.category}</span><span className="text-[10px] font-normal text-[#9AAAC4]">{share.toFixed(0)}%</span></span>
            <strong className="text-right text-xs tabular-nums text-[#F8FAFC]">{formatMoney(sales)}</strong>
            <span className="col-start-1 pl-[18px] text-[10px] text-[#9AAAC4]">{formatCount(item.units)} units · {formatCount(item.orders)} orders</span>
            <span className={`row-start-2 text-right text-[10px] font-semibold tabular-nums ${change === null ? "text-[#9AAAC4]" : change >= 0 ? "text-[#34D399]" : "text-rose-300"}`}>{change === null ? "New" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}</span>
          </div>;
        })}
      </div>
    </div>
  );
};

const SellerRankCard = ({ seller, index }) => (
  <article className="flex min-w-0 items-start gap-3 rounded-xl border border-[#243451] bg-[#10182B] p-4">
    {seller.avatar
      ? <img src={seller.avatar} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" loading="lazy" />
      : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#34D399]/10 text-sm font-bold text-[#34D399]">{(seller.name || "S").slice(0, 1).toUpperCase()}</span>}
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-[#F8FAFC]">{seller.name || "Unnamed seller"}</p>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FBBF24]/10 px-2 py-1 text-[10px] font-bold text-[#FBBF24]">{index === 0 && <Crown size={11} />} #{index + 1}</span>
      </div>
      <p className="mt-1 truncate text-[11px] text-[#9AAAC4]">{seller.email}</p>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#9AAAC4]">
        <span>{formatMoney(seller.sales)} order value</span><span>{formatCount(seller.orderCount)} orders</span><span>{formatCount(seller.productCount)} products</span>
      </div>
    </div>
  </article>
);

const StatusList = ({ statuses }) => {
  if (!statuses?.length) return <p className="py-6 text-center text-xs text-[#9AAAC4]">No order records yet.</p>;
  const total = statuses.reduce((sum, item) => sum + Number(item.orders || 0), 0) || 1;
  const colors = { Delivered: "bg-[#34D399]", Shipped: "bg-[#FBBF24]", Processing: "bg-[#34D399]", "Order Placed": "bg-[#22D3EE]", Pending: "bg-[#FBBF24]", Cancelled: "bg-rose-400" };
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-[#243451]/50">
        {statuses.map((item) => <span key={item.status} className={colors[item.status] || "bg-[#9AAAC4]"} style={{ width: `${(item.orders / total) * 100}%` }} title={`${item.status}: ${item.orders}`} />)}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {statuses.map((item) => (
          <div key={item.status} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-[#9AAAC4]"><i className={`h-2 w-2 shrink-0 rounded-full ${colors[item.status] || "bg-[#9AAAC4]"}`} />{item.status}</span>
            <span className="font-semibold tabular-nums text-[#F8FAFC]">{formatCount(item.orders)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ActivityList = ({ activity }) => {
  if (!activity?.length) return <p className="py-6 text-center text-xs text-[#9AAAC4]">New orders and customer registrations will show here.</p>;
  return (
    <div className="divide-y divide-[#243451]/70">
      {activity.map((event) => {
        const href = event.type === "order" ? `/owner/orders?search=${encodeURIComponent(event.id)}` : "/owner/customers";
        return <Link to={href} key={`${event.type}-${event.id}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 hover:bg-[#243451]/35">
          <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${event.type === "order" ? "bg-[#34D399]/10 text-[#34D399]" : "bg-[#FBBF24]/10 text-[#FBBF24]"}`}>
            {event.type === "order" ? <ShoppingBag size={15} /> : <Users size={15} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#F8FAFC]">{event.title}</p>
            <p className="mt-1 truncate text-[11px] text-[#9AAAC4]">{event.detail}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-medium text-[#9AAAC4]">{event.status}</p>
            <time className="mt-1 block text-[10px] text-[#9AAAC4]" dateTime={event.createdAt}>{new Date(event.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time>
          </div>
        </Link>;
      })}
    </div>
  );
};

const OwnerOverview = ({ user, token }) => {
  const [range, setRange] = useState(() => getOwnerPreferences().defaultRange);
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [customFrom, setCustomFrom] = useState(thirtyDaysAgo);
  const [customTo, setCustomTo] = useState(today);
  const { analytics, loading, error, retry } = useOwnerAnalytics(token, range, toMonthInput(), customFrom, customTo);
  const [chartMetric, setChartMetric] = useState("orderValue");
  const series = useMemo(() => makeSeries(analytics, range, chartMetric), [analytics, range, chartMetric]);
  const kpis = analytics?.kpis;
  const rate = kpis?.currentOrders ? kpis.currentCancelledOrders / kpis.currentOrders : 0;
  const previousRate = kpis?.previousOrders ? kpis.previousCancelledOrders / kpis.previousOrders : 0;
  const newCustomerNote = analytics?.signupTracking?.legacyAccountsWithoutDate
    ? `${formatCount(analytics.signupTracking.legacyAccountsWithoutDate)} older accounts have no recorded sign-up date`
    : "Recorded sign-ups this month";
  const cards = [
    { title: "Order value", value: kpis?.currentOrderValue, previous: kpis?.previousOrderValue, detail: `Compared with previous ${range}`, icon: CircleDollarSign, money: true, sparkline: (analytics?.series || []).map((point) => point.orderValue), tooltip: "Value of non-cancelled order lines. Orders use cash on delivery, so this is not collected payment revenue." },
    { title: "Orders", value: kpis?.currentOrders, previous: kpis?.previousOrders, detail: `Compared with previous ${range}`, icon: ClipboardList, sparkline: (analytics?.series || []).map((point) => point.orders), tooltip: "Order count includes cancellations for the selected period." },
    { title: "Average order value", value: kpis?.currentAverageOrderValue, previous: kpis?.previousAverageOrderValue, detail: "Non-cancelled orders only", icon: ShoppingBag, money: true, tooltip: "Non-cancelled order-line value divided by non-cancelled order count." },
    { title: "Completed orders", value: kpis?.currentCompletedOrders, previous: kpis?.previousCompletedOrders, detail: "Status: Delivered", icon: CheckCircle2, tooltip: "Orders marked Delivered in the order records." },
    { title: "All-time order value", value: kpis?.totalOrderValue, detail: "Non-cancelled line items · COD", icon: CircleDollarSign, money: true, tooltip: "Booked order value, not confirmed collected revenue." },
    { title: "All-time orders", value: kpis?.totalOrders, detail: `${formatCount(kpis?.cancelledOrders)} cancelled`, icon: ClipboardList, tooltip: "All order records in the database." },
    { title: "Customers", value: kpis?.totalCustomers, detail: "Customer accounts", icon: Users },
    { title: "New customers this month", value: kpis?.newCustomersThisMonth, detail: newCustomerNote, icon: Sparkles, tooltip: "Counts customer accounts with a recorded createdAt timestamp. Older accounts may not have registration dates." },
    { title: "Sellers", value: kpis?.totalSellers, detail: "Seller accounts", icon: Store },
    { title: "Products", value: kpis?.totalProducts, detail: `${formatCount(kpis?.availableProducts)} listed as available`, icon: Boxes },
    { title: "Cancellation rate", value: rate, previous: previousRate, formatValue: (value) => `${(Number(value) * 100).toFixed(1)}%`, detail: "Orders cancelled in selected period", icon: TrendingDown, lowerIsBetter: true, tooltip: "Cancelled parent orders divided by all orders in each period." },
  ];
  const rangeLabel = range === "custom" ? `${customFrom} to ${customTo}` : RANGE_OPTIONS.find((option) => option.value === range)?.label.toLowerCase();
  const currentValue = chartMetric === "orderValue" ? kpis?.currentOrderValue : kpis?.currentOrders;
  const priorValue = chartMetric === "orderValue" ? kpis?.previousOrderValue : kpis?.previousOrders;
  const growth = Number(kpis?.previousOrderValue) > 0 ? ((Number(kpis?.currentOrderValue || 0) - Number(kpis.previousOrderValue)) / Number(kpis.previousOrderValue)) * 100 : null;
  const chartGrowth = Number(priorValue) > 0 ? ((Number(currentValue || 0) - Number(priorValue)) / Number(priorValue)) * 100 : null;

  return (
    <div className="space-y-6 text-[#F8FAFC] sm:space-y-8">
      <section className="relative isolate overflow-hidden rounded-2xl border border-[#243451] bg-gradient-to-br from-[#10182B] via-[#0B1020] to-[#080B18] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:p-7 lg:p-8">
        <div className="absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-[#6D4AFF]/[0.12] blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[25%] -z-10 h-52 w-52 rounded-full bg-[#FBBF24]/[0.08] blur-3xl" />
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9675FF]"><Sparkles size={13} /> Executive overview</p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">Good to see you, {user?.name || "Owner"}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#9AAAC4]">A clear view of marketplace activity, seller performance and order trends.</p>
          </div>
          <Link to="/owner/reports" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-[#F8FAFC] shadow-lg shadow-[#6D4AFF]/20 transition hover:bg-[#9675FF]"><BarChart3 size={16} /> Monthly report <ArrowUpRight size={15} /></Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-[#243451] pt-4 text-[11px] text-[#9AAAC4]">
          <span className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" /> Updated {analytics?.generatedAt ? new Date(analytics.generatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "when loaded"}</span>
          <span className="truncate">{user?.email}</span>
          <span>Booked order value · COD payments not confirmed</span>
        </div>
      </section>

      {error && <ErrorPanel message={error} retry={retry} />}

      {!loading && analytics && (
        <aside className="flex items-start gap-3 rounded-xl border border-[#6D4AFF]/25 bg-gradient-to-r from-[#6D4AFF]/10 to-[#22D3EE]/5 p-4">
          <Sparkles size={16} className="mt-0.5 shrink-0 text-[#9675FF]" />
          <div>
            <p className="text-xs font-semibold text-[#F8FAFC]">Executive insight</p>
            <p className="mt-1 text-xs leading-5 text-[#9AAAC4]">
              {Number(kpis?.previousOrderValue) > 0
                ? `Order value ${growth >= 0 ? "increased" : "declined"} ${Math.abs(growth).toFixed(1)}% compared with the previous ${rangeLabel}.`
                : Number(kpis?.currentOrderValue) > 0
                  ? `Order activity is present in this range, with no prior-period value available for a percentage comparison.`
                  : `No non-cancelled order value was recorded in the selected ${rangeLabel}.`}
            </p>
          </div>
        </aside>
      )}

      <section aria-label="Marketplace key performance indicators" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.slice(0, 4).map((card) => <MetricCard key={card.title} {...card} loading={loading} />)}
      </section>

      <section aria-label="Marketplace snapshot" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Customers", value: kpis?.totalCustomers, detail: `${formatCount(kpis?.newCustomersThisMonth)} new this month`, icon: Users, color: "#22D3EE" },
          { label: "Sellers", value: kpis?.totalSellers, detail: "Active marketplace accounts", icon: Store, color: "#9675FF" },
          { label: "Listed products", value: kpis?.availableProducts, detail: `${formatCount(kpis?.totalProducts)} total products`, icon: Boxes, color: "#34D399" },
          { label: "Out of stock", value: kpis?.outOfStockProducts, detail: "Needs inventory attention", icon: PackageX, color: "#FBBF24" },
        ].map((item) => <article key={item.label} className="flex min-w-0 items-center gap-3 rounded-xl border border-[#243451] bg-[#0B1020] px-3 py-3 sm:px-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ color: item.color, backgroundColor: `${item.color}1a` }}><item.icon size={17} /></span>
          <div className="min-w-0"><p className="truncate text-[10px] font-medium text-[#9AAAC4]">{item.label}</p><p className="truncate text-lg font-bold tabular-nums text-[#F8FAFC]">{loading ? "—" : formatCount(item.value)}</p><p className="truncate text-[9px] text-[#9AAAC4]">{item.detail}</p></div>
        </article>)}
      </section>

      <div className="grid gap-4 xl:grid-cols-5">
      <section className={`${panelClass} p-4 sm:p-6 xl:col-span-3`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeading eyebrow="Performance" title="Order value & volume" detail={`Daily trend for shorter ranges, monthly trend for longer ranges · ${rangeLabel || ""}`} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-[#243451] bg-[#080B18] p-1" role="group" aria-label="Chart metric">
              {[{ id: "orderValue", label: "Order value" }, { id: "orders", label: "Orders" }].map((option) => (
                <button key={option.id} type="button" onClick={() => setChartMetric(option.id)} aria-pressed={chartMetric === option.id} className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition ${chartMetric === option.id ? "bg-[#6D4AFF] text-[#F8FAFC]" : "text-[#9AAAC4] hover:text-[#F8FAFC]"}`}>{option.label}</button>
              ))}
            </div>
            <label className="relative">
              <span className="sr-only">Date range</span>
              <select value={range} onChange={(event) => setRange(event.target.value)} className="appearance-none rounded-xl border border-[#243451] bg-[#080B18] py-2.5 pl-3 pr-8 text-xs font-semibold text-[#F8FAFC] outline-none focus:border-[#6D4AFF]">
                {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9AAAC4]" />
            </label>
            {range === "custom" && <div className="flex flex-wrap items-center gap-2">
              <label className="text-[10px] font-semibold text-[#9AAAC4]">From <input aria-label="Custom range start date" type="date" value={customFrom} max={customTo || today} onChange={(event) => setCustomFrom(event.target.value)} className="ml-1 rounded-lg border border-[#243451] bg-[#080B18] px-2 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#6D4AFF]" /></label>
              <label className="text-[10px] font-semibold text-[#9AAAC4]">To <input aria-label="Custom range end date" type="date" value={customTo} min={customFrom} max={today} onChange={(event) => setCustomTo(event.target.value)} className="ml-1 rounded-lg border border-[#243451] bg-[#080B18] px-2 py-2 text-xs text-[#F8FAFC] outline-none focus:border-[#6D4AFF]" /></label>
            </div>}
          </div>
        </div>
        {loading ? <div className="mt-5 h-64 animate-pulse rounded-xl bg-[#243451]/40" /> : (
          <>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-2xl font-bold tracking-tight text-[#F8FAFC]">{chartMetric === "orderValue" ? formatMoney(currentValue) : formatCount(currentValue)}</p>
                <p className="mt-1 text-[11px] text-[#9AAAC4]">{chartMetric === "orderValue" ? "Selected period order value" : "Orders in selected period"}</p>
              </div>
              {chartGrowth !== null && <span className={`inline-flex items-center gap-1 text-xs font-semibold ${chartGrowth >= 0 ? "text-[#34D399]" : "text-rose-300"}`}>{chartGrowth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{Math.abs(chartGrowth).toFixed(1)}% vs previous period</span>}
            </div>
            <TrendChart data={series} title={`${chartMetric === "orderValue" ? "Order value" : "Order count"} trend`} money={chartMetric === "orderValue"} />
          </>
        )}
      </section>

      <section className={`${panelClass} p-5 xl:col-span-2`}>
        <SectionHeading eyebrow="Product intelligence" title="Category performance" detail="What customers buy across your sellers’ product categories." />
        <CategoryPerformance categories={analytics?.categories} loading={loading} />
      </section>
      </div>

      <div className="grid gap-4">
        <section className={`${panelClass} p-5`}>
          <SectionHeading eyebrow="Sales intelligence" title="Best-performing products" detail="Current range compared with the previous equivalent period." />
          {loading ? <div className="mt-5"><LoadingPanel lines={4} /></div> : (
            <div className="mt-5 overflow-x-auto">
              {(analytics?.topProducts || []).length ? (
                <table className="w-full min-w-[580px] text-left text-xs">
                  <thead className="border-b border-[#243451] text-[10px] uppercase tracking-wider text-[#9AAAC4]"><tr><th className="pb-3 font-semibold">Product</th><th className="pb-3 text-right font-semibold">Order value</th><th className="pb-3 text-right font-semibold">Change</th><th className="pb-3 text-right font-semibold">Units</th><th className="pb-3 text-right font-semibold">Stock</th></tr></thead>
                  <tbody className="divide-y divide-[#243451]/70">
                    {analytics.topProducts.map((product) => {
                      const diff = Number(product.currentSales || 0) - Number(product.previousSales || 0);
                      const isUp = diff >= 0;
                      return <tr key={product.productId}>
                        <td className="py-3 pr-3"><div className="flex items-center gap-3">{product.image ? <img src={product.image} alt="" className="h-9 w-9 rounded-lg object-cover" loading="lazy" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#243451]/50 text-[#9AAAC4]"><Boxes size={15} /></span>}<div className="min-w-0"><p className="max-w-48 truncate font-semibold text-[#F8FAFC]">{product.name}</p><p className="mt-1 text-[10px] text-[#9AAAC4]">{product.category}</p></div></div></td>
                        <td className="py-3 text-right font-semibold tabular-nums text-[#F8FAFC]">{formatMoney(product.currentSales)}</td>
                        <td className={`py-3 text-right font-semibold tabular-nums ${isUp ? "text-[#34D399]" : "text-rose-300"}`}>{diff > 0 ? "+" : ""}{formatMoney(diff)}</td>
                        <td className="py-3 text-right tabular-nums text-[#9AAAC4]">{formatCount(product.units)}</td>
                        <td className="py-3 text-right tabular-nums text-[#9AAAC4]">{product.stock === null ? "—" : formatCount(product.stock)}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              ) : <p className="py-10 text-center text-xs text-[#9AAAC4]">No product sales in this date range.</p>}
            </div>
          )}
        </section>
      </div>

      <section className={`${panelClass} p-5`}>
        <SectionHeading eyebrow="Sales movement" title="Products with declining order value" detail="Products with lower stored order-line value than in the previous equivalent period." />
        {loading ? <div className="mt-5"><LoadingPanel lines={3} /></div> : analytics?.decliningProducts?.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {analytics.decliningProducts.map((product) => {
              const reduction = Number(product.previousSales || 0) - Number(product.currentSales || 0);
              return <article key={product.productId} className="rounded-xl border border-rose-300/10 bg-rose-300/[0.035] p-4">
                <p className="truncate text-xs font-semibold text-[#F8FAFC]">{product.name}</p>
                <p className="mt-1 truncate text-[10px] text-[#9AAAC4]">{product.category}</p>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <div><p className="text-sm font-bold text-[#F8FAFC]">{formatMoney(product.currentSales)}</p><p className="mt-1 text-[10px] text-[#9AAAC4]">previous {formatMoney(product.previousSales)}</p></div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-300"><TrendingDown size={12} />−{formatMoney(reduction)}</span>
                </div>
              </article>;
            })}
          </div>
        ) : <p className="py-7 text-center text-xs text-[#9AAAC4]">No declining products were found in this comparison period.</p>}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${panelClass} p-5`}>
          <SectionHeading eyebrow="Order health" title="Order status distribution" detail="All recorded orders, including cancelled orders." />
          {loading ? <div className="mt-5"><LoadingPanel lines={4} /></div> : <div className="mt-6"><StatusList statuses={analytics?.statuses} /></div>}
        </section>
        <section className={`${panelClass} p-5`}>
          <SectionHeading eyebrow="Inventory" title="Out-of-stock watch" detail="Products with stock at zero or below." action={<span className="rounded-lg bg-rose-400/10 px-2.5 py-1.5 text-xs font-bold text-rose-300">{formatCount(kpis?.outOfStockProducts)} items</span>} />
          {loading ? <div className="mt-5"><LoadingPanel lines={3} /></div> : analytics?.inventory?.products?.length ? (
            <div className="mt-4 divide-y divide-[#243451]/70">{analytics.inventory.products.map((product) => <div key={product._id} className="flex items-center justify-between gap-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-400/10 text-rose-300"><PackageX size={16} /></span><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#F8FAFC]">{product.name}</p><p className="mt-1 text-[10px] text-[#9AAAC4]">{product.category || "Uncategorized"}</p></div></div><span className="shrink-0 text-xs font-bold text-rose-300">Out of stock</span></div>)}</div>
          ) : <p className="py-8 text-center text-xs text-[#34D399]">No out-of-stock products.</p>}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className={`${panelClass} p-5`}>
          <SectionHeading eyebrow="Customers" title="Highest order value" detail="Ranked by non-cancelled booked order value." />
          {loading ? <div className="mt-5"><LoadingPanel lines={4} /></div> : <div className="mt-5"><SmallBarList items={analytics?.topCustomers} labelKey="name" valueKey="orderValue" /></div>}
        </section>
        <section className={`${panelClass} p-5`}>
          <SectionHeading eyebrow="Marketplace" title="Top 3 sellers" detail="Ranked by seller item value." action={<Link to="/owner/sellers" className="text-[11px] font-semibold text-[#9675FF] hover:text-[#F8FAFC]">All sellers <ArrowUpRight size={13} className="inline" /></Link>} />
          {loading ? <div className="mt-5"><LoadingPanel lines={3} /></div> : (
            <div className="mt-5 space-y-2">{analytics?.topSellers?.length ? analytics.topSellers.map((seller, index) => <SellerRankCard key={seller._id} seller={seller} index={index} />) : <p className="py-8 text-center text-xs text-[#9AAAC4]">Seller performance appears after orders are placed.</p>}</div>
          )}
        </section>
        <section className={`${panelClass} p-5`}>
          <SectionHeading eyebrow="Customer retention" title="Repeat purchase rate" detail="Share of buyers with more than one non-cancelled order." />
          {loading ? <div className="mt-5 h-24 animate-pulse rounded-xl bg-[#243451]/50" /> : (
            <div className="mt-5 rounded-xl border border-[#243451]/70 bg-[#10182B] p-4">
              <p className="text-3xl font-bold text-[#F8FAFC]">{kpis?.repeatPurchaseRate === null ? "—" : `${(Number(kpis?.repeatPurchaseRate || 0) * 100).toFixed(1)}%`}</p>
              <p className="mt-2 text-xs leading-5 text-[#9AAAC4]">{formatCount(kpis?.repeatBuyers)} returning buyers from {formatCount(kpis?.uniqueBuyers)} buyers. This measures repeat ordering, not subscription retention.</p>
            </div>
          )}
        </section>
      </div>

      <section className={`${panelClass} p-5`}>
        <SectionHeading eyebrow="Customer growth" title="Recorded customer sign-ups" detail={`Monthly registration dates are available for ${formatCount(analytics?.signupTracking?.trackedAccounts)} accounts. Legacy accounts without a creation date are excluded.`} />
        {loading ? <div className="mt-5 h-40 animate-pulse rounded-xl bg-[#243451]/50" /> : (
          analytics?.customerHistory?.length ? (
            <div className="mt-5 grid h-40 grid-cols-12 items-end gap-2 border-b border-[#243451] pb-6">
              {analytics.customerHistory.slice(-12).map((month) => {
                const visible = analytics.customerHistory.slice(-12);
                const max = Math.max(1, ...visible.map((item) => Number(item.customers || 0)));
                const height = Math.max(Number(month.customers) > 0 ? 6 : 2, (Number(month.customers || 0) / max) * 100);
                return <div key={month.month} className="group relative flex h-full min-w-0 flex-col justify-end" title={`${month.month}: ${formatCount(month.customers)} recorded sign-ups`}><div className="rounded-t-md bg-[#22D3EE] opacity-75 transition group-hover:opacity-100" style={{ height: `${height}%` }} /><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] text-[#9AAAC4]">{month.month.slice(5)}</span></div>;
              })}
            </div>
          ) : <p className="mt-5 py-8 text-center text-xs text-[#9AAAC4]">No dated customer registrations are available yet. New accounts will be tracked from now on.</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className={`${panelClass} p-5 lg:col-span-3`}>
          <SectionHeading eyebrow="Monthly performance" title="Order value history" detail="Last 12 months plus the year-ago month when available." action={<Link to="/owner/reports" className="text-[11px] font-semibold text-[#9675FF] hover:text-[#F8FAFC]">Open reports <ArrowUpRight size={13} className="inline" /></Link>} />
          {loading ? <div className="mt-5 h-48 animate-pulse rounded-xl bg-[#243451]/50" /> : (
            <div className="mt-5 grid h-48 grid-cols-12 items-end gap-2 border-b border-[#243451] pb-6">
              {(analytics?.monthlyHistory || []).slice(-12).map((month) => {
                const values = analytics.monthlyHistory.slice(-12).map((item) => Number(item.orderValue || 0));
                const max = Math.max(1, ...values);
                const height = Math.max(Number(month.orderValue) > 0 ? 6 : 2, (Number(month.orderValue || 0) / max) * 100);
                return <div key={month.month} className="group relative flex h-full min-w-0 flex-col justify-end" title={`${month.month}: ${formatMoney(month.orderValue)} · ${formatCount(month.orders)} orders`}><div className="rounded-t-md bg-gradient-to-t from-[#8B5CF6] to-[#22D3EE] opacity-80 transition group-hover:opacity-100" style={{ height: `${height}%` }} /><span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] text-[#9AAAC4]">{month.month.slice(5)}</span></div>;
              })}
              {!analytics?.monthlyHistory?.length && <p className="col-span-12 self-center text-center text-xs text-[#9AAAC4]">No order history for this period.</p>}
            </div>
          )}
        </section>
        <section className={`${panelClass} p-5 lg:col-span-2`}>
          <SectionHeading eyebrow="Activity" title="Recent activity" detail="Recent orders and timestamped customer registrations." action={<Link to="/owner/activity" className="text-[11px] font-semibold text-[#9675FF] hover:text-[#F8FAFC]">View all <ArrowUpRight size={13} className="inline" /></Link>} />
          {loading ? <div className="mt-5"><LoadingPanel lines={4} /></div> : <div className="mt-5"><ActivityList activity={analytics?.activity} /></div>}
        </section>
      </div>

      <aside className="flex items-start gap-3 rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 p-4 text-xs leading-5 text-[#9AAAC4]">
        <CircleDollarSign size={16} className="mt-0.5 shrink-0 text-[#FBBF24]" />
        <p><strong className="font-semibold text-[#F8FAFC]">Financial data boundary:</strong> checkout currently supports cash on delivery and stores order line prices. This dashboard reports non-cancelled booked order value, not collected revenue. {analytics?.dataQuality?.nonCancelledLinesMissingStoredPrice ? `${formatCount(analytics.dataQuality.nonCancelledLinesMissingStoredPrice)} older order lines lack a stored price and are excluded from value calculations. ` : ""}Collected payments, refunds, costs, net revenue and profit are not available in the current data model.</p>
      </aside>
    </div>
  );
};

const csvCell = (value) => {
  let text = String(value ?? "");
  if (typeof value === "string" && /^\s*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

const OwnerReports = ({ token }) => {
  const [month, setMonth] = useState(toMonthInput());
  const { analytics, loading, error, retry } = useOwnerAnalytics(token, "30d", month);
  const report = analytics?.month;
  const history = analytics?.monthlyHistory || [];
  const categories = report?.categories || [];
  const products = report?.products || [];
  const yearAgoKey = `${month.slice(0, 4) - 1}${month.slice(4)}`;
  const yearAgo = history.find((item) => item.month === yearAgoKey);
  const bestMonth = history.length ? history.reduce((best, item) => Number(item.orderValue) > Number(best.orderValue) ? item : best, history[0]) : null;
  const worstMonth = history.length ? history.reduce((worst, item) => Number(item.orderValue) < Number(worst.orderValue) ? item : worst, history[0]) : null;
  const monthDelta = report?.previousOrderValue > 0 ? ((report.orderValue - report.previousOrderValue) / report.previousOrderValue) * 100 : null;

  const exportCsv = () => {
    if (!analytics || !report) return;
    const rows = [
      ["Monthly owner report", month],
      ["Metric", "Value"],
      ["Booked order value", report.orderValue],
      ["Previous month order value", report.previousOrderValue],
      ["Orders", report.orders],
      ["Completed orders", report.completedOrders],
      ["Cancelled orders", report.cancelledOrders],
      ["Average order value", report.averageOrderValue],
      [],
      ["Category", "Order value", "Previous month value"],
      ...categories.map((item) => [item.category, item.currentSales, item.previousSales]),
      [],
      ["Product", "Category", "Order value", "Previous month value", "Units"],
      ...products.map((item) => [item.name, item.category, item.currentSales, item.previousSales, item.units]),
      [],
      ["Month", "Booked order value", "Orders"],
      ...history.map((item) => [item.month, item.orderValue, item.orders]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `owner-monthly-report-${month}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="owner-print space-y-6 text-[#F8FAFC] print:space-y-4 print:bg-white print:text-[#F8FAFC]">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9675FF] print:text-[#6D4AFF]">Analytics & reports</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#F8FAFC] print:text-[#F8FAFC] sm:text-3xl">Monthly performance</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#9AAAC4] print:text-[#9AAAC4]">A monthly report built from stored order lines, cancellation status and product categories.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <label className="flex items-center gap-2 rounded-xl border border-[#243451] bg-[#0B1020] px-3 py-2.5 text-xs text-[#9AAAC4]">
            <CalendarDays size={15} className="text-[#34D399]" />
            <span className="sr-only">Choose report month</span>
            <input type="month" value={month} max={toMonthInput()} onChange={(event) => setMonth(event.target.value)} className="bg-transparent text-[#F8FAFC] outline-none [color-scheme:dark]" />
          </label>
          <button type="button" onClick={exportCsv} disabled={!analytics || loading} className="inline-flex items-center gap-2 rounded-xl border border-[#243451] bg-[#0B1020] px-3 py-2.5 text-xs font-semibold text-[#F8FAFC] transition hover:border-[#9675FF]/50 disabled:opacity-50"><Download size={14} /> Export CSV</button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-[#6D4AFF] px-3 py-2.5 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#9675FF]"><Printer size={14} /> Print report</button>
        </div>
      </header>

      {error && <ErrorPanel message={error} retry={retry} />}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className={`${panelClass} h-32 animate-pulse`} />)}</div>
      ) : analytics && report ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Order value", value: report.orderValue, detail: "Non-cancelled items · COD", icon: CircleDollarSign, money: true },
              { title: "Orders", value: report.orders, detail: `${formatCount(report.completedOrders)} delivered`, icon: ClipboardList },
              { title: "Average order value", value: report.averageOrderValue, detail: "Non-cancelled orders", icon: ShoppingBag, money: true },
              { title: "Cancelled orders", value: report.cancelledOrders, detail: "Parent order status", icon: PackageX },
              ].map((card) => <article key={card.title} title={card.detail} className={`${panelClass} p-4 sm:p-5`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#34D399]/10 text-[#34D399]"><card.icon size={17} /></span><p className="mt-4 text-xs font-medium text-[#9AAAC4]">{card.title}</p><p className="mt-1 text-2xl font-bold text-[#F8FAFC]">{card.money ? formatMoney(card.value) : formatCount(card.value)}</p><p className="mt-1 text-[10px] text-[#9AAAC4]">{card.detail}</p></article>)}
          </section>

          <section className={`${panelClass} p-5 sm:p-6`}>
            <SectionHeading eyebrow={month} title="Month-over-month comparison" detail="Selected month compared with the month immediately before it." />
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[#10182B] p-4 print:bg-white"><p className="text-[10px] uppercase tracking-wider text-[#9AAAC4]">Selected month</p><p className="mt-2 text-xl font-bold text-[#F8FAFC]">{formatMoney(report.orderValue)}</p></div>
              <div className="rounded-xl bg-[#10182B] p-4 print:bg-white"><p className="text-[10px] uppercase tracking-wider text-[#9AAAC4]">Previous month</p><p className="mt-2 text-xl font-bold text-[#F8FAFC]">{formatMoney(report.previousOrderValue)}</p></div>
              <div className="rounded-xl bg-[#10182B] p-4 print:bg-white"><p className="text-[10px] uppercase tracking-wider text-[#9AAAC4]">Change</p><p className={`mt-2 text-xl font-bold ${monthDelta === null ? "text-[#9AAAC4]" : monthDelta >= 0 ? "text-[#34D399]" : "text-rose-300"}`}>{monthDelta === null ? report.orderValue ? "New activity" : "No prior data" : `${monthDelta > 0 ? "+" : ""}${monthDelta.toFixed(1)}%`}</p></div>
            </div>
            {yearAgo ? <p className="mt-4 text-xs text-[#9AAAC4]">Same month last year: {formatMoney(yearAgo.orderValue)} ({formatCount(yearAgo.orders)} orders).</p> : <p className="mt-4 text-xs text-[#9AAAC4]">Same-month-last-year comparison is unavailable until 12 months of order history exist.</p>}
            {bestMonth && worstMonth && <p className="mt-2 text-xs text-[#9AAAC4]">Within the available 13-month history, best month: <strong className="text-[#9AAAC4]">{bestMonth.month}</strong> · lowest month: <strong className="text-[#9AAAC4]">{worstMonth.month}</strong>.</p>}
          </section>

          <section className={`${panelClass} p-5 sm:p-6`}>
            <SectionHeading eyebrow="Sales history" title="Monthly order value · last 12 months" detail="Bars represent recorded non-cancelled order line value." />
            <div className="mt-6 grid h-52 grid-cols-12 items-end gap-2 border-b border-[#243451] pb-7 sm:gap-3">
              {history.slice(-12).map((item) => {
                const visible = history.slice(-12);
                const max = Math.max(1, ...visible.map((row) => Number(row.orderValue || 0)));
                const height = Math.max(Number(item.orderValue) > 0 ? 6 : 2, (Number(item.orderValue || 0) / max) * 100);
                return <div key={item.month} className="group relative flex h-full min-w-0 flex-col justify-end" title={`${item.month}: ${formatMoney(item.orderValue)} · ${formatCount(item.orders)} orders`}><div className={`rounded-t-md transition ${item.month === month ? "bg-gradient-to-t from-[#8B5CF6] to-[#22D3EE]" : "bg-[#6D4AFF]/70 group-hover:bg-[#9675FF]"}`} style={{ height: `${height}%` }} /><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] text-[#9AAAC4]">{item.month.slice(5)}</span></div>;
              })}
              {!history.length && <p className="col-span-12 self-center text-center text-xs text-[#9AAAC4]">No order history for these months.</p>}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className={`${panelClass} p-5`}>
              <SectionHeading eyebrow="Breakdown" title="Category order value" detail="Selected month compared with its previous month." />
              <div className="mt-5"><SmallBarList items={categories} labelKey="category" valueKey="currentSales" /></div>
              {categories.length > 0 && <div className="mt-4 border-t border-[#243451]/70 pt-3 text-[10px] text-[#9AAAC4]">Previous month values: {categories.map((item) => `${item.category} ${formatMoney(item.previousSales)}`).join(" · ")}</div>}
            </section>
            <section className={`${panelClass} p-5`}>
              <SectionHeading eyebrow="Product performance" title="Leading products this month" detail="Order value uses the stored price for each order line." />
              {products.length ? <div className="mt-4 divide-y divide-[#243451]/70">{products.slice(0, 8).map((product) => <div key={product.productId} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#F8FAFC]">{product.name}</p><p className="mt-1 text-[10px] text-[#9AAAC4]">{product.category} · {formatCount(product.units)} units</p></div><div className="shrink-0 text-right"><p className="text-xs font-semibold text-[#F8FAFC]">{formatMoney(product.currentSales)}</p><p className="mt-1 text-[10px] text-[#9AAAC4]">prev. {formatMoney(product.previousSales)}</p></div></div>)}</div> : <p className="py-8 text-center text-xs text-[#9AAAC4]">No product sales in this month.</p>}
            </section>
          </div>

          <section className="rounded-xl border border-[#FBBF24]/20 bg-[#FBBF24]/5 p-4 text-xs leading-5 text-[#9AAAC4]"><strong className="font-semibold text-[#F8FAFC]">Report definition:</strong> totals use stored order line price × quantity and exclude cancelled orders and cancelled seller items. Cash-on-delivery orders are booked value, not verified received payments. {analytics.dataQuality?.nonCancelledLinesMissingStoredPrice ? `${formatCount(analytics.dataQuality.nonCancelledLinesMissingStoredPrice)} legacy lines without a stored price are excluded. ` : ""}Refunds, payment capture, fees and costs are not stored in the current schema.</section>
        </>
      ) : null}
    </div>
  );
};

const OwnerActivity = ({ token }) => {
  const { analytics, loading, error, retry } = useOwnerAnalytics(token, "30d");
  return (
    <section className="space-y-5 text-[#F8FAFC]">
      <SectionHeading eyebrow="Notifications" title="Recent activity" detail="Marketplace events from recorded orders and timestamped customer registrations." />
      {error && <ErrorPanel message={error} retry={retry} />}
      {loading ? <LoadingPanel lines={8} /> : <div className={`${panelClass} p-5`}><ActivityList activity={analytics?.activity} /></div>}
      <p className="text-[11px] leading-5 text-[#9AAAC4]">Payment confirmations, refunds and other system notifications are unavailable because those events are not stored by this application yet.</p>
    </section>
  );
};

export const OwnerSettings = () => {
  const [preferences, setPreferences] = useState(getOwnerPreferences);
  const [saved, setSaved] = useState(false);
  const save = (event) => {
    event.preventDefault();
    setPreferences(saveOwnerPreferences(preferences));
    setSaved(true);
  };

  return (
    <section className="space-y-5 text-[#F8FAFC]">
      <SectionHeading eyebrow="Workspace" title="Dashboard settings" detail="These preferences are saved in this browser for your owner account on this device." />
      <form onSubmit={save} className={`${panelClass} max-w-3xl divide-y divide-white/[0.07]`}>
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#34D399]/10 text-[#34D399]"><BarChart3 size={18} /></span>
          <label className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[#F8FAFC]">Default overview period</span>
            <span className="mt-1 block text-xs leading-5 text-[#9AAAC4]">Choose the date range shown when you open Overview.</span>
            <select value={preferences.defaultRange} onChange={(event) => { setPreferences((current) => ({ ...current, defaultRange: event.target.value })); setSaved(false); }} className="mt-3 w-full max-w-xs rounded-xl border border-[#243451] bg-[#080B18] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none focus:border-[#6D4AFF]">
              {[{ value: "7d", label: "Last 7 days" }, { value: "30d", label: "Last 30 days" }, { value: "6m", label: "Last 6 months" }, { value: "12m", label: "Last 12 months" }].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FBBF24]/10 text-[#FBBF24]"><RefreshCw size={18} /></span>
          <label className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[#F8FAFC]">Analytics refresh</span>
            <span className="mt-1 block text-xs leading-5 text-[#9AAAC4]">Set how often open analytics pages refresh automatically.</span>
            <select value={preferences.refreshMinutes} onChange={(event) => { setPreferences((current) => ({ ...current, refreshMinutes: Number(event.target.value) })); setSaved(false); }} className="mt-3 w-full max-w-xs rounded-xl border border-[#243451] bg-[#080B18] px-3 py-2.5 text-sm text-[#F8FAFC] outline-none focus:border-[#6D4AFF]">
              {[{ value: 0, label: "Off" }, { value: 1, label: "Every minute" }, { value: 5, label: "Every 5 minutes" }, { value: 15, label: "Every 15 minutes" }].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
          <p role="status" className="min-h-5 text-xs text-[#34D399]">{saved ? "Preferences saved on this device." : "Changes apply after you save."}</p>
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#6D4AFF] px-4 py-2.5 text-sm font-semibold text-[#F8FAFC] transition hover:bg-[#9675FF]"><Save size={15} /> Save preferences</button>
        </div>
      </form>
      <div className={`${panelClass} max-w-3xl p-5 sm:p-6`}>
        <div className="flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#243451]/60 text-[#9AAAC4]"><Settings2 size={18} /></span><div><h2 className="text-sm font-semibold text-[#F8FAFC]">Account and permissions</h2><p className="mt-1 text-xs leading-5 text-[#9AAAC4]">Owner privileges are verified against your current account on every protected API request. Use the sidebar to manage seller access or sign out securely from the header.</p></div></div>
      </div>
    </section>
  );
};

export { OwnerActivity, OwnerOverview, OwnerReports };
