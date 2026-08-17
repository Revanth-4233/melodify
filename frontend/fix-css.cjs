const fs = require('fs');
const file = 'd:/Projects/My own spotify/frontend/src/index.css';
const lines = fs.readFileSync(file, 'utf-8').split('\n');
const cutIdx = lines.findIndex(l => l.includes('MOBILE UI PADDING FIX (REMOVE EXCESSIVE SPACE ON SIDES)')) - 1;
if (cutIdx > 0) {
  const goodLines = lines.slice(0, cutIdx);
  const appended = `
/* ========================================================== */
/* MOBILE UI PADDING FIX (REMOVE EXCESSIVE SPACE ON SIDES)    */
/* ========================================================== */
@media (max-width: 768px) {
  .spotify-main-content-wrapper { padding: 0 !important; margin: 0 !important; }
  .spotify-main-area { padding: 0 !important; margin: 0 !important; border: none !important; border-radius: 0 !important; }
  .sonic-discover-page, .spotify-album-page-view, .library-page-wrapper { padding: 16px !important; }
  .album-hero-banner { padding: 0 !important; align-items: center !important; text-align: left !important; }
  .album-hero-info { width: 100% !important; }
  .table-track-row { width: 100% !important; }
  .table-header-row { display: none !important; }
  .track-row-name { white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; max-width: 220px; }
  .track-row-details { min-width: 0 !important; flex: 1 !important; overflow: hidden !important; }
  .left-actions { width: 100% !important; gap: 20px !important; }
  .left-actions > *:nth-child(1) { order: 5; }
  .left-actions > *:nth-child(2) { order: 4; margin-left: auto; }
  .left-actions > *:nth-child(3) { order: 1; }
  .left-actions > *:nth-child(4) { order: 2; }
  .left-actions > *:nth-child(5) { order: 3; }
  .right-actions { display: none !important; }
}
`;
  fs.writeFileSync(file, goodLines.join('\n') + appended);
  console.log('Fixed index.css');
} else {
  console.log('Could not find the target comment to cut the file at.');
}
