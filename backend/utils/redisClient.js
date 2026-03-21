/**
 * Redis client with graceful fallback when Redis is unavailable.
 * All cache calls become no-ops if Redis is not configured/reachable.
 */
let redis = null;

// Only initialise Redis if configured
if (process.env.REDIS_URL) {
    try {
        const Redis = require('ioredis');
        redis = new Redis(process.env.REDIS_URL, {
            lazyConnect: true,
            connectTimeout: 5000,
            maxRetriesPerRequest: 1,
            enableReadyCheck: false,
        });

        redis.on('connect', () => console.log('✅ Redis connected'));
        redis.on('error', (err) => {
            console.warn('⚠️  Redis error (non-fatal):', err.message);
            redis = null; // fall back to no-cache
        });
    } catch (err) {
        console.warn('⚠️  ioredis not installed — running without cache');
    }
}

/**
 * Try to get a cached value. Returns null on miss or when Redis is unavailable.
 */
async function cacheGet(key) {
    if (!redis) return null;
    try {
        const val = await redis.get(key);
        return val ? JSON.parse(val) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Cache a value with an optional TTL in seconds (default 5 min).
 */
async function cacheSet(key, value, ttlSeconds = 300) {
    if (!redis) return;
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (e) {
        // non-fatal
    }
}

/**
 * Invalidate one or more cache keys.
 */
async function cacheDel(...keys) {
    if (!redis) return;
    try {
        await redis.del(...keys);
    } catch (e) {}
}

module.exports = { cacheGet, cacheSet, cacheDel };
