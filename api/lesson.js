// Lesson Generation Serverless Function
// Handles AI-powered tutorial lesson generation using Azure OpenAI
// SECURITY: System prompts are controlled SERVER-SIDE, not by client

import { lessonRateLimit, checkRateLimit } from './_lib/ratelimit.js';
import { configureCORS, handleCORSPreflight } from './_lib/cors.js';
import { getLessonSystemPrompt, INPUT_LIMITS } from './_lib/prompts.js';

export default async function handler(req, res) {
    // Handle CORS with origin restriction (not wildcard)
    if (handleCORSPreflight(req, res)) return;
    if (!configureCORS(req, res)) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    // Check rate limit (20 requests per hour per IP)
    const rateLimitResult = await checkRateLimit(req, res, lessonRateLimit);
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
        // SECURITY: Accept lesson context data, NOT raw prompts
        const { 
            attackingConcept,
            defendingConcept,
            battleOutcome,
            battleExplanation,
            tutorialStep,
            tutorialFocus,
            suggestedAnswer,
            followedHint,
            tier1Reasoning
        } = req.body;

        // ============ INPUT VALIDATION ============
        
        // Required fields
        if (!attackingConcept || !defendingConcept || !battleOutcome) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        // Type validation
        if (typeof attackingConcept !== 'string' || typeof defendingConcept !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid input types' 
            });
        }

        // Length validation
        if (attackingConcept.length > INPUT_LIMITS.MAX_ATTACKING_CONCEPT ||
            defendingConcept.length > INPUT_LIMITS.MAX_DEFENDING_CONCEPT) {
            return res.status(400).json({ 
                error: 'Input too long' 
            });
        }

        // Sanitize inputs
        const sanitizedAttack = attackingConcept.trim().substring(0, INPUT_LIMITS.MAX_ATTACKING_CONCEPT);
        const sanitizedDefense = defendingConcept.trim().substring(0, INPUT_LIMITS.MAX_DEFENDING_CONCEPT);
        const sanitizedOutcome = String(battleOutcome).substring(0, 50);
        const sanitizedExplanation = String(battleExplanation || '').substring(0, 500);
        const sanitizedFocus = String(tutorialFocus || '').substring(0, 200);
        const sanitizedSuggested = String(suggestedAnswer || '').substring(0, 50);
        const sanitizedReasoning = String(tier1Reasoning || '').substring(0, 1000);

        // ============ GENERATE SERVER-SIDE PROMPTS ============
        
        const systemPrompt = getLessonSystemPrompt({ 
            hasTier1Reasoning: !!tier1Reasoning 
        });

        // Build user prompt server-side
        let userPrompt = '';
        
        if (followedHint) {
            userPrompt = `Write a SHORT lesson (2-3 sentences):

Battle outcome: ${sanitizedOutcome}
What happened: ${sanitizedExplanation}
Lesson to teach: ${sanitizedFocus}

${sanitizedReasoning ? `INTERNAL REASONING (for context):
${sanitizedReasoning}

` : ''}Format: 

Line 1: YOU LEARNED: [Emoji] [OUTCOME LABEL]
Line 2+: Your lesson (no need to repeat what happened in the battle - just teach the mechanic)

Use these exact labels:
- ✅ VICTORY (for direct_win)
- 💀 DEFEATED (for direct_loss)
- 💥 BACKFIRE (for backfire_win - NOT "BACKFIRE WIN")
- 🚫 INEFFECTIVE (for neutral_no_damage)
- ⚔️ MUTUAL DESTRUCTION (for mutual_destruction)

Remember: Say "your tower" (player is blue), say "AI's tower" (AI is red).
Keep it SHORT and clear.`;
        } else {
            const sameOutcome = sanitizedOutcome === sanitizedFocus?.split(' - ')[0]?.toLowerCase().replace(/ /g, '_');
            
            userPrompt = `Player used "${sanitizedDefense}" instead of suggested "${sanitizedSuggested}".

What ACTUALLY happened:
- Outcome: ${sanitizedOutcome}
- Result: ${sanitizedExplanation}

${sanitizedReasoning ? `INTERNAL REASONING (for context):
${sanitizedReasoning}

` : ''}What we WANTED to teach: ${sanitizedFocus}

Write SHORT, NATURAL lesson:

1. First line: "YOU LEARNED: [Emoji] [OUTCOME LABEL]"
   Use labels: ✅ VICTORY, 💀 DEFEATED, 💥 BACKFIRE, 🚫 INEFFECTIVE, ⚔️ MUTUAL DESTRUCTION

2. Then the lesson - acknowledge what happened with their choice.

Keep it SHORT and clear. 2-3 sentences total.`;
        }

        // Check if this is the last tutorial step
        const isLastStep = tutorialStep === 5;
        if (isLastStep) {
            userPrompt += `

IMPORTANT: This is the FINAL step. End with:

"🎓 TUTORIAL COMPLETE!
You've mastered all 5 outcome types:
✅ Direct Win | 💀 Direct Loss | 💥 Backfire | 🚫 Ineffective | ⚔️ Mutual Destruction

⚔️ REAL GAME STARTS NOW! Be creative - anything works!"`;
        }

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
            max_tokens: INPUT_LIMITS.MAX_TOKENS_LESSON,  // Server-controlled
            temperature: 0.7  // Server-controlled
        };

        console.log('[Lesson API] Generating lesson message...');
        const startTime = Date.now();

        // Call the AI API
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        const duration = Date.now() - startTime;
        console.log(`[Lesson API] Response received in ${duration}ms`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Lesson API] Error ${response.status}:`, errorText);
            // SECURITY: Don't expose internal error details
            return res.status(502).json({ 
                error: 'AI service temporarily unavailable'
            });
        }

        const data = await response.json();
        
        // Return the AI response to the frontend
        return res.status(200).json(data);

    } catch (error) {
        console.error('[Lesson API] Error:', error);
        // SECURITY: Don't expose internal error details
        return res.status(500).json({ 
            error: 'Internal server error'
        });
    }
}
