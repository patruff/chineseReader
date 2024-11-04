const fs = require('fs');
const path = require('path');

// Read files
const traditionalText = fs.readFileSync(
    path.join(__dirname, '../public/data/fully_parsed_chinese.txt'), 
    'utf8'
);

// Read and parse dictionary properly
const dictionaryText = fs.readFileSync(
    path.join(__dirname, '../src/data/dictionary.json'), 
    'utf8'
);
const dictionaryEntries = JSON.parse(`[${dictionaryText}]`); // Wrap in array since the file format needs it

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

// Create reduced dictionary with only used characters
const reducedDictionary = {};
dictionaryEntries.forEach(entry => {
    if (usedChars.has(entry.simplified)) {
        reducedDictionary[entry.simplified] = entry;
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

// Log statistics
console.log('Text processing complete:');
console.log('Original text length:', traditionalText.length);
console.log('Simplified text length:', simplifiedText.length);
console.log('Original dictionary entries:', dictionaryEntries.length);
console.log('Reduced dictionary entries:', Object.keys(reducedDictionary).length);
console.log('Number of unique characters in text:', usedChars.size);

// Log some sample conversions
console.log('\nSample conversions:');
console.log('話 ->', tradToSimp['話'] || '話');
console.log('說 ->', tradToSimp['說'] || '說');
console.log('\nFirst 100 characters:');
console.log('Traditional:', traditionalText.slice(0, 100));
console.log('Simplified:', simplifiedText.slice(0, 100));