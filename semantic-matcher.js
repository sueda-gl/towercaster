// Semantic Matcher
// Uses OpenAI embeddings to match user input to closest material
// OPTIMIZATION: Pre-computed embeddings are loaded from JSON to avoid API calls on first load

class SemanticMatcher {
    constructor() {
        this.embeddingsCache = {};
        this.precomputedLoaded = false;
        this.loadPrecomputedEmbeddings();
        this.loadCache();
    }

    // Load pre-computed embeddings from JSON file (instant, no API calls)
    loadPrecomputedEmbeddings() {
        this.precomputedPromise = fetch('precomputed-embeddings.json')
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Not found');
            })
            .then(precomputed => {
                // Merge pre-computed embeddings into cache (don't overwrite user-fetched ones)
                for (const [name, embedding] of Object.entries(precomputed)) {
                    if (!this.embeddingsCache[name]) {
                        this.embeddingsCache[name] = embedding;
                    }
                }
                this.precomputedLoaded = true;
                console.log('✅ Loaded pre-computed embeddings for', Object.keys(precomputed).length, 'materials (instant load!)');
                return true;
            })
            .catch(error => {
                console.log('ℹ️ Pre-computed embeddings not available, will fetch on-demand');
                this.precomputedLoaded = true; // Mark as done even if failed
                return false;
            });
    }

    // Wait for pre-computed embeddings to load (call before first match)
    async waitForPrecomputed() {
        if (this.precomputedPromise) {
            await this.precomputedPromise;
        }
    }

    // Load cached embeddings from localStorage
    loadCache() {
        try {
            const cached = localStorage.getItem('material_embeddings');
            if (cached) {
                const parsedCache = JSON.parse(cached);
                // Merge with existing (pre-computed embeddings take priority for materials)
                this.embeddingsCache = { ...parsedCache, ...this.embeddingsCache };
                console.log('Loaded cached embeddings for', Object.keys(this.embeddingsCache).length, 'materials');
            }
        } catch (error) {
            console.error('Error loading embeddings cache:', error);
        }
    }

    // Save embeddings to localStorage
    saveCache() {
        try {
            localStorage.setItem('material_embeddings', JSON.stringify(this.embeddingsCache));
            console.log('Saved embeddings cache');
        } catch (error) {
            console.error('Error saving embeddings cache:', error);
        }
    }

    // Get embedding vector from OpenAI
    async getEmbedding(text) {
        // Check cache first
        if (this.embeddingsCache[text]) {
            console.log(`Using cached embedding for: ${text}`);
            return this.embeddingsCache[text];
        }

        try {
            // Call our secure serverless function instead of OpenAI directly
            console.log(`Fetching embedding for: ${text}`);
            const response = await fetch('/api/embedding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Embedding API error ${response.status}:`, errorData);
                throw new Error(`Embedding API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            const embedding = data.data[0].embedding;
            
            console.log(`Successfully got embedding for: ${text} (${embedding.length} dimensions)`);
            
            // Cache the result
            this.embeddingsCache[text] = embedding;
            this.saveCache();
            
            return embedding;
        } catch (error) {
            console.error('Error getting embedding:', error);
            return null;
        }
    }

    // Calculate cosine similarity between two vectors
    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) {
            return 0;
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        normA = Math.sqrt(normA);
        normB = Math.sqrt(normB);

        if (normA === 0 || normB === 0) {
            return 0;
        }

        return dotProduct / (normA * normB);
    }

    // Initialize embeddings for all materials in database
    async initializeEmbeddings() {
        console.log('Initializing embeddings for materials database...');
        
        const uniqueNames = [...new Set(MATERIALS_DATABASE.map(m => m.name))];
        let newEmbeddings = 0;

        for (const name of uniqueNames) {
            if (!this.embeddingsCache[name]) {
                console.log(`Getting embedding for: ${name}`);
                await this.getEmbedding(name);
                newEmbeddings++;
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`Initialization complete. ${newEmbeddings} new embeddings generated.`);
    }

    // Simple fuzzy string matching (fallback when embeddings not available)
    fuzzyMatch(input, target) {
        const inputLower = input.toLowerCase().trim();
        const targetLower = target.toLowerCase().trim();
        
        // Exact match
        if (inputLower === targetLower) return 1.0;
        
        // Contains match
        if (targetLower.includes(inputLower) || inputLower.includes(targetLower)) {
            return 0.8;
        }
        
        // Word match (any word in input matches target)
        const inputWords = inputLower.split(/\s+/);
        const targetWords = targetLower.split(/\s+/);
        for (const word of inputWords) {
            if (word.length > 2 && targetWords.some(tw => tw.includes(word) || word.includes(tw))) {
                return 0.7;
            }
        }
        
        // Levenshtein-like similarity for short strings
        if (inputLower.length <= 10 && targetLower.length <= 15) {
            const maxLen = Math.max(inputLower.length, targetLower.length);
            let matches = 0;
            for (let i = 0; i < Math.min(inputLower.length, targetLower.length); i++) {
                if (inputLower[i] === targetLower[i]) matches++;
            }
            const similarity = matches / maxLen;
            if (similarity > 0.6) return similarity * 0.6;
        }
        
        return 0;
    }

    // Fast fuzzy matching (no API calls - used when embeddings not available)
    findBestMatchFuzzy(userInput) {
        console.log(`[Fuzzy] Finding match for: "${userInput}"`);
        
        let bestMatch = null;
        let bestScore = 0;

        for (const material of MATERIALS_DATABASE) {
            const score = this.fuzzyMatch(userInput, material.name);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = material;
            }
        }

        console.log(`[Fuzzy] Best match: "${bestMatch?.name}" with score ${bestScore.toFixed(3)}`);

        if (bestScore >= 0.5) {
            return {
                material: bestMatch,
                score: bestScore
            };
        }

        return null;
    }

    // Find best matching material for user input
    async findBestMatch(userInput) {
        console.log(`Finding match for: "${userInput}"`);

        // Wait for pre-computed embeddings to load first
        await this.waitForPrecomputed();

        // Count how many materials have embeddings cached
        const cachedCount = MATERIALS_DATABASE.filter(m => this.embeddingsCache[m.name]).length;
        const totalCount = MATERIALS_DATABASE.length;
        
        // If less than 50% of materials have embeddings, use fuzzy matching (instant)
        if (cachedCount < totalCount * 0.5) {
            console.log(`⚡ Using fuzzy matching (only ${cachedCount}/${totalCount} embeddings cached)`);
            return this.findBestMatchFuzzy(userInput);
        }

        // Get embedding for user input
        const inputEmbedding = await this.getEmbedding(userInput);
        if (!inputEmbedding) {
            console.warn('Failed to get embedding for user input, falling back to fuzzy matching');
            return this.findBestMatchFuzzy(userInput);
        }

        // Calculate similarity with all materials
        // Pre-computed embeddings should already be in cache - this is now instant!
        let bestMatch = null;
        let bestScore = 0;
        let missingCount = 0;

        for (const material of MATERIALS_DATABASE) {
            // Check cache first (should hit for pre-computed materials)
            const materialEmbedding = this.embeddingsCache[material.name];
            
            if (!materialEmbedding) {
                missingCount++;
                continue;
            }

            const similarity = this.cosineSimilarity(inputEmbedding, materialEmbedding);

            if (similarity > bestScore) {
                bestScore = similarity;
                bestMatch = material;
            }
        }

        // Log if we're missing embeddings (shouldn't happen with pre-computed file)
        if (missingCount > 0) {
            console.warn(`⚠️ Missing embeddings for ${missingCount} materials. Run: node generate-embeddings.js`);
        }

        console.log(`Best match: "${bestMatch?.name}" with score ${bestScore.toFixed(3)}`);

        // Return match only if similarity is high enough (threshold: 0.5)
        if (bestScore >= 0.5) {
            return {
                material: bestMatch,
                score: bestScore
            };
        }

        // Fallback to fuzzy if semantic matching found nothing good
        console.log('Semantic match too weak, trying fuzzy...');
        return this.findBestMatchFuzzy(userInput);
    }
}

// Create global instance
const semanticMatcher = new SemanticMatcher();

// Initialize embeddings on load (optional - can be done on first use)
// semanticMatcher.initializeEmbeddings();

