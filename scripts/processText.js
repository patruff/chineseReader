const fs = require('fs');
const path = require('path');

// Helper function to escape special RegExp characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Read files
const chineseText = fs.readFileSync(
    path.join(__dirname, '../public/data/childrens3Kingdoms.txt'), 
    'utf8'
);
const englishText = fs.readFileSync(
    path.join(__dirname, '../public/data/english.txt'), 
    'utf8'
);
let dictionaryText = fs.readFileSync(
    path.join(__dirname, '../src/data/dictionary.json'), 
    'utf8'
);

// Clean the Chinese text - remove or replace problematic characters
const cleanChineseText = chineseText
    .replace(/[;；]/g, '。') // Replace semicolons with periods
    .replace(/[()（）]/g, '') // Remove parentheses
    .replace(/\s+/g, ' '); // Normalize whitespace

// Split texts into paragraphs
const chineseParagraphs = cleanChineseText.split('\n').filter(p => p.trim());
const englishParagraphs = englishText.split('\n').filter(p => p.trim());

// Create context mapping with escaped RegExp
const contextMap = {};
chineseParagraphs.forEach((chinesePara, index) => {
    if (englishParagraphs[index]) {
        const chars = Array.from(new Set(chinesePara)); // unique chars
        chars.forEach(char => {
            if (!contextMap[char]) {
                contextMap[char] = [];
            }
            // Use escaped character in RegExp
            const escapedChar = escapeRegExp(char);
            contextMap[char].push({
                context: englishParagraphs[index],
                frequency: (chinesePara.match(new RegExp(escapedChar, 'g')) || []).length
            });
        });
    }
});

// Helper function to find most relevant definition
function findBestDefinition(definitions, contexts) {
    if (!contexts || contexts.length === 0) return definitions;

    // Combine all context sentences
    const contextText = contexts.map(c => c.context.toLowerCase()).join(' ');
    
    // Score each definition based on word overlap with context
    return definitions.map(def => {
        const words = def.toLowerCase().split(' ');
        const score = words.reduce((acc, word) => {
            if (word.length > 2 && contextText.includes(word)) {
                acc += 1;
            }
            return acc;
        }, 0);
        return { definition: def, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(d => d.definition)
    .slice(0, 2); // Keep top 2 most relevant definitions
}

// Parse dictionary entries
const entryStrings = dictionaryText.split('},{');
const dictionaryEntries = entryStrings.map((entry, index) => {
    if (index === 0) entry = entry + '}';
    else if (index === entryStrings.length - 1) entry = '{' + entry;
    else entry = '{' + entry + '}';
    
    try {
        return JSON.parse(entry);
    } catch (error) {
        return null;
    }
}).filter(entry => entry !== null);

// Create traditional to simplified mapping
const tradToSimp = {};
dictionaryEntries.forEach(entry => {
    if (entry.traditional && entry.simplified && entry.traditional !== entry.simplified) {
        tradToSimp[entry.traditional] = entry.simplified;
    }
});

// Convert text and track used characters
const usedChars = new Set();
const simplifiedText = Array.from(chineseText)
    .map(char => {
        const simplified = tradToSimp[char] || char;
        usedChars.add(simplified);
        return simplified;
    })
    .join('');

// Create minimal dictionary with context-aware definitions
const minimalDictionary = {};
dictionaryEntries.forEach(entry => {
    const char = entry.simplified || entry.traditional;
    if (usedChars.has(char)) {
        // Filter out unhelpful definitions
        const goodDefs = entry.definitions.filter(def => 
            !def.startsWith('variant of') &&
            !def.startsWith('old variant of') &&
            !def.startsWith('used in') &&
            def.length > 1
        );

        if (goodDefs.length > 0) {
            // Find best definitions based on context
            const bestDefs = findBestDefinition(goodDefs, contextMap[char]);
            minimalDictionary[char] = {
                pinyin: entry.pinyin,
                definitions: bestDefs
            };
        }
    }
});

// Handle characters without definitions by looking at compounds
usedChars.forEach(char => {
    if (!minimalDictionary[char]) {
        // Find compounds containing this character
        const compounds = dictionaryEntries.filter(entry => 
            entry.simplified && 
            entry.simplified.includes(char) && 
            entry.simplified.length > 1 &&
            contextMap[entry.simplified] // Has context
        );

        if (compounds.length > 0) {
            // Use the compound with the most relevant context
            const bestCompound = compounds.reduce((best, current) => {
                const contextScore = (contextMap[current.simplified] || [])
                    .reduce((sum, ctx) => sum + ctx.frequency, 0);
                return contextScore > best.score ? 
                    { entry: current, score: contextScore } : best;
            }, { score: -1 });

            if (bestCompound.entry) {
                const charIndex = bestCompound.entry.simplified.indexOf(char);
                minimalDictionary[char] = {
                    pinyin: bestCompound.entry.pinyin.split(' ')[charIndex],
                    definitions: [`Part of: ${bestCompound.entry.simplified} (${bestCompound.entry.definitions[0]})`]
                };
            }
        }
    }
});

// Save the text directly (no need for traditional->simplified conversion since it's already simplified)
fs.writeFileSync(
    path.join(__dirname, '../public/data/simplified_chinese.txt'),
    chineseText
);

// Log statistics
console.log('\nFinal Statistics:');
console.log('Text length:', chineseText.length);
console.log('Number of paragraphs:', chineseParagraphs.length);
console.log('Unique characters:', new Set(chineseText).size);
console.log('Dictionary entries created:', Object.keys(minimalDictionary).length);