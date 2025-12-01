// Embedding Serverless Function
// Handles semantic matching using OpenAI embeddings API
// SECURITY: Input validated and sanitized server-side

import { embeddingRateLimit, checkRateLimit } from './_lib/ratelimit.js';
import { configureCORS, handleCORSPreflight } from './_lib/cors.js';

// Maximum text length for embeddings
const MAX_TEXT_LENGTH = 500;

export default async function handler(req, res) {
    // Handle CORS with origin restriction (not wildcard)
    if (handleCORSPreflight(req, res)) return;
    if (!configureCORS(req, res)) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    // Check rate limit (30 requests per minute per IP)
    const rateLimitResult = await checkRateLimit(req, res, embeddingRateLimit);
    if (!rateLimitResult.success) {
        const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
        return res.status(429).json({ 
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: retryAfter,
            limit: rateLimitResult.limit,
            reset: new Date(rateLimitResult.reset).toISOString()
        });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;

        // ============ INPUT VALIDATION ============
        
        // Required field
        if (!text) {
            return res.status(400).json({ 
                error: 'Missing required field: text' 
            });
        }

        // Type validation
        if (typeof text !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid input: text must be a string' 
            });
        }

        // Length validation
        if (text.length > MAX_TEXT_LENGTH) {
            return res.status(400).json({ 
                error: `Text too long (max ${MAX_TEXT_LENGTH} characters)` 
            });
        }

        // Sanitize input
        const sanitizedText = text.trim().substring(0, MAX_TEXT_LENGTH);

        if (!sanitizedText) {
            return res.status(400).json({ 
                error: 'Text cannot be empty' 
            });
        }

        // ============ API CALL ============
        
        // Get OpenAI credentials (embeddings always use standard OpenAI, not Azure)
        const apiKey = process.env.OPENAI_API_KEY;
        const endpoint = 'https://api.openai.com/v1/embeddings';
        
        if (!apiKey) {
            console.error('Missing OPENAI_API_KEY');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        console.log(`[Embedding API] Fetching embedding for: "${sanitizedText.substring(0, 30)}..."`);
        const startTime = Date.now();

        // Call OpenAI Embeddings API
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                input: sanitizedText,
                model: 'text-embedding-ada-002'
            })
        });

        const duration = Date.now() - startTime;
        console.log(`[Embedding API] Response received in ${duration}ms`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Embedding API] Error ${response.status}:`, errorText);
            // SECURITY: Don't expose internal error details
            return res.status(502).json({ 
                error: 'Embedding service temporarily unavailable'
            });
        }

        const data = await response.json();
        
        // Return the embedding response to the frontend
        return res.status(200).json(data);

    } catch (error) {
        console.error('[Embedding API] Error:', error);
        // SECURITY: Don't expose internal error details
        return res.status(500).json({ 
            error: 'Internal server error'
        });
    }
}





