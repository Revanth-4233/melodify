const fs = require('fs');
let css = fs.readFileSync('d:/Projects/My own spotify/frontend/src/index.css', 'utf-8');

// Replace the Spotify green button with the gradient button
css = css.replace(/background-color: #1ed760;/g, 'background: var(--grad-primary);\n  color: #fff !important;');

fs.writeFileSync('d:/Projects/My own spotify/frontend/src/index.css', css);
console.log('Fixed button color');
