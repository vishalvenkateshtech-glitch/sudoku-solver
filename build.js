const fs   = require('fs');
const path = require('path');

const ROOT     = __dirname;
const API_BASE = process.env.API_BASE || '';

if (!API_BASE) {
    console.warn('[build] WARNING: API_BASE is not set');
}

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });

// Patch and copy app.js
let js = fs.readFileSync(path.join(ROOT, 'static', 'app.js'), 'utf8');
js = js.replace(/__API_BASE__/g, API_BASE);
fs.writeFileSync(path.join(ROOT, 'dist', 'app.js'), js);

// Copy static files verbatim
const staticFiles = [
    'style.css',
    'icon-192x192.png',
    'icon-512x512.png',
    'icon-maskable.png',
    'icon-180x180.png',
    'manifest.json',
    'sw.js'
];
staticFiles.forEach(file => {
    const src = path.join(ROOT, 'static', file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(ROOT, 'dist', file));
    } else {
        console.warn(`[build] WARNING: ${file} not found in static/`);
    }
});

// index.html lives in templates/ — rewrite asset paths for flat dist/ layout
let html = fs.readFileSync(path.join(ROOT, 'templates', 'index.html'), 'utf8');
html = html
    .replace(/\/static\/style\.css/g,        'style.css')
    .replace(/\/static\/app\.js/g,           'app.js')
    .replace(/\/static\/sw\.js/g,            'sw.js')
    .replace(/\/static\/manifest\.json/g,    'manifest.json')
    .replace(/\/static\/icon-192x192\.png/g, 'icon-192x192.png')
    .replace(/\/static\/icon-512x512\.png/g, 'icon-512x512.png')
    .replace(/\/static\/icon-maskable\.png/g,'icon-maskable.png')
    .replace(/\/static\/icon-180x180\.png/g,'icon-180x180.png')
    // SW scope must be / but the file is at root of dist
    .replace("scope: '/'", "scope: '/'");
fs.writeFileSync(path.join(ROOT, 'dist', 'index.html'), html);

console.log(`[build] Done. API_BASE = "${API_BASE}"`);