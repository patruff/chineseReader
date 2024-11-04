const fs = require('fs');
const path = require('path');

// Read files
const traditionalText = fs.readFileSync(
    path.join(__dirname, '../public/data/fully_parsed_chinese.txt'), 
    'utf8'
);

// Read and parse dictionary
let dictionaryText = fs.readFileSync(
    path.join(__dirname, '../src/data/dictionary.json'), 
    'utf8'
);

// Split and parse dictionary entries
const entryStrings = dictionaryText.split('},{');
const dictionaryEntries = entryStrings.map((entry, index) => {
    if (index === 0) {
        entry = entry + '}';
    } else if (index === entryStrings.length - 1) {
        entry = '{' + entry;
    } else {
        entry = '{' + entry + '}';
    }
    try {
        return JSON.parse(entry);
    } catch (error) {
        console.error('Error parsing entry:', entry);
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
const simplifiedText = Array.from(traditionalText)
    .map(char => {
        const simplified = tradToSimp[char] || char;
        usedChars.add(simplified);
        return simplified;
    })
    .join('');

// Create minimal dictionary with only used characters and essential info
const minimalDictionary = {};
dictionaryEntries.forEach(entry => {
    const char = entry.simplified || entry.traditional;
    if (usedChars.has(char)) {
        // Only include essential fields
        minimalDictionary[char] = {
            pinyin: entry.pinyin,
            definitions: entry.definitions.slice(0, 3) // Limit to first 3 definitions
        };
    }
});

// Save the simplified text
fs.writeFileSync(
    path.join(__dirname, '../public/data/simplified_chinese.txt'),
    simplifiedText
);

// Save the minimal dictionary
fs.writeFileSync(
    path.join(__dirname, '../public/data/minimal_dictionary.json'),
    JSON.stringify(minimalDictionary, null, 2)
);

// Log statistics
console.log('\nFinal Statistics:');
console.log('Original text length:', traditionalText.length);
console.log('Simplified text length:', simplifiedText.length);
console.log('Original dictionary entries:', dictionaryEntries.length);
console.log('Minimal dictionary entries:', Object.keys(minimalDictionary).length);
console.log('Dictionary file size:', 
    (JSON.stringify(minimalDictionary).length / 1024).toFixed(2) + ' KB');