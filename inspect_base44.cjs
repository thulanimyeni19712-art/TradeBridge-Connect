const fs = require('fs');
const js = fs.readFileSync('chunk_Landing-BhZu80sm.js', 'utf8');

console.log('Landing Size:', js.length);
// Extract headings
const headings = js.match(/["']([A-Z0-9\s—–\.\:\-]{4,80})["']/g) || [];
console.log('Landing Headings:', [...new Set(headings)].slice(0, 30));
