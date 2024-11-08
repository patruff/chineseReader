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

// Helper function to extract compounds with their positions
function extractCompoundsWithPositions(text) {
    const compounds = new Map(); // Map to store compound and its positions
    let compoundRanges = []; // Store start and end positions of compounds
    
    // Extract all compounds with their positions
    function findCompounds(regex) {
        let match;
        while ((match = regex.exec(text)) !== null) {
            compounds.set(match[1], {
                text: match[1],
                start: match.index,
                end: match.index + match[0].length
            });
            compoundRanges.push([match.index, match.index + match[0].length]);
        }
    }
    
    // Find all compounds with their markers
    findCompounds(/『([^』]+)』/g);  // 2-character
    findCompounds(/【([^】]+)】/g);  // 3-character
    findCompounds(/《([^》]+)》/g);  // 4-character
    
    return { compounds, compoundRanges };
}

// Create minimal dictionary
const { compounds, compoundRanges } = extractCompoundsWithPositions(chineseText);
const minimalDictionary = {};

// Process compounds first
compounds.forEach((info, compound) => {
    const entry = dictionaryEntries.find(e => e.simplified === compound);
    if (entry) {
        minimalDictionary[compound] = {
            type: 'compound',
            pinyin: entry.pinyin,
            definitions: entry.definitions.filter(def => 
                !def.startsWith('variant of') &&
                !def.startsWith('old variant of')
            ).slice(0, 2)
        };
    }
});

// Helper function to check if a character is part of any compound
function isInCompound(position) {
    return compoundRanges.some(([start, end]) => position >= start && position < end);
}

// Process individual characters
let pos = 0;
while (pos < chineseText.length) {
    if (!isInCompound(pos)) {
        const char = chineseText[pos];
        if (!minimalDictionary[char]) {
            const entry = dictionaryEntries.find(e => e.simplified === char);
            if (entry) {
                minimalDictionary[char] = {
                    type: 'char',
                    pinyin: entry.pinyin,
                    definitions: entry.definitions.filter(def => 
                        !def.startsWith('variant of') &&
                        !def.startsWith('old variant of')
                    ).slice(0, 2)
                };
            }
        }
    }
    pos++;
}

// Save dictionary
fs.writeFileSync(
    path.join(__dirname, '../public/data/minimal_dictionary.json'),
    JSON.stringify(minimalDictionary, null, 2)
);

// Log statistics
console.log('\nFinal Statistics:');
console.log('Text length:', chineseText.length);
console.log('Compounds found:', compounds.size);
console.log('Individual characters:', Object.keys(minimalDictionary).filter(k => 
    minimalDictionary[k].type === 'char'
).length);
console.log('Total dictionary entries:', Object.keys(minimalDictionary).length);