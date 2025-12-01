// Semantic Matcher
// Uses Azure OpenAI embeddings to match user input to closest material

class SemanticMatcher {
    constructor() {
        this.embeddingsCache = {};
        this.loadCache();
    }

    // Load cached embeddings from localStorage
    loadCache() {
        try {
            const cached = localStorage.getItem('material_embeddings');
            if (cached) {
                this.embeddingsCache = JSON.parse(cached);
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

    // Find best matching material for user input
    async findBestMatch(userInput) {
        console.log(`Finding match for: "${userInput}"`);

        // Get embedding for user input
        const inputEmbedding = await this.getEmbedding(userInput);
        if (!inputEmbedding) {
            console.error('Failed to get embedding for user input');
            return null;
        }

        // Calculate similarity with all materials
        let bestMatch = null;
        let bestScore = 0;

        for (const material of MATERIALS_DATABASE) {
            const materialEmbedding = await this.getEmbedding(material.name);
            if (!materialEmbedding) continue;

            const similarity = this.cosineSimilarity(inputEmbedding, materialEmbedding);

            if (similarity > bestScore) {
                bestScore = similarity;
                bestMatch = material;
            }
        }

        console.log(`Best match: "${bestMatch?.name}" with score ${bestScore.toFixed(3)}`);

        // Return match only if similarity is high enough (threshold: 0.5)
        if (bestScore >= 0.5) {
            return {
                material: bestMatch,
                score: bestScore
            };
        }

        return null;
    }
}

// Create global instance
const semanticMatcher = new SemanticMatcher();

// Initialize embeddings on load (optional - can be done on first use)
// semanticMatcher.initializeEmbeddings();

