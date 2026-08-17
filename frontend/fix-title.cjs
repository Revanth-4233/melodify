const fs = require('fs');
const file = 'd:/Projects/My own spotify/frontend/src/index.css';
const appended = `
@media (max-width: 768px) {
  .album-hero-title {
    font-size: 1.4rem !important;
    letter-spacing: -0.5px !important;
    line-height: 1.2 !important;
    margin-bottom: 8px !important;
    word-break: break-word !important;
  }
}
`;
fs.appendFileSync(file, appended);
console.log('Appended hero title fix to index.css');
