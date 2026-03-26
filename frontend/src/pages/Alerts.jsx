import { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCircle, Clock, AlertTriangle, Plus, ExternalLink } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function Alerts({ user }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState(user?.email || '');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ productId: '', productName: '', targetPrice: '', platform: 'any', email: user?.email || '' });
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (email) loadAlerts();
    }, [email]);

    async function loadAlerts() {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/alerts?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (data.success) setAlerts(data.alerts || []);
        } catch {
            setAlerts(DEMO_ALERTS);
        } finally {
            setLoading(false);
        }
    }

    async function deleteAlert(id) {
        try {
            await fetch(`${API_BASE}/alerts/${id}`, { method: 'DELETE' });
            setAlerts(prev => prev.filter(a => a._id !== id));
        } catch (e) {
            console.error(e);
        }
    }

    async function createAlert(e) {
        e.preventDefault();
        setStatus('Creating alert…');
        try {
            const res = await fetch(`${API_BASE}/alerts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, email: email }),
            });
            const data = await res.json();
            if (data.success) {
                setStatus('✅ Alert created!');
                setShowForm(false);
                loadAlerts();
            } else throw new Error(data.error);
        } catch (err) {
            setStatus(`❌ ${err.message}`);
        }
    }

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Price Alerts</h1>
                            <p className="text-sm text-gray-500">Get notified when prices drop</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(s => !s)}
                        className="btn-primary flex items-center gap-2 px-4 py-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Alert
                    </button>
                </div>

                {/* Email lookup */}
                {!user && (
                    <div className="card p-5 mb-6">
                        <label className="block text-sm font-medium mb-2">Your email to view alerts</label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="input-field flex-1"
                                placeholder="email@example.com"
                            />
                            <button onClick={loadAlerts} className="btn-secondary px-4">Load</button>
                        </div>
                    </div>
                )}

                {/* Create Alert form */}
                {showForm && (
                    <div className="card p-6 mb-6 border-2 border-purple-200">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-purple-600" />
                            Create Price Alert
                        </h3>
                        <form onSubmit={createAlert} className="space-y-3">
                            <input
                                className="input-field"
                                placeholder="Product name (optional)"
                                value={form.productName}
                                onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
                            />
                            <input
                                className="input-field"
                                placeholder="Product ID or URL (required)"
                                value={form.productId}
                                onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                                required
                            />
                            <input
                                type="number"
                                className="input-field"
                                placeholder="Alert me when price drops below ₹"
                                value={form.targetPrice}
                                onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))}
                                required
                            />
                            <select
                                className="input-field"
                                value={form.platform}
                                onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                            >
                                <option value="any">Any platform</option>
                                <option value="amazon">Amazon</option>
                                <option value="flipkart">Flipkart</option>
                                <option value="ajio">Ajio</option>
                            </select>
                            {!user && (
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="Your email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            )}
                            <div className="flex gap-2">
                                <button type="submit" className="btn-primary flex-1">Set Alert</button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary px-4">Cancel</button>
                            </div>
                            {status && <p className="text-sm text-center mt-1">{status}</p>}
                        </form>
                    </div>
                )}

                {/* Alerts list */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card p-4 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                                <div className="h-4 bg-gray-100 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : alerts.length > 0 ? (
                    <div className="space-y-4">
                        {alerts.map(alert => (
                            <AlertCard key={alert._id} alert={alert} onDelete={deleteAlert} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No alerts set</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Search for a product and click "Set Alert" to get notified on price drops.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function AlertCard({ alert, onDelete }) {
    const isTriggered = alert.triggered;
    const isPending   = !isTriggered;

    const platformColors = {
        amazon: 'bg-orange-100 text-orange-700',
        flipkart: 'bg-blue-100 text-blue-700',
        ajio: 'bg-teal-100 text-teal-700',
        any: 'bg-gray-100 text-gray-600',
    };

    return (
        <div className={`card p-5 border-l-4 ${isTriggered ? 'border-green-500' : 'border-amber-400'}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {isTriggered
                            ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            : <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        }
                        <span className="font-semibold text-sm">
                            {alert.productName || `Product ${alert.productId?.toString().substring(0, 8)}…`}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                            Alert at ₹{alert.targetPrice?.toLocaleString('en-IN')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${platformColors[alert.platform] || platformColors.any}`}>
                            {alert.platform}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isTriggered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isTriggered ? `✅ Triggered @ ₹${alert.triggeredPrice?.toLocaleString('en-IN')}` : '⏳ Watching…'}
                        </span>
                    </div>

                    {isTriggered && alert.triggeredAt && (
                        <p className="text-xs text-gray-400 mt-1">
                            Triggered on {new Date(alert.triggeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    )}
                </div>

                <button
                    onClick={() => onDelete(alert._id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Delete alert"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

const DEMO_ALERTS = [
    { _id: '1', productName: 'boAt Rockerz Headphones', targetPrice: 999, platform: 'amazon', triggered: true, triggeredAt: new Date().toISOString(), triggeredPrice: 899 },
    { _id: '2', productName: 'Redmi Note 12', targetPrice: 11999, platform: 'flipkart', triggered: false },
    { _id: '3', productName: 'Sony WH-1000XM4', targetPrice: 15000, platform: 'any', triggered: false },
];
