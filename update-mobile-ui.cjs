const fs = require('fs');
let css = fs.readFileSync('d:/Projects/My own spotify/frontend/src/index.css', 'utf-8');

const newMobileCss = `
/* ========================================================== */
/* PROFESSIONAL MOBILE UI FIXES */
/* ========================================================== */
@media (max-width: 768px) {
  /* Hide the messy table headers completely on mobile */
  .table-header-row { 
    display: none !important; 
  }

  /* Make the title smaller and more professional */
  .album-hero-title {
    font-size: 1.25rem !important;
    letter-spacing: -0.2px !important;
    line-height: 1.3 !important;
    margin-bottom: 8px !important;
    white-space: normal !important;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  /* Make the play button normal sized */
  .player-play-main-circle,
  .album-play-btn {
    width: 48px !important;
    height: 48px !important;
  }
  .player-play-main-circle svg,
  .album-play-btn svg {
    width: 20px !important;
    height: 20px !important;
  }

  /* Reduce sizes of action icons */
  .album-action-bar .lucide {
    width: 22px !important;
    height: 22px !important;
    stroke-width: 1.5 !important;
  }
  .left-actions {
    gap: 16px !important;
  }

  /* Reduce track row heights and font sizes */
  .table-track-row {
    padding: 8px 12px !important;
    grid-template-columns: 32px 1fr 32px 32px !important;
    gap: 8px !important;
  }
  .col-num {
    font-size: 0.85rem !important;
    width: 32px !important;
  }
  .track-row-name {
    font-size: 0.95rem !important;
    max-width: 200px !important;
  }
  .track-row-artist {
    font-size: 0.8rem !important;
  }

  /* Hide the album name and date added columns on mobile track rows */
  .table-track-row .col-album,
  .table-track-row .col-added-by,
  .table-track-row .col-date,
  .table-track-row .col-duration {
    display: none !important;
  }
  
  /* Make track row action icons standard mobile size */
  .table-track-row .lucide {
    width: 18px !important;
    height: 18px !important;
  }
  
  /* Make sure background is perfectly dark */
  .album-tracks-table {
    padding: 0 16px 80px !important;
  }
}
`;

// Append this at the very end to guarantee it overrides everything
fs.appendFileSync('d:/Projects/My own spotify/frontend/src/index.css', newMobileCss);
console.log('Mobile CSS patched');
