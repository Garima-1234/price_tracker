import { useState, useEffect, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Dot
} from 'recharts';
import api from '../services/api';

const RANGES = [
    { label: '1M', months: 1 },
    { label: '3M', months: 3 },
    { label: '6M', months: 6 },
    { label: 'All', months: 0 },
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
        <div className="bg-indigo-950 text-white rounded-xl px-4 py-3 shadow-xl text-sm">
            <p className="text-gray-300 text-xs mb-1">{label}</p>
            <p className="font-black text-base">₹{Number(price).toLocaleString('en-IN')}</p>
            {context && <p className="text-purple-300 text-xs mt-1">{context}</p>}
        </div>
    );
}

// Custom dot: highlight highest (red) and lowest (green)
function CustomDot(props) {
    const { cx, cy, payload, stats } = props;
    if (!stats || !payload) return <circle cx={cx} cy={cy} r={2} fill="#7c3aed" />;
    if (payload.price === stats.high)
        return <circle cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#fff" strokeWidth={2} />;
    if (payload.price === stats.low)
        return <circle cx={cx} cy={cy} r={7} fill="#22c55e" stroke="#fff" strokeWidth={2} />;
    return <circle cx={cx} cy={cy} r={2} fill="#7c3aed" />;
}

export default function PriceHistoryChart({ productId }) {
    const [allData, setAllData]   = useState([]); // [{ date, price }]
    const [range,   setRange]     = useState('3M');
    const [loading, setLoading]   = useState(true);
    const [count,   setCount]     = useState(0);

    useEffect(() => {
        if (!productId) return;
        (async () => {
            setLoading(true);
            try {
                const res  = await api.get(`/price-history?product_id=${productId}`);
                const { dates = [], prices = [], count: c = 0 } = res.data;
                setCount(c);
                setAllData(dates.map((d, i) => ({ date: d, price: prices[i] })));
            } catch (err) {
                console.error('Price history error:', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [productId]);

    // Client-side range filter
    const filteredData = useMemo(() => {
        const sel = RANGES.find(r => r.label === range);
        if (!sel || sel.months === 0 || allData.length === 0) return allData;
        const keepCount = Math.max(5, Math.ceil(allData.length * (sel.months / 24)));
        return allData.slice(-keepCount);
    }, [allData, range]);

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
    if (allData.length < 5) return (
        <div className="flex flex-col items-center justify-center h-52 bg-indigo-50 rounded-2xl border border-indigo-100 text-center px-6">
            <span className="text-4xl mb-3">📊</span>
            <p className="font-semibold text-indigo-800 text-base mb-1">Collecting price history data.</p>
            <p className="text-sm text-indigo-400">Graph will appear soon.</p>
            <div className="mt-3 w-full max-w-[200px] bg-indigo-100 rounded-full h-2">
                <div
                    className="bg-indigo-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (count / 5) * 100)}%` }}
                />
            </div>
            <p className="text-xs text-gray-400 mt-2">{count} / 5 records collected</p>
        </div>
    );

    // ── Chart ────────────────────────────────────────────────────────────────
    return (
        <div>
            {/* Time-range tabs + legend */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                    {RANGES.map(r => (
                        <button
                            key={r.label}
                            onClick={() => setRange(r.label)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                range === r.label
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Highest
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Lowest
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-5 border-t-2 border-dashed border-blue-400 inline-block" /> Avg
                    </span>
                </div>
            </div>

            {/* Stat pills */}
            {stats && (
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                        { emoji: '📈', label: 'Highest', value: stats.high, cls: 'bg-red-50 border-red-200 text-red-700' },
                        { emoji: '📊', label: 'Average', value: stats.avg,  cls: 'bg-blue-50 border-blue-200 text-blue-700' },
                        { emoji: '📉', label: 'Lowest',  value: stats.low,  cls: 'bg-green-50 border-green-200 text-green-700' },
                    ].map(s => (
                        <div key={s.label} className={`border rounded-xl px-3 py-2.5 ${s.cls}`}>
                            <p className="text-xs font-medium opacity-60 mb-0.5">{s.emoji} {s.label}</p>
                            <p className="font-black text-sm sm:text-base">₹{Math.round(s.value).toLocaleString('en-IN')}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Recharts Line Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        orientation="right"
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

                    {/* Average reference line */}
                    {stats && (
                        <ReferenceLine
                            y={stats.avg}
                            stroke="#3b82f6"
                            strokeDasharray="6 4"
                            strokeWidth={1.5}
                            label={{
                                value: `Avg ₹${Math.round(stats.avg).toLocaleString('en-IN')}`,
                                position: 'insideBottomRight',
                                fill: '#2563eb',
                                fontSize: 10,
                                fontWeight: '600',
                            }}
                        />
                    )}

                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#7c3aed"
                        strokeWidth={2.5}
                        dot={(props) => <CustomDot {...props} stats={stats} />}
                        activeDot={{ r: 6, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
                    />
                </LineChart>
            </ResponsiveContainer>

            <p className="text-xs text-center text-gray-400 mt-3">
                Hover on the chart to see exact price and date
            </p>
        </div>
    );
}
