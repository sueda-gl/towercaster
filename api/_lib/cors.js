// CORS Configuration
// Restricts API access to authorized domains only

/**
 * Configure CORS headers for API endpoints
 * More secure than allowing all origins (*)
 */
export function configureCORS(req, res) {
    // Define allowed origins - UPDATE THESE WITH YOUR ACTUAL DOMAINS
    const allowedOrigins = [
        // Production domains (add your actual domain here)
        process.env.ALLOWED_ORIGIN || null,  // Set via Vercel env var
        
        // Vercel deployment URLs (auto-detected)
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
        process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
        
        // Development URLs
        process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
        process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : null,
        process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null,
        process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3000' : null,
        process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:5173' : null,
    ].filter(Boolean);
    
    // Get the origin from the request
    const origin = req.headers.origin;
    
    // Check if origin is allowed
    // Allow: exact matches, Vercel preview deployments, or same-origin (no origin header)
    const isAllowed = allowedOrigins.includes(origin) || 
                      (origin && origin.endsWith('.vercel.app')) || // Allow Vercel preview deployments
                      !origin; // Allow same-origin requests (no origin header)
    
    if (isAllowed && origin) {
        // Set CORS headers for allowed origin
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else if (!origin) {
        // Same-origin request (no origin header) - allow it
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
        // Origin not allowed - but we still need to set headers for preflight
        // The actual request will be blocked by browser
        res.setHeader('Access-Control-Allow-Origin', 'null');
        console.warn(`[CORS] Blocked request from unauthorized origin: ${origin}`);
    }
    
    // Set other CORS headers
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    
    return isAllowed || !origin;
}

/**
 * Handle CORS preflight (OPTIONS) requests
 */
export function handleCORSPreflight(req, res) {
    if (req.method === 'OPTIONS') {
        configureCORS(req, res);
        res.status(200).end();
        return true;
    }
    return false;
}

/**
 * More permissive CORS for development (use with caution)
 */
export function configureDevCORS(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
}




