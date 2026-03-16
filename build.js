const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;

const API_BASE = process.env.API_BASE || '';

if (!API_BASE) {
    console.warn('[build] WARNING: API_BASE is not set — API calls will use relative URLs');
}

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });

// app.js lives in static/
let js = fs.readFileSync(path.join(ROOT, 'static', 'app.js'), 'utf8');
js = js.replace('__API_BASE__', JSON.stringify(API_BASE));
fs.writeFileSync(path.join(ROOT, 'dist', 'app.js'), js);

// style.css lives in static/
fs.copyFileSync(
    path.join(ROOT, 'static', 'style.css'),
    path.join(ROOT, 'dist', 'style.css')
);

// index.html lives in templates/ — rewrite asset paths for flat dist/ layout
let html = fs.readFileSync(path.join(ROOT, 'templates', 'index.html'), 'utf8');
html = html
    .replace('/static/style.css', 'style.css')
    .replace('/static/app.js',    'app.js');
fs.writeFileSync(path.join(ROOT, 'dist', 'index.html'), html);

console.log(`[build] Done. API_BASE = "${API_BASE}"`);

console.log(`[build] Done. API_BASE = "${API_BASE}"`);