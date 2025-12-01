// Battle Logic Serverless Function
// Handles AI reasoning for battle outcomes using Azure OpenAI GPT-4o
// SECURITY: System prompts are controlled SERVER-SIDE, not by client

import { battleRateLimit, checkRateLimit } from './_lib/ratelimit.js';
import { configureCORS, handleCORSPreflight } from './_lib/cors.js';
import { getBattleSystemPrompt, getBattleUserPrompt, INPUT_LIMITS } from './_lib/prompts.js';

export default async function handler(req, res) {
    // Handle CORS with origin restriction (not wildcard)
    if (handleCORSPreflight(req, res)) return;
    if (!configureCORS(req, res)) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    // Check rate limit (10 requests per minute per IP)
    const rateLimitResult = await checkRateLimit(req, res, battleRateLimit);
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
        // SECURITY: Only accept game data, NOT system prompts
        const { 
            attackingConcept, 
            defendingConcept,
            // Optional tutorial context (server validates these)
            tutorialStep,
            tutorialFocus,
            suggestedAnswer
        } = req.body;

        // ============ INPUT VALIDATION ============
        
        // Required fields
        if (!attackingConcept || !defendingConcept) {
            return res.status(400).json({ 
                error: 'Missing required fields: attackingConcept and defendingConcept' 
            });
        }

        // Type validation
        if (typeof attackingConcept !== 'string' || typeof defendingConcept !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid input: concepts must be strings' 
            });
        }

        // Length validation (prevent token abuse)
        if (attackingConcept.length > INPUT_LIMITS.MAX_ATTACKING_CONCEPT) {
            return res.status(400).json({ 
                error: `Attacking concept too long (max ${INPUT_LIMITS.MAX_ATTACKING_CONCEPT} chars)` 
            });
        }
        
        if (defendingConcept.length > INPUT_LIMITS.MAX_DEFENDING_CONCEPT) {
            return res.status(400).json({ 
                error: `Defending concept too long (max ${INPUT_LIMITS.MAX_DEFENDING_CONCEPT} chars)` 
            });
        }

        // Sanitize inputs (basic - remove control characters)
        const sanitizedAttack = attackingConcept.trim().substring(0, INPUT_LIMITS.MAX_ATTACKING_CONCEPT);
        const sanitizedDefense = defendingConcept.trim().substring(0, INPUT_LIMITS.MAX_DEFENDING_CONCEPT);

        // Validate tutorial context if provided
        let tutorialOptions = {};
        if (tutorialStep !== undefined) {
            if (typeof tutorialStep !== 'number' || tutorialStep < 0 || tutorialStep > 5) {
                return res.status(400).json({ error: 'Invalid tutorial step' });
            }
            tutorialOptions = {
                tutorialStep,
                tutorialFocus: typeof tutorialFocus === 'string' ? tutorialFocus.substring(0, 200) : '',
                suggestedAnswer: typeof suggestedAnswer === 'string' ? suggestedAnswer.substring(0, 50) : '',
                playerChoice: sanitizedDefense
            };
        }

        // ============ GENERATE SERVER-SIDE PROMPTS ============
        
        // SECURITY: System prompt is generated on the server, NOT from client
        const systemPrompt = getBattleSystemPrompt(tutorialOptions);
        const userPrompt = getBattleUserPrompt(sanitizedAttack, sanitizedDefense);

        // ============ API CONFIGURATION ============
        
        const endpoint = 'https://api.openai.com/v1/chat/completions';
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
            console.error('Missing OPENAI_API_KEY');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Prepare headers for OpenAI
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };

        // Prepare request body with SERVER-CONTROLLED parameters
        const requestBody = {
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            max_tokens: INPUT_LIMITS.MAX_TOKENS_BATTLE,  // Server-controlled
            temperature: 0.7  // Server-controlled
        };

        console.log(`[Battle API] ${sanitizedAttack} vs ${sanitizedDefense}`);
        const startTime = Date.now();

        // Call the AI API
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        const duration = Date.now() - startTime;
        console.log(`[Battle API] Response received in ${duration}ms`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Battle API] Error ${response.status}:`, errorText);
            // SECURITY: Don't expose internal error details to client
            return res.status(502).json({ 
                error: 'AI service temporarily unavailable'
            });
        }

        const data = await response.json();
        
        // Return the AI response to the frontend
        return res.status(200).json(data);

    } catch (error) {
        console.error('[Battle API] Error:', error);
        // SECURITY: Don't expose internal error details
        return res.status(500).json({ 
            error: 'Internal server error'
        });
    }
}
