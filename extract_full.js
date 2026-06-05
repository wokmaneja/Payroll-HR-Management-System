const fs = require('fs');
const indexStr = fs.readFileSync('public/index.html', 'utf8');
const scriptBlocks = indexStr.match(/<script>([\s\S]*?)<\/script>/g);
if (scriptBlocks) {
  let combined = scriptBlocks.map(b => b.replace(/<\/?script>/g, '')).join('\n');
  fs.writeFileSync('index_full.js', combined);
  console.log("Extracted!");
}
