const fs = require('fs');
const path = './src/data/translations.ts';

let content = fs.readFileSync(path, 'utf8');

// Process each language section
const languages = ['en', 'rw', 'zh'];
for (const lang of languages) {
  const regex = new RegExp(`${lang}:\\s*{([\\s\\S]*?)\\n\\s*\\}`, 'g');
  const match = regex.exec(content);
  if (match) {
    let block = match[1];
    const lines = block.split('\n');
    const seen = new Set();
    const uniqueLines = [];
    
    for (const line of lines) {
      const keyMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*):/);
      if (keyMatch) {
        const key = keyMatch[1];
        if (seen.has(key)) {
          continue; // Skip duplicate
        }
        seen.add(key);
      }
      uniqueLines.push(line);
    }
    
    const newBlock = uniqueLines.join('\n');
    content = content.replace(block, newBlock);
  }
}

fs.writeFileSync(path, content);
console.log('Duplicates removed successfully!');