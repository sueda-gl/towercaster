// API Configuration
// All API calls go through serverless functions - keys stored in environment variables
// This file is kept for client-side configuration only (no secrets)

const CONFIG = {
    // OpenAI API settings (used by serverless functions)
    // Actual API key is stored in environment variables, not here
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
    OPENAI_EMBEDDINGS_ENDPOINT: 'https://api.openai.com/v1/embeddings',
    EMBEDDINGS_MODEL: 'text-embedding-ada-002',
    MODEL: 'gpt-4o',
    
    // Token limits (informational - actual limits enforced server-side)
    MAX_TOKENS: 200,
    TIER1_MAX_TOKENS: 500,
    TEMPERATURE: 0.7
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
