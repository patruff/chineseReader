const fs = require('fs');
const path = require('path');

// Read the Chinese text
const chineseText = fs.readFileSync(
  path.join(__dirname, '../public/data/fully_parsed_chinese.txt'), 
  'utf8'
);

// Read the full dictionary
const fullDictionary = require('../src/data/dictionary.json');

// Create a set of unique characters from the text
const uniqueChars = new Set(chineseText);

// Create a new dictionary with only the characters that appear in the text
const reducedDictionary = {};
for (const char of uniqueChars) {
  if (fullDictionary[char]) {
    reducedDictionary[char] = fullDictionary[char];
  }
}

// Write the reduced dictionary to a new file
fs.writeFileSync(
  path.join(__dirname, '../src/data/reduced_dictionary.json'),
  JSON.stringify(reducedDictionary, null, 2)
);

console.log('Original dictionary size:', Object.keys(fullDictionary).length);
console.log('Reduced dictionary size:', Object.keys(reducedDictionary).length); 