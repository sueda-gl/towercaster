// Rate Limiting Utility
// Uses Upstash Redis for serverless-friendly rate limiting
// Protects API endpoints from abuse and excessive costs

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client (only if credentials are available)
let redis = null;
let rateLimitingEnabled = false;

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        rateLimitingEnabled = true;
        console.log('[Rate Limit] Upstash Redis initialized');
    } else {
        console.warn('[Rate Limit] Upstash credentials not found - rate limiting disabled');
    }
} catch (error) {
    console.error('[Rate Limit] Failed to initialize Redis:', error.message);
    rateLimitingEnabled = false;
}

// Define rate limiters for each endpoint
// Using sliding window algorithm for fair rate limiting

export const battleRateLimit = rateLimitingEnabled ? new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
    prefix: 'ratelimit:battle',
}) : null;

export const lessonRateLimit = rateLimitingEnabled ? new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'), // 20 requests per hour
    analytics: true,
    prefix: 'ratelimit:lesson',
}) : null;

export const embeddingRateLimit = rateLimitingEnabled ? new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
    analytics: true,
    prefix: 'ratelimit:embedding',
}) : null;

/**
 * Get client identifier from request
 * Uses IP address from various header sources (Vercel, proxies, etc.)
 * 
 * @param {Request} req - HTTP request object
 * @returns {string} Client identifier (IP address or 'unknown')
 */
export function getClientId(req) {
    // Check for IP from various sources (in priority order)
    const forwarded = req.headers['x-forwarded-for'];
    const real = req.headers['x-real-ip'];
    const vercelIp = req.headers['x-vercel-forwarded-for'];
    
    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
    // We want the first one (original client)
    if (forwarded) {
        const ips = forwarded.split(',').map(ip => ip.trim());
        return ips[0];
    }
    
    if (vercelIp) {
        return vercelIp;
    }
    
    if (real) {
        return real;
    }
    
    // Fallback to socket address (less reliable in serverless)
    if (req.socket?.remoteAddress) {
        return req.socket.remoteAddress;
    }
    
    // Last resort
    return 'unknown';
}

/**
 * Check rate limit for a request
 * Returns rate limit status and adds appropriate headers to response
 * 
 * @param {Request} req - HTTP request object
 * @param {Response} res - HTTP response object
 * @param {Ratelimit} rateLimiter - Rate limiter instance
 * @returns {Promise<{success: boolean, limit: number, remaining: number, reset: number}>}
 */
export async function checkRateLimit(req, res, rateLimiter) {
    // If rate limiting is disabled, always allow
    if (!rateLimitingEnabled || !rateLimiter) {
        console.warn('[Rate Limit] Rate limiting is disabled - allowing request');
        return { success: true, limit: 0, remaining: 0, reset: 0 };
    }
    
    try {
        const clientId = getClientId(req);
        console.log(`[Rate Limit] Checking rate limit for: ${clientId}`);
        
        const result = await rateLimiter.limit(clientId);
        
        // Add standard rate limit headers (RFC 6585)
        res.setHeader('X-RateLimit-Limit', result.limit.toString());
        res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
        res.setHeader('X-RateLimit-Reset', new Date(result.reset).toISOString());
        
        if (!result.success) {
            console.warn(`[Rate Limit] Rate limit exceeded for ${clientId}`);
            // Add Retry-After header (in seconds)
            const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
            res.setHeader('Retry-After', retryAfter.toString());
        }
        
        return result;
    } catch (error) {
        console.error('[Rate Limit] Error checking rate limit:', error.message);
        // On error, allow the request (fail open)
        return { success: true, limit: 0, remaining: 0, reset: 0 };
    }
}

// Export flag for other modules to check if rate limiting is enabled
export const isRateLimitingEnabled = rateLimitingEnabled;




