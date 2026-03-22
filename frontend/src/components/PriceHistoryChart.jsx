import { useState, useEffect, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import api from '../services/api';

const RANGES = [
    { label: '1 Month', months: 1 },
    { label: '3 Month', months: 3 },
    { label: 'Max', months: 0 },
];

// Custom tooltip component
function CustomTooltip({ active, payload, label, stats }) {
    if (!active || !payload?.length) return null;
    const price = payload[0]?.value;
    if (!price) return null;

    let context = '';
    if (stats) {
        if (price === stats.high) context = '📈 Highest Price';
        else if (price === stats.low) context = '📉 Lowest Price';
        else {
            const pct = ((price - stats.low) / stats.low * 100).toFixed(1);
            context = `+${pct}% above lowest`;
        }
    }

    return (
        <div className="bg-white rounded-xl px-4 py-3 shadow-xl text-sm border border-gray-100">
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <p className="font-black text-base text-gray-900">₹{Number(price).toLocaleString('en-IN')}</p>
            {context && <p className="text-gray-400 text-xs mt-1">{context}</p>}
        </div>
    );
}

export default function PriceHistoryChart({ productId, history = [] }) {
    const [allData, setAllData]   = useState([]); // [{ dateLabel, price, ts }]
    const [range,   setRange]     = useState('3 Month');
    const [loading, setLoading]   = useState(true);
    const [count,   setCount]     = useState(0);

    useEffect(() => {
        let cancelled = false;

        const mapped = (history || [])
            .filter(h => h?.price)
            .map(h => {
                const ts = h.timestamp ? new Date(h.timestamp).getTime() : null;
                const label = ts
                    ? new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : h.date || '';
                return { dateLabel: label, price: h.price, ts };
            })
            .filter(d => d.dateLabel);

        if (mapped.length) {
            setAllData(mapped);
            setCount(mapped.length);
            setLoading(false);
        }

        if (!productId) return;
        if (mapped.length >= 5) return;

        (async () => {
            setLoading(true);
            try {
                const res  = await api.get(`/price-history?product_id=${productId}&limit=200`);
                const { dates = [], prices = [], timestamps = [], count: c = 0 } = res.data;
                const fetched = dates.map((d, i) => ({
                    dateLabel: d,
                    price: prices[i],
                    ts: timestamps[i] ? new Date(timestamps[i]).getTime() : null
                }));
                if (cancelled) return;

                if (fetched.length > mapped.length) {
                    setAllData(fetched);
                    setCount(Math.max(c, fetched.length));
                } else {
                    setCount(Math.max(c, mapped.length));
                }
            } catch (err) {
                console.error('Price history error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [productId, history]);

    // Client-side range filter
    const filteredData = useMemo(() => {
        const sel = RANGES.find(r => r.label === range);
        if (!sel || sel.months === 0 || allData.length === 0) return allData;

        const withTs = allData.filter(d => d.ts);
        if (withTs.length) {
            const cutoff = new Date();
            cutoff.setMonth(cutoff.getMonth() - sel.months);
            return withTs.filter(d => d.ts >= cutoff.getTime());
        }

        const keepCount = Math.max(5, Math.ceil(allData.length * (sel.months / 24)));
        return allData.slice(-keepCount);
    }, [allData, range]);

    // Downsample to avoid overload
    const displayData = useMemo(() => {
        const MAX_POINTS = 120;
        if (filteredData.length <= MAX_POINTS) return filteredData;
        const step = Math.ceil(filteredData.length / MAX_POINTS);
        return filteredData.filter((_, idx) => idx % step === 0);
    }, [filteredData]);

    // Stats
    const stats = useMemo(() => {
        const prices = filteredData.map(d => d.price).filter(Boolean);
        if (prices.length < 2) return null;
        return {
            high: Math.max(...prices),
            low:  Math.min(...prices),
            avg:  prices.reduce((a, b) => a + b, 0) / prices.length,
        };
    }, [filteredData]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-52 text-gray-400 gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-sm">Loading price history…</span>
        </div>
    );

    // ── Not enough data ──────────────────────────────────────────────────────
    if (allData.length === 0) return (
        <div className="flex flex-col items-center justify-center h-52 bg-indigo-50 rounded-2xl border border-indigo-100 text-center px-6">
            <span className="text-4xl mb-3">📊</span>
            <p className="font-semibold text-indigo-800 text-base mb-1">Collecting price history data.</p>
            <p className="text-sm text-indigo-400">Graph will appear as soon as data arrives.</p>
            <div className="mt-3 w-full max-w-[200px] bg-indigo-100 rounded-full h-2">
                <div
                    className="bg-indigo-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (count / 200) * 100)}%` }}
                />
            </div>
            <p className="text-xs text-gray-400 mt-2">{count} / 200 records collected</p>
        </div>
    );

    // ── Chart ────────────────────────────────────────────────────────────────
    return (
        <div>
            {/* Time-range tabs (right aligned) */}
            <div className="flex items-center justify-end mb-4 flex-wrap gap-3">
                <div className="flex gap-1 bg-gray-100 rounded-full p-1">
                    {RANGES.map(r => (
                        <button
                            key={r.label}
                            onClick={() => setRange(r.label)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                range === r.label
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Recharts Area Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                            <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.18} />
                            <stop offset="100%" stopColor="#34d399" stopOpacity={0.15} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="dateLabel"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        orientation="left"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={v => {
                            if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                            if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                            return `₹${v}`;
                        }}
                        domain={['auto', 'auto']}
                        width={55}
                    />
                    <Tooltip content={<CustomTooltip stats={stats} />} />

                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fill="url(#priceFill)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>\n\n            <p className="text-xs text-center text-gray-400 mt-3">
                Hover on the chart to see exact price and date
            </p>
        </div>
    );
}






