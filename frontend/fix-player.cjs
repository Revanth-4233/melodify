const fs = require('fs');
const file = 'd:/Projects/My own spotify/frontend/src/index.css';
const appended = `
/* ========================================================== */
/* MOBILE PLAYER UI FIX (DOCK TO BOTTOM, COMPACT SIZE, CYAN)  */
/* ========================================================== */
@media (max-width: 768px) {
  .spotify-bottom-player {
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    border-radius: 0 !important;
    padding: 6px 12px !important;
    height: 64px !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    justify-content: space-between !important;
  }
  .player-track-info {
    width: auto !important;
    flex: 1 !important;
    margin-bottom: 0 !important;
  }
  .player-artwork {
    width: 44px !important;
    height: 44px !important;
  }
  .player-center-controls {
    width: auto !important;
    flex-direction: row !important;
    align-items: center !important;
  }
  .player-progress-container,
  .player-right-controls,
  .player-btn-subtle {
    display: none !important;
  }
  .player-play-main-circle {
    background: #00e5ff !important;
    width: 40px !important;
    height: 40px !important;
  }
  .player-play-main-circle svg {
    width: 18px !important;
    height: 18px !important;
  }
}

/* Also ensure desktop play button is cyan */
.player-play-main-circle {
  background: #00e5ff !important;
}
.player-play-main-circle:hover {
  background: #00f2fe !important;
}
`;
fs.appendFileSync(file, appended);
console.log('Appended player fixes to index.css');
