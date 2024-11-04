const fs = require('fs');
const path = require('path');

// Read files
const traditionalText = fs.readFileSync(
  path.join(__dirname, '../public/data/fully_parsed_chinese.txt'), 
  'utf8'
);
const fullDictionary = require('../src/data/dictionary.json');

// Create traditional to simplified mapping from dictionary
const tradToSimp = {};
Object.entries(fullDictionary).forEach(([char, entry]) => {
  if (entry.traditional && entry.simplified) {
    tradToSimp[entry.traditional] = entry.simplified;
  }
});

// Convert text to simplified
const simplifiedText = Array.from(traditionalText)
  .map(char => tradToSimp[char] || char)
  .join('');

// Create a set of unique characters from the simplified text
const uniqueChars = new Set(simplifiedText);

// Create a new dictionary with only the characters that appear in the text
const reducedDictionary = {};
for (const char of uniqueChars) {
  if (fullDictionary[char]) {
    reducedDictionary[char] = fullDictionary[char];
  }
}

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
console.log('Original dictionary size:', Object.keys(fullDictionary).length);
console.log('Reduced dictionary size:', Object.keys(reducedDictionary).length);

// Log a sample to verify conversion
console.log('\nSample conversion (first 100 characters):');
console.log('Traditional:', traditionalText.slice(0, 100)); 