const fs = require('fs');
const css = `
/* Spotify Welcome Screen */
.spotify-welcome-bg {
  background-color: #121212;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 60px;
  align-items: center;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1000;
}
.spotify-close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  background: transparent;
  border: none;
  color: #b3b3b3;
  cursor: pointer;
  z-index: 50;
}
.spotify-welcome-content {
  width: 100%;
  max-width: 400px;
  padding: 0 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.spotify-welcome-logo {
  margin-bottom: 24px;
}
.spotify-welcome-icon-circle {
  width: 64px;
  height: 64px;
  background-color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}
.spotify-welcome-title {
  color: #fff;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.2;
  margin-bottom: 48px;
}
.spotify-welcome-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.spotify-btn-primary {
  width: 100%;
  background-color: #1ed760;
  color: #000;
  border: none;
  border-radius: 40px;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s;
}
.spotify-btn-primary:active {
  transform: scale(0.97);
}
.spotify-btn-outline {
  width: 100%;
  background-color: transparent;
  color: #fff;
  border: 1px solid #727272;
  border-radius: 40px;
  padding: 16px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}
`;
fs.appendFileSync('d:/Projects/My own spotify/frontend/src/index.css', css);
console.log('Appended');
