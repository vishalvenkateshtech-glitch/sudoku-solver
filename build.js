/**
 * Vercel build script.
 * Reads VITE_API_BASE (or API_BASE) from the Vercel environment,
 * injects it into app.js, and writes everything to /dist.
 *
 * Set the environment variable in your Vercel project settings:
 *   API_BASE = https://sudoku-api.onrender.com
 */

const fs   = require('fs');
const path = require('path');

const API_BASE = process.env.API_BASE || '';

if (!API_BASE) {
    console.warn('[build] WARNING: API_BASE is not set — API calls will use relative URLs (fine for local, wrong for Vercel+Render split)');
}

// Ensure output directory exists
fs.mkdirSync('dist', { recursive: true });

// Copy and patch app.js
let js = fs.readFileSync('app.js', 'utf8');
js = js.replace('__API_BASE__', JSON.stringify(API_BASE));
fs.writeFileSync('dist/app.js', js);

// Copy remaining static files verbatim
['style.css', 'index.html'].forEach(file => {
    fs.copyFileSync(file, path.join('dist', file));
});

console.log(`[build] Done. API_BASE = "${API_BASE}"`);