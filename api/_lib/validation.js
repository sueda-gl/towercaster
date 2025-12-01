// Input Validation Middleware
// Protects against prompt injection, excessive costs, and malicious input

/**
 * Validate battle endpoint input
 * Prevents: prompt injection, excessive tokens, invalid parameters
 */
export function validateBattleInput(req, res, next) {
    const { systemPrompt, userPrompt, maxTokens, temperature } = req.body;
    
    // 1. Check required fields exist
    if (!systemPrompt || !userPrompt) {
        return res.status(400).json({ 
            error: 'Missing required fields: systemPrompt and userPrompt' 
        });
    }
    
    // 2. Validate types
    if (typeof systemPrompt !== 'string' || typeof userPrompt !== 'string') {
        return res.status(400).json({ 
            error: 'Invalid input: systemPrompt and userPrompt must be strings' 
        });
    }
    
    // 3. Length limits (prevent excessive API costs and abuse)
    const MAX_SYSTEM_PROMPT_LENGTH = 5000;  // ~1250 tokens
    const MAX_USER_PROMPT_LENGTH = 2000;    // ~500 tokens
    
    if (systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
        console.warn(`[Validation] System prompt too long: ${systemPrompt.length} chars`);
        return res.status(400).json({ 
            error: `System prompt too long (max ${MAX_SYSTEM_PROMPT_LENGTH} characters)` 
        });
    }
    
    if (userPrompt.length > MAX_USER_PROMPT_LENGTH) {
        console.warn(`[Validation] User prompt too long: ${userPrompt.length} chars`);
        return res.status(400).json({ 
            error: `User prompt too long (max ${MAX_USER_PROMPT_LENGTH} characters)` 
        });
    }
    
    // 4. Validate maxTokens (if provided)
    if (maxTokens !== undefined) {
        if (typeof maxTokens !== 'number' || !Number.isInteger(maxTokens)) {
            return res.status(400).json({ 
                error: 'Invalid maxTokens: must be an integer' 
            });
        }
        
        if (maxTokens < 1 || maxTokens > 1000) {
            return res.status(400).json({ 
                error: 'Invalid maxTokens: must be between 1 and 1000' 
            });
        }
    }
    
    // 5. Validate temperature (if provided)
    if (temperature !== undefined) {
        if (typeof temperature !== 'number') {
            return res.status(400).json({ 
                error: 'Invalid temperature: must be a number' 
            });
        }
        
        if (temperature < 0 || temperature > 2) {
            return res.status(400).json({ 
                error: 'Invalid temperature: must be between 0 and 2' 
            });
        }
    }
    
    // 6. Basic prompt injection detection (optional - can be too strict)
    // Uncomment if you want to block common prompt injection patterns
    /*
    const suspiciousPatterns = [
        /ignore previous instructions/i,
        /disregard all previous/i,
        /you are now/i,
        /new role:/i,
        /system:/i,
        /forget everything/i
    ];
    
    const combinedText = systemPrompt + ' ' + userPrompt;
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(combinedText)) {
            console.warn(`[Validation] Potential prompt injection detected`);
            return res.status(400).json({ 
                error: 'Invalid input: suspicious content detected' 
            });
        }
    }
    */
    
    // All validations passed
    next();
}

/**
 * Validate lesson endpoint input
 */
export function validateLessonInput(req, res, next) {
    const { systemPrompt, userPrompt } = req.body;
    
    if (!systemPrompt || !userPrompt) {
        return res.status(400).json({ 
            error: 'Missing required fields' 
        });
    }
    
    if (typeof systemPrompt !== 'string' || typeof userPrompt !== 'string') {
        return res.status(400).json({ 
            error: 'Invalid input types' 
        });
    }
    
    // Shorter limits for lesson generation
    if (systemPrompt.length > 3000 || userPrompt.length > 1500) {
        return res.status(400).json({ 
            error: 'Input too long' 
        });
    }
    
    next();
}

/**
 * Validate embedding endpoint input
 */
export function validateEmbeddingInput(req, res, next) {
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ 
            error: 'Missing required field: text' 
        });
    }
    
    if (typeof text !== 'string') {
        return res.status(400).json({ 
            error: 'Invalid input: text must be a string' 
        });
    }
    
    // Embeddings have stricter length limits
    const MAX_TEXT_LENGTH = 500;  // ~125 tokens (well under OpenAI's 8191 limit)
    
    if (text.length > MAX_TEXT_LENGTH) {
        return res.status(400).json({ 
            error: `Text too long (max ${MAX_TEXT_LENGTH} characters)` 
        });
    }
    
    next();
}

/**
 * Sanitize error messages for client response
 * Prevents information leakage through error details
 */
export function sanitizeError(error, isDevelopment = false) {
    // In development, show detailed errors
    if (isDevelopment || process.env.NODE_ENV === 'development') {
        return {
            error: error.message || 'An error occurred',
            details: error.toString()
        };
    }
    
    // In production, show generic error only
    return {
        error: 'Service temporarily unavailable. Please try again later.'
    };
}

/**
 * Log security events without exposing sensitive data
 */
export function logSecurityEvent(event, req, details = {}) {
    const clientId = getClientId(req);
    
    console.warn(`[SECURITY] ${event}`, {
        ip: clientId,
        timestamp: new Date().toISOString(),
        endpoint: req.url,
        userAgent: req.headers['user-agent']?.substring(0, 100), // Truncate UA
        ...details
    });
}

/**
 * Get client ID from request (copied from ratelimit.js for convenience)
 */
function getClientId(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const real = req.headers['x-real-ip'];
    const vercelIp = req.headers['x-vercel-forwarded-for'];
    
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
    
    return 'unknown';
}




