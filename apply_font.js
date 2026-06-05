const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

// Add Google Fonts link if not present
if (!html.includes('fonts.googleapis.com')) {
    html = html.replace('</title>', '</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">');
}

// Replace font families
html = html.replace(/'Segoe UI', ?Tahoma, ?Geneva, ?Verdana, ?sans-serif/g, "'Montserrat', sans-serif");
html = html.replace(/'Segoe UI', ?Tahoma, ?sans-serif/g, "'Montserrat', sans-serif");
html = html.replace(/Segoe UI, ?Tahoma, ?Geneva, ?Verdana, ?sans-serif/g, "'Montserrat', sans-serif");

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Fonts applied successfully.");
