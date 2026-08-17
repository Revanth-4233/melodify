const fs = require('fs');
const file = 'd:/Projects/My own spotify/frontend/src/index.css';
const appended = `
@media (max-width: 768px) {
  html, body {
    font-size: 13px !important;
  }
}
`;
fs.appendFileSync(file, appended);
console.log('Appended global mobile font size fix to index.css');
