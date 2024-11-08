const fs = require('fs');
const path = require('path');

const COMPOUND_MARKERS = {
    4: ['《', '》'],
    3: ['【', '】'],
    2: ['『', '』']
};

// Helper function to escape special RegExp characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to extract compounds from text
function extractCompounds(text) {
    const compounds = new Set();
    
    // Extract 2-character compounds
    const twoCharRegex = /『([^』]+)』/g;
    let match;
    while ((match = twoCharRegex.exec(text)) !== null) {
        compounds.add(match[1]);
    }
    
    // Extract 3-character compounds
    const threeCharRegex = /【([^】]+)】/g;
    while ((match = threeCharRegex.exec(text)) !== null) {
        compounds.add(match[1]);
    }
    
    // Extract 4-character compounds
    const fourCharRegex = /《([^》]+)》/g;
    while ((match = fourCharRegex.exec(text)) !== null) {
        compounds.add(match[1]);
    }
    
    return compounds;
}

// Process text into segments
function processText(text) {
    const segments = [];
    let currentPos = 0;

    // Create a combined regex for all markers
    const markerPairs = Object.values(COMPOUND_MARKERS);
    const combinedPattern = markerPairs
        .map(([start, end]) => `${escapeRegExp(start)}([^${escapeRegExp(end)}]+)${escapeRegExp(end)}`)
        .join('|');
    const compoundRegex = new RegExp(combinedPattern, 'g');

    let match;
    while ((match = compoundRegex.exec(text)) !== null) {
        // Add any text before the compound
        if (match.index > currentPos) {
            const beforeText = text.slice(currentPos, match.index);
            segments.push(...Array.from(beforeText).map(char => ({
                text: char,
                type: 'char'
            })));
        }

        // Determine compound type
        const fullMatch = match[0];
        const compoundText = match[1] || match[2] || match[3]; // Depending on which group matched
        let compoundType;
        
        if (fullMatch.startsWith('《')) compoundType = '4';
        else if (fullMatch.startsWith('【')) compoundType = '3';
        else compoundType = '2';

        segments.push({
            text: compoundText,
            type: `compound-${compoundType}`
        });

        currentPos = match.index + fullMatch.length;
    }

    // Add any remaining text
    if (currentPos < text.length) {
        const remainingText = text.slice(currentPos);
        segments.push(...Array.from(remainingText).map(char => ({
            text: char,
            type: 'char'
        })));
    }

    return segments;
}

// Read files - only using parsed_childrens3Kingdoms.txt now
const chineseText = fs.readFileSync(
    path.join(__dirname, '../public/data/parsed_childrens3Kingdoms.txt'), 
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

// Get all unique characters from the text
const uniqueChars = new Set(cleanChineseText);
console.log('Unique characters in text:', uniqueChars.size);

// Parse dictionary entries - focus on simplified characters
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

// Create dictionary with both compounds and individual characters
const minimalDictionary = {};

// First process compounds
const compounds = extractCompounds(chineseText);
console.log('Found compounds:', compounds.size);

compounds.forEach(compound => {
    // Find dictionary entry for compound
    const entry = dictionaryEntries.find(e => 
        e.simplified === compound || 
        e.traditional === compound
    );
    
    if (entry) {
        minimalDictionary[compound] = {
            type: 'compound',
            pinyin: entry.pinyin,
            definitions: entry.definitions.filter(def => 
                !def.startsWith('variant of') &&
                !def.startsWith('old variant of')
            ).slice(0, 2)
        };
        
        // Add reference for each character in compound
        Array.from(compound).forEach(char => {
            minimalDictionary[`ref:${char}`] = compound;
        });
    }
});

// Then process individual characters
dictionaryEntries.forEach(entry => {
    // Only process entries with simplified characters
    const char = entry.simplified;
    if (char && char.length === 1 && uniqueChars.has(char)) {
        // Filter out unhelpful definitions
        const goodDefs = entry.definitions.filter(def => 
            !def.startsWith('variant of') &&
            !def.startsWith('old variant of') &&
            !def.startsWith('used in') &&
            !def.startsWith('see ') &&
            def.length > 1
        );

        if (goodDefs.length > 0) {
            minimalDictionary[char] = {
                pinyin: entry.pinyin,
                definitions: goodDefs.slice(0, 3) // Keep top 3 most meaningful definitions
            };
        }
    }
});

// For characters without definitions, look for compound words
Array.from(uniqueChars).forEach(char => {
    if (!minimalDictionary[char]) {
        // Find compound words containing this character
        const compounds = dictionaryEntries.filter(entry => 
            entry.simplified && 
            entry.simplified.includes(char) && 
            entry.simplified.length > 1
        );

        if (compounds.length > 0) {
            // Use the shortest compound word for clarity
            const bestCompound = compounds
                .sort((a, b) => a.simplified.length - b.simplified.length)[0];
            
            const charIndex = bestCompound.simplified.indexOf(char);
            minimalDictionary[char] = {
                pinyin: bestCompound.pinyin.split(' ')[charIndex],
                definitions: [`Found in: ${bestCompound.simplified} (${bestCompound.definitions[0]})`]
            };
        }
    }
});

// Save only the necessary files
fs.writeFileSync(
    path.join(__dirname, '../public/data/minimal_dictionary.json'),
    JSON.stringify(minimalDictionary, null, 2)
);

// Log statistics
console.log('\nFinal Statistics:');
console.log('Text length:', cleanChineseText.length);
console.log('Unique characters:', uniqueChars.size);
console.log('Characters with definitions:', Object.keys(minimalDictionary).length);
console.log('Characters without definitions:', 
    Array.from(uniqueChars).filter(char => !minimalDictionary[char]).length);