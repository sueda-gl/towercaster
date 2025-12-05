#!/usr/bin/env node
/**
 * Pre-compute Embeddings Generator
 * 
 * This script pre-computes embeddings for all materials in the database
 * and saves them to a JSON file. This eliminates the need to fetch
 * embeddings at runtime, making the first load instant.
 * 
 * Usage (with local OpenAI key):
 *   OPENAI_API_KEY=your_key node generate-embeddings.js
 * 
 * Usage (via deployed Vercel API):
 *   node generate-embeddings.js --api-url=https://your-app.vercel.app
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let API_URL = null;
let OPENAI_API_KEY = process.env.OPENAI_API_KEY;

for (const arg of args) {
    if (arg.startsWith('--api-url=')) {
        API_URL = arg.split('=')[1];
    }
}

// Try to load local config for API key
if (!API_URL) {
    try {
        const configPath = path.join(__dirname, 'config.local.js');
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf-8');
            const match = configContent.match(/OPENAI_API_KEY\s*[:=]\s*['"]([^'"]+)['"]/);
            if (match) {
                OPENAI_API_KEY = match[1];
                console.log('Loaded API key from config.local.js');
            }
        }
    } catch (e) {
        console.log('Could not load config.local.js, using environment variable');
    }

    if (!OPENAI_API_KEY) {
        console.error('Error: OPENAI_API_KEY not found.');
        console.error('Options:');
        console.error('  1. Set OPENAI_API_KEY environment variable');
        console.error('  2. Use deployed API: node generate-embeddings.js --api-url=https://your-app.vercel.app');
        process.exit(1);
    }
} else {
    console.log(`Using deployed API at: ${API_URL}`);
}

// Load materials database
const materialsContent = fs.readFileSync(path.join(__dirname, 'materials-database.js'), 'utf-8');
// Extract the array from the JS file
const materialsMatch = materialsContent.match(/const MATERIALS_DATABASE = \[([\s\S]*?)\];/);
if (!materialsMatch) {
    console.error('Could not parse materials database');
    process.exit(1);
}

// Parse the materials - extract just the names
const nameMatches = materialsContent.matchAll(/name:\s*["']([^"']+)["']/g);
const allNames = [...nameMatches].map(m => m[1]);
const uniqueNames = [...new Set(allNames)];

console.log(`Found ${uniqueNames.length} unique material names`);

async function getEmbedding(text) {
    let response;
    
    if (API_URL) {
        // Use deployed Vercel API
        response = await fetch(`${API_URL}/api/embedding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });
    } else {
        // Use OpenAI directly
        response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                input: text,
                model: 'text-embedding-ada-002'
            })
        });
    }

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateAllEmbeddings() {
    const embeddings = {};
    
    // Rate limit: 30 requests per minute = 2 seconds between requests to be safe
    const delayBetweenRequests = API_URL ? 2100 : 100; // Longer delay for deployed API (rate limited)
    
    console.log('\nGenerating embeddings...');
    console.log(`Using ${delayBetweenRequests}ms delay between requests\n`);
    
    // Try to load existing file to resume from where we left off
    const outputPath = path.join(__dirname, 'precomputed-embeddings.json');
    if (fs.existsSync(outputPath)) {
        try {
            const existing = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
            Object.assign(embeddings, existing);
            console.log(`📂 Resuming from existing file (${Object.keys(existing).length} embeddings already generated)\n`);
        } catch (e) {
            console.log('Could not load existing file, starting fresh\n');
        }
    }
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < uniqueNames.length; i++) {
        const name = uniqueNames[i];
        
        // Skip if already have embedding
        if (embeddings[name]) {
            skipCount++;
            continue;
        }
        
        try {
            process.stdout.write(`  [${i + 1}/${uniqueNames.length}] ${name}...`);
            const embedding = await getEmbedding(name);
            embeddings[name] = embedding;
            successCount++;
            console.log(' ✓');
            
            // Save progress periodically (every 10 new embeddings)
            if (successCount % 10 === 0) {
                fs.writeFileSync(outputPath, JSON.stringify(embeddings, null, 2));
                console.log(`     💾 Progress saved (${Object.keys(embeddings).length} total)`);
            }
        } catch (error) {
            errorCount++;
            if (error.message.includes('429')) {
                // Rate limited - extract retry time and wait
                const retryMatch = error.message.match(/retryAfter":(\d+)/);
                const retryAfter = retryMatch ? parseInt(retryMatch[1]) + 2 : 60;
                console.log(` ⏳ Rate limited, waiting ${retryAfter}s...`);
                await sleep(retryAfter * 1000);
                
                // Retry this one
                try {
                    process.stdout.write(`  [${i + 1}/${uniqueNames.length}] ${name} (retry)...`);
                    const embedding = await getEmbedding(name);
                    embeddings[name] = embedding;
                    successCount++;
                    errorCount--; // Remove the error count since retry succeeded
                    console.log(' ✓');
                } catch (retryError) {
                    console.log(` ✗ Still failed: ${retryError.message.substring(0, 50)}`);
                }
            } else {
                console.log(` ✗ Error: ${error.message.substring(0, 50)}`);
            }
        }
        
        // Delay between requests
        if (i < uniqueNames.length - 1 && !embeddings[uniqueNames[i + 1]]) {
            await sleep(delayBetweenRequests);
        }
    }
    
    // Final save
    fs.writeFileSync(outputPath, JSON.stringify(embeddings, null, 2));
    
    console.log(`\n✅ Complete!`);
    console.log(`   Generated: ${successCount} new embeddings`);
    console.log(`   Skipped: ${skipCount} (already existed)`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total saved: ${Object.keys(embeddings).length} embeddings`);
    console.log(`   File: precomputed-embeddings.json (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB)`);
}

generateAllEmbeddings().catch(console.error);

