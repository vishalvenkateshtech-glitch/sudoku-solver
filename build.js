const fs   = require('fs');
const path = require('path');

// Always resolve files relative to this script's location,
// regardless of what directory Vercel runs the build from.
const ROOT = __dirname;

const API_BASE = process.env.API_BASE || '';

if (!API_BASE) {
    console.warn('[build] WARNING: API_BASE is not set — API calls will use relative URLs');
}

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });

// Patch and copy app.js
let js = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
js = js.replace('__API_BASE__', JSON.stringify(API_BASE));
fs.writeFileSync(path.join(ROOT, 'dist', 'app.js'), js);

// Copy static files verbatim
['style.css', 'index.html'].forEach(file => {
    fs.copyFileSync(
        path.join(ROOT, file),
        path.join(ROOT, 'dist', file)
    );
});

console.log(`[build] Done. API_BASE = "${API_BASE}"`);