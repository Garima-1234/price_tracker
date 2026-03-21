/**
 * DealScanner — BuyHatke-style Deal Score panel
 * Props:
 *   product        — product object
 *   priceHistory   — array of {price, timestamp, platform}
 *   availablePrices — [{platform, price, mrp, url, inStock}]
 */
import { useMemo } from 'react';
import { TrendingDown, TrendingUp, Minus, ShieldCheck, AlertTriangle, Trophy, Zap } from 'lucide-react';

// ─── Speedometer Gauge ────────────────────────────────────────────────────────
function Speedometer({ score }) {
    const clamped = Math.min(Math.max(score, 0), 100);
    // Semicircle: 180° arc from left to right
    const R = 58;
    const CX = 70;
    const CY = 70;
    const startAngle = 180;
    const endAngle   = 0;   // (going counter-clockwise from left to right)

    // Convert score to angle (180° = 0, 0° = 100)
    const scoreAngle = 180 - (clamped / 100) * 180;

    // Needle end point
    const rad   = (scoreAngle * Math.PI) / 180;
    const nx    = CX + (R - 4) * Math.cos(rad);
    const ny    = CY - (R - 4) * Math.sin(rad);

    // Background arc path (full semicircle)
    const arcStart = polarToXY(CX, CY, R, 180);
    const arcEnd   = polarToXY(CX, CY, R, 0);

    // Colored arc (score portion)
    const colorEnd = polarToXY(CX, CY, R, scoreAngle);

    const color = clamped >= 80 ? '#10b981' : clamped >= 60 ? '#f59e0b' : clamped >= 40 ? '#f97316' : '#ef4444';

    return (
        <div className="flex flex-col items-center">
            <svg viewBox="0 0 140 80" className="w-48">
                {/* Background track */}
                <path
                    d={describeArc(CX, CY, R, 180, 0)}
                    fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round"
                />
                {/* Score arc */}
                <path
                    d={describeArc(CX, CY, R, 180, scoreAngle)}
                    fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                />
                {/* Zone labels */}
                <text x="14" y="76" fontSize="8" fill="#ef4444" fontWeight="600">Low</text>
                <text x="60" y="18" fontSize="8" fill="#f59e0b" fontWeight="600">Mid</text>
                <text x="106" y="76" fontSize="8" fill="#10b981" fontWeight="600">Top</text>

                {/* Needle */}
                <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx={CX} cy={CY} r="5" fill="#1f2937" />

                {/* Score number */}
                <text x={CX} y={CY + 22} textAnchor="middle" fontSize="18" fontWeight="800" fill={color}>
                    {Math.round(clamped)}
                </text>
            </svg>
            <p className="text-xs text-gray-500 -mt-1">Deal Score</p>
        </div>
    );
}

function polarToXY(cx, cy, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToXY(cx, cy, r, startAngle);
    const end   = polarToXY(cx, cy, r, endAngle);
    const largeArc = Math.abs(startAngle - endAngle) > 180 ? 1 : 0;
    // Going right means decreasing angle
    const sweep = startAngle > endAngle ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
}

// ─── Deal Score Calculator ────────────────────────────────────────────────────
function calcDealScore(product, priceHistory, currentPrice, mrp) {
    const breakdown = [];
    let total = 0;

    const allPrices = priceHistory.map(h => h.price).filter(Boolean);
    const avgPrice  = allPrices.length ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : currentPrice;
    const maxPrice  = allPrices.length ? Math.max(...allPrices) : currentPrice;
    const minEver   = allPrices.length ? Math.min(...allPrices) : currentPrice;

    // Rule 1: Below last sale price
    if (allPrices.length >= 2) {
        const lastSalePrice = allPrices[allPrices.length - 2];
        if (currentPrice < lastSalePrice) {
            const pts = Math.min(30, Math.round(((lastSalePrice - currentPrice) / lastSalePrice) * 100));
            breakdown.push({ label: `Below Last sale price (₹${Math.round(lastSalePrice).toLocaleString('en-IN')})`, pts, positive: true });
            total += pts;
        } else {
            breakdown.push({ label: `Below Last sale price (₹${Math.round(lastSalePrice).toLocaleString('en-IN')})`, pts: 0, positive: false });
        }
    }

    // Rule 2: No price hike before sale
    const recentPrices = allPrices.slice(-7);
    const isFlat = recentPrices.every(p => Math.abs(p - currentPrice) / currentPrice < 0.05);
    if (isFlat || recentPrices.length < 2) {
        breakdown.push({ label: 'No Price hike before sale', pts: 25, positive: true });
        total += 25;
    } else {
        breakdown.push({ label: 'Price was hiked before sale', pts: 0, positive: false });
    }

    // Rule 3: At all-time low
    const atlPrice = product?.allTimeLow?.price || minEver;
    if (currentPrice <= atlPrice * 1.02) {
        breakdown.push({ label: `At All time low price (₹${Math.round(atlPrice).toLocaleString('en-IN')})`, pts: 20, positive: true });
        total += 20;
    } else {
        breakdown.push({ label: `All time low was ₹${Math.round(atlPrice).toLocaleString('en-IN')}`, pts: 0, positive: false });
    }

    // Rule 4: At 6-month low
    const sixMonthPrices = allPrices.slice(-180);
    const sixMonthLow = sixMonthPrices.length ? Math.min(...sixMonthPrices) : currentPrice;
    if (currentPrice <= sixMonthLow * 1.05) {
        breakdown.push({ label: `At 6 months low (₹${Math.round(sixMonthLow).toLocaleString('en-IN')})`, pts: 15, positive: true });
        total += 15;
    } else {
        breakdown.push({ label: `6 month low was ₹${Math.round(sixMonthLow).toLocaleString('en-IN')}`, pts: 0, positive: false });
    }

    // Rule 5: Below average
    if (currentPrice < avgPrice) {
        const pts = Math.min(10, Math.round(((avgPrice - currentPrice) / avgPrice) * 50));
        breakdown.push({ label: `Below average price (₹${Math.round(avgPrice).toLocaleString('en-IN')})`, pts, positive: true });
        total += pts;
    } else {
        breakdown.push({ label: `Average price is ₹${Math.round(avgPrice).toLocaleString('en-IN')}`, pts: 0, positive: false });
    }

    return { score: Math.min(total, 100), breakdown, avgPrice, maxPrice, minEver };
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function DealBadge({ score }) {
    if (score >= 85) return (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 mb-3">
            <Zap className="w-5 h-5 text-green-600 fill-green-500" />
            <span className="font-bold text-green-800 text-sm">Epic Hatke Steal 🚀</span>
        </div>
    );
    if (score >= 65) return (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-blue-800 text-sm">Good Deal ✅</span>
        </div>
    );
    if (score >= 45) return (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-3">
            <Minus className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-800 text-sm">Average Deal 🤔</span>
        </div>
    );
    return (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="font-bold text-red-700 text-sm">May Not Be Worth It ⚠️</span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DealScanner({ product, priceHistory = [], availablePrices = [] }) {
    const currentPrice = availablePrices[0]?.price || 0;
    const currentMrp   = availablePrices[0]?.mrp   || currentPrice;

    const { score, breakdown, avgPrice, maxPrice, minEver } = useMemo(() =>
        calcDealScore(product, priceHistory, currentPrice, currentMrp),
        [product, priceHistory, currentPrice]
    );

    const isAllTimeLow = currentPrice > 0 && currentPrice <= (product?.allTimeLow?.price || minEver) * 1.02;
    const isFakeDiscount = product?.fakeDiscountFlags?.[availablePrices[0]?.platform]?.isFake;
    const fakeReason = product?.fakeDiscountFlags?.[availablePrices[0]?.platform]?.reason;

    if (!currentPrice) return null;

    return (
        <div className="card border-2 border-purple-100 p-6 sticky top-20">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span className="text-purple-600">🔍</span> Deal Scanner
            </h3>

            {/* Speedometer + Badge */}
            <DealBadge score={score} />
            <div className="flex justify-center mb-2">
                <Speedometer score={score} />
            </div>

            {/* Lowest Price Ever Banner */}
            {isAllTimeLow && (
                <div className="bg-green-500 text-white rounded-xl px-4 py-2 mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <div>
                        <p className="font-bold text-sm">Lowest Price Ever! 🏆</p>
                        <p className="text-xs opacity-90">Best price we've ever recorded</p>
                    </div>
                </div>
            )}

            {/* Fake Discount Warning */}
            {isFakeDiscount && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-red-700 text-sm">Possibly Inflated MRP</p>
                        <p className="text-xs text-red-600">{fakeReason}</p>
                    </div>
                </div>
            )}

            {/* Price Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-xs text-red-500 font-medium flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Highest
                    </p>
                    <p className="font-bold text-sm text-red-700">₹{Math.round(maxPrice).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2">
                    <p className="text-xs text-blue-500 font-medium flex items-center justify-center gap-1">
                        <Minus className="w-3 h-3" /> Average
                    </p>
                    <p className="font-bold text-sm text-blue-700">₹{Math.round(avgPrice).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-green-500 font-medium flex items-center justify-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Lowest
                    </p>
                    <p className="font-bold text-sm text-green-700">₹{Math.round(minEver).toLocaleString('en-IN')}</p>
                </div>
            </div>

            {/* Deal Score Breakup */}
            <div className="border-t pt-4">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase">
                    <span>Deal Score Breakup</span>
                    <span>Pts</span>
                </div>
                <div className="space-y-1.5">
                    {breakdown.map((item, i) => (
                        <div key={i} className="flex justify-between items-start gap-2">
                            <div className="flex items-start gap-1.5">
                                <span className={`mt-0.5 flex-shrink-0 w-3 h-3 rounded-full border-2 ${item.positive ? 'bg-green-400 border-green-500' : 'bg-gray-300 border-gray-400'}`} />
                                <span className="text-xs text-gray-600 leading-tight">{item.label}</span>
                            </div>
                            <span className={`text-xs font-bold flex-shrink-0 ${item.positive ? 'text-green-600' : 'text-gray-400'}`}>
                                {item.pts > 0 ? item.pts : '—'}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="border-t mt-3 pt-2 flex justify-between">
                    <span className="text-sm font-bold">Total Score</span>
                    <span className="text-sm font-bold text-purple-600">{score}/100</span>
                </div>
            </div>
        </div>
    );
}
