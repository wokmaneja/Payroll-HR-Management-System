const fs = require('fs');
const indexStr = fs.readFileSync('public/index.html', 'utf8');
const match = indexStr.match(/<script>\s*(var I18N_DICT[\s\S]*?)<\/script>/);
if (match) {
  fs.writeFileSync('index_js.js', match[1]);
  console.log("Extracted!");
} else {
  console.log("Not found.");
}
