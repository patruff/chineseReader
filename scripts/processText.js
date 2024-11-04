const fs = require('fs');
const path = require('path');

// Read files
const traditionalText = fs.readFileSync(
    path.join(__dirname, '../public/data/fully_parsed_chinese.txt'), 
    'utf8'
);

// Read dictionary and parse entries
let dictionaryText = fs.readFileSync(
    path.join(__dirname, '../src/data/dictionary.json'), 
    'utf8'
);

// Split the dictionary text into individual entries
const entryStrings = dictionaryText.split('},{');
const dictionaryEntries = entryStrings.map((entry, index) => {
    // Add back the curly braces except for first and last entries
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

console.log('Parsed dictionary entries:', dictionaryEntries.length);

// Create traditional to simplified mapping
const tradToSimp = {};
let mappingCount = 0;
dictionaryEntries.forEach(entry => {
    if (entry.traditional && entry.simplified && entry.traditional !== entry.simplified) {
        tradToSimp[entry.traditional] = entry.simplified;
        mappingCount++;
    }
});

console.log('Created mappings for', mappingCount, 'characters');
console.log('Sample mappings:', 
    Object.entries(tradToSimp)
        .slice(0, 10)
        .map(([trad, simp]) => `${trad} -> ${simp}`)
        .join(', ')
);

// Convert text and track used characters
const usedChars = new Set();
const simplifiedText = Array.from(traditionalText)
    .map(char => {
        const simplified = tradToSimp[char] || char;
        usedChars.add(simplified);
        return simplified;
    })
    .join('');

console.log('Number of unique characters found in text:', usedChars.size);
console.log('Sample characters from text:', Array.from(usedChars).slice(0, 10));

// Create reduced dictionary with only used characters
const reducedDictionary = {};
dictionaryEntries.forEach(entry => {
    if (usedChars.has(entry.simplified) || usedChars.has(entry.traditional)) {
        reducedDictionary[entry.simplified || entry.traditional] = entry;
    }
});

// Save the simplified text
fs.writeFileSync(
    path.join(__dirname, '../public/data/simplified_chinese.txt'),
    simplifiedText
);

// Save the reduced dictionary
fs.writeFileSync(
    path.join(__dirname, '../src/data/reduced_dictionary.json'),
    JSON.stringify(reducedDictionary, null, 2)
);

// Log final statistics
console.log('\nFinal Statistics:');
console.log('Original text length:', traditionalText.length);
console.log('Simplified text length:', simplifiedText.length);
console.log('Original dictionary entries:', dictionaryEntries.length);
console.log('Reduced dictionary entries:', Object.keys(reducedDictionary).length);
console.log('Unique characters in text:', usedChars.size);

// Log sample of text conversion
console.log('\nText Sample:');
console.log('Traditional (first 50):', traditionalText.slice(0, 50));
console.log('Simplified (first 50):', simplifiedText.slice(0, 50));

// After writing the file, let's verify it
const savedText = fs.readFileSync(
    path.join(__dirname, '../public/data/simplified_chinese.txt'), 
    'utf8'
);
console.log('\nVerifying saved simplified text:');
console.log('First 50 characters of saved file:', savedText.slice(0, 50));