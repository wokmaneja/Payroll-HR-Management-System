const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Remove single quotes around Montserrat to fix JS syntax errors in inline strings
html = html.replace(/font-family:'Montserrat', sans-serif/g, 'font-family:Montserrat, sans-serif');

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Font syntax fixed.");
