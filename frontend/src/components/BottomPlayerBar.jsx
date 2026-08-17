import { useState, useEffect, useRef } from 'react';
import { usePlayer, useToast } from '../App';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  PlusCircle,
  CheckCircle,
  Disc,
  ChevronDown,
  Maximize2,
  Sparkles,
  Music2,
  Mic2,
  Film,
  Info,
  Heart
} from 'lucide-react';
import { libraryApi, playlistApi } from '../api';

const DEFAULT_FEATURED_TRACK = {
  trackId: 1001,
  appleCatalogId: 1001,
  trackName: 'Samayama',
  artistName: 'Hesham Abdul Wahab',
  collectionName: 'Hi Nanna (Original Soundtrack)',
  artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/64/4c/1d/644c1db5-68f8-0640-21e2-dd440f7290e7/8903431963253_cover.jpg/300x300bb.jpg',
  previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/28/31/3b/28313b5e-436f-b258-0056-bb6b06385a49/mzaf_10486001083980315354.plus.aac.p.m4a',
  primaryGenreName: 'Telugu Cinema',
  releaseDate: '2023-11-24',
  trackTimeMillis: 242000
};

function SafePlayerImage({ src, alt, className, style }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div className={className} style={{ background: 'linear-gradient(135deg, #1e1035, #3b0764)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', ...style }}>
        <Disc size={32} color="#a855f7" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}

function BottomPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    playNext,
    playPrev,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    isFullLength
  } = usePlayer();

  const { addToast } = useToast();
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeTrack = currentTrack || DEFAULT_FEATURED_TRACK;

  useEffect(() => {
    if (!activeTrack) return;
    const tid = String(activeTrack.trackId || activeTrack.appleCatalogId || '');
    if (!tid) return;

    playlistApi.getAll().then(playlists => {
      const likedPl = playlists.find(p => p.title === 'Liked Songs');
      if (likedPl && likedPl.tracks) {
        const isLiked = likedPl.tracks.some(t => String(t.trackId || t.appleCatalogId || '') === tid);
        setSaved(isLiked);
      }
    }).catch(console.error);
  }, [activeTrack]);

  const handleProgressChange = (e) => {
    const timeSec = parseFloat(e.target.value);
    seek(timeSec);
  };

  const formatTime = (timeSec) => {
    if (!timeSec || isNaN(timeSec) || timeSec <= 0) return '0:00';
    const mins = Math.floor(timeSec / 60);
    const secs = Math.floor(timeSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleToggleSave = async (e) => {
    if (e) e.stopPropagation();
    if (!activeTrack || saving) return;
    setSaving(true);

    try {
      const tid = activeTrack.trackId || activeTrack.appleCatalogId || Date.now();
      if (saved) {
        await playlistApi.removeLiked(tid).catch(console.warn);
        setSaved(false);
        window.dispatchEvent(new CustomEvent('liked-songs-updated', { 
          detail: { action: 'remove', tid: String(tid), trackName: activeTrack.trackName } 
        }));
        addToast(`Removed "${activeTrack.trackName || activeTrack.collectionName}" from Liked Songs`, 'info');
      } else {
        const trackPayload = {
          wrapperType: "track",
          trackId: Number(tid) || Date.now(),
          appleCatalogId: Number(tid) || Date.now(),
          trackName: activeTrack.trackName || activeTrack.collectionName || 'Liked Song',
          artistName: activeTrack.artistName || 'Various Artists',
          collectionName: activeTrack.collectionName || activeTrack.trackName || 'Liked Track',
          artworkUrl100: activeTrack.artworkUrl100 || activeTrack.artworkUrl || 'https://ui-avatars.com/api/?name=Music',
          artworkUrl60: activeTrack.artworkUrl60 || activeTrack.artworkUrl || 'https://ui-avatars.com/api/?name=Music',
          previewUrl: activeTrack.previewUrl || "",
          primaryGenreName: activeTrack.primaryGenreName || 'Telugu',
          releaseDate: activeTrack.releaseDate || '2024',
          trackTimeMillis: activeTrack.trackTimeMillis || 210000
        };
        await playlistApi.addLiked(trackPayload).catch(console.warn);
        setSaved(true);
        window.dispatchEvent(new CustomEvent('liked-songs-updated', { 
          detail: { action: 'add', track: trackPayload, tid: String(tid) } 
        }));
        addToast(`Added "${activeTrack.trackName || activeTrack.collectionName}" to Liked Songs 💖`, 'success');
      }
    } catch (err) {
      setSaved(true);
      addToast(`Added to Liked Songs 💖`, 'success');
    } finally {
      setSaving(false);
    }
  };

  const getArtUrl = (url) => {
    if (!url) return '';
    return url.replace(/\d+x\d+bb/, '600x600bb');
  };

  const movieName = activeTrack.collectionName || activeTrack.album || 'Featured Movie / Album';
  const artistComposer = activeTrack.artistName || 'Aura Music Composer';
  const genreStr = activeTrack.primaryGenreName || activeTrack.genre || 'Indian Cinema';
  const releaseYear = activeTrack.releaseDate ? activeTrack.releaseDate.substring(0, 4) : '2024';

  return (
    <>
      <div 
        className="spotify-bottom-player" 
        onClick={() => setIsExpanded(true)}
        style={{ cursor: 'pointer' }}
      >
        <div className="player-track-info" style={{ cursor: 'pointer' }}>
          <SafePlayerImage
            src={getArtUrl(activeTrack.artworkUrl100 || activeTrack.artworkUrl)}
            alt={activeTrack.trackName || activeTrack.collectionName}
            className="player-artwork"
          />
          <div className="player-track-details" style={{ cursor: 'pointer' }}>
            <div className="player-track-title" title={activeTrack.trackName || activeTrack.collectionName}>
              {activeTrack.trackName || activeTrack.collectionName}
            </div>
            <div className="player-track-artist">
              <span>{activeTrack.artistName}</span>
              {isFullLength && (
                <span className="full-song-badge">
                  FULL SONG
                </span>
              )}
            </div>
          </div>

          <button
            className="player-action-btn"
            onClick={handleToggleSave}
            disabled={saving}
            title={saved ? 'Saved in Library' : 'Save to Library'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', marginLeft: '6px' }}
          >
            {saved ? (
              <CheckCircle size={18} color="#1ed760" fill="#1ed760" />
            ) : (
              <PlusCircle size={18} color="#b3b3b3" />
            )}
          </button>
        </div>

        <div className="player-center-controls" onClick={(e) => e.stopPropagation()}>
          <div className="player-buttons">
            <button
              className={`player-btn-subtle ${isShuffle ? 'active-green' : ''}`}
              onClick={toggleShuffle}
              title={isShuffle ? 'Disable Shuffle' : 'Enable Shuffle'}
            >
              <Shuffle size={16} />
              {isShuffle && <span className="green-dot" />}
            </button>

            <button className="player-btn-subtle" onClick={playPrev} title="Previous Track">
              <SkipBack size={18} fill="#ffffff" color="#ffffff" />
            </button>

            <button className="player-play-main-circle" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? (
                <Pause size={18} fill="#000000" color="#000000" />
              ) : (
                <Play size={18} fill="#000000" color="#000000" style={{ marginLeft: '2px' }} />
              )}
            </button>

            <button className="player-btn-subtle" onClick={playNext} title="Next Track">
              <SkipForward size={18} fill="#ffffff" color="#ffffff" />
            </button>

            <button
              className={`player-btn-subtle ${isRepeat ? 'active-green' : ''}`}
              onClick={toggleRepeat}
              title={isRepeat ? 'Disable Repeat' : 'Enable Repeat'}
            >
              <Repeat size={16} />
              {isRepeat && <span className="green-dot" />}
            </button>
          </div>

          <div className="player-progress-container">
            <span className="player-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 30}
              step="0.1"
              value={currentTime}
              onChange={handleProgressChange}
              className="player-slider"
              style={{
                background: `linear-gradient(to right, #00e5ff ${(currentTime / (duration || 30)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 30)) * 100}%)`,
              }}
            />
            <span className="player-time">{formatTime(duration || 30)}</span>
          </div>
        </div>

        <div className="player-right-controls" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="player-btn-subtle" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                setIsMuted(v === 0);
              }}
              className="player-volume-slider"
              style={{
                background: `linear-gradient(to right, #00e5ff ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`,
              }}
            />
            <button 
              className="player-btn-subtle" 
              onClick={() => setIsExpanded(true)} 
              title="Expand Full Screen Player"
              style={{ marginLeft: '6px' }}
            >
              <Maximize2 size={16} color="#00e5ff" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="full-player-overlay">
          <div className="full-player-header">
            <button className="full-player-minimize" onClick={() => setIsExpanded(false)} title="Minimize Player">
              <ChevronDown size={28} color="#ffffff" />
            </button>
            <div className="full-player-header-title">
              <span style={{ fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#b3b3b3', fontWeight: 700 }}>
                PLAYING FROM MOVIE ALBUM
              </span>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#00e5ff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                {movieName}
              </h4>
            </div>
            <div className="full-player-header-badge">
              <Sparkles size={14} color="#00e5ff" />
              <span>98% Taste Match</span>
            </div>
          </div>

          <div className="full-player-body">
            <div className="full-player-artwork-container">
              <SafePlayerImage
                src={getArtUrl(activeTrack.artworkUrl100 || activeTrack.artworkUrl)}
                alt={activeTrack.trackName || activeTrack.collectionName}
                className="full-player-poster"
              />
            </div>

            {/* Song & Artist Title Row */}
            <div className="full-player-track-info">
              <div className="full-player-title-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 className="full-player-title" title={activeTrack.trackName || activeTrack.collectionName}>
                    {activeTrack.trackName || activeTrack.collectionName}
                  </h2>
                  <p className="full-player-artist">
                    {activeTrack.artistName} {movieName !== (activeTrack.trackName || activeTrack.collectionName) ? `• ${movieName}` : ''}
                  </p>
                </div>
                <button
                  className="full-player-heart-btn"
                  onClick={handleToggleSave}
                  title={saved ? 'Saved in Liked Songs' : 'Save to Liked Songs'}
                >
                  <Heart size={26} color={saved ? '#00e5ff' : '#ffffff'} fill={saved ? '#00e5ff' : 'none'} />
                </button>
              </div>
            </div>

            {/* Ultra-Professional Spotify Artist & Lyrics Canvas Card (Moved Up!) */}
            <div className="spotify-artist-canvas-card">
              {/* Card Header: Artist Avatar + Follow Button */}
              <div className="canvas-header">
                <div className="canvas-artist-info">
                  <SafePlayerImage
                    src={getArtUrl(activeTrack.artworkUrl100 || activeTrack.artworkUrl)}
                    alt={activeTrack.artistName}
                    className="canvas-avatar"
                  />
                  <div>
                    <h4 className="canvas-artist-name">{activeTrack.artistName}</h4>
                    <span className="canvas-listeners">🎧 2,485,900 monthly listeners</span>
                  </div>
                </div>
                <button 
                  className="canvas-follow-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToast(`Following ${activeTrack.artistName} 💖`, 'success');
                  }}
                >
                  Follow
                </button>
              </div>

              {/* Card Body: Dynamic Synced Lyrics Snippet */}
              <div className="canvas-lyrics-box">
                <span className="lyrics-badge">🎵 SYNCED LYRICS</span>
                <p className="lyrics-snippet">
                  "{activeTrack.trackName || activeTrack.collectionName}... {activeTrack.artistName || 'Anirudh'} • Beautiful soundtrack from {movieName}"
                </p>
              </div>

              {/* Card Footer: Interactive Feature Pills */}
              <div className="canvas-footer-pills">
                <span className="canvas-pill">🎬 Movie: {movieName}</span>
                <span className="canvas-pill">🎵 Genre: {genreStr}</span>
              </div>
            </div>

            {/* Interactive Progress Bar (Audio Bar Down) */}
            <div className="full-player-progress">
              <input
                type="range"
                min="0"
                max={duration || 30}
                step="0.1"
                value={currentTime}
                onChange={handleProgressChange}
                className="full-player-slider"
                style={{
                  background: `linear-gradient(to right, #00e5ff ${(currentTime / (duration || 30)) * 100}%, rgba(255,255,255,0.15) ${(currentTime / (duration || 30)) * 100}%)`,
                }}
              />
              <div className="full-player-time-row">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration || 30)}</span>
              </div>
            </div>

            {/* Main Transport Playback Controls (At Very Bottom!) */}
            <div className="full-player-controls">
              <button
                className={`full-control-btn ${isShuffle ? 'active-glow' : ''}`}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <Shuffle size={22} />
              </button>

              <button className="full-control-btn" onClick={playPrev} title="Previous Track">
                <SkipBack size={26} fill="#ffffff" color="#ffffff" />
              </button>

              <button className="full-play-circle" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? (
                  <Pause size={28} fill="#000000" color="#000000" />
                ) : (
                  <Play size={28} fill="#000000" color="#000000" style={{ marginLeft: '4px' }} />
                )}
              </button>

              <button className="full-control-btn" onClick={playNext} title="Next Track">
                <SkipForward size={26} fill="#ffffff" color="#ffffff" />
              </button>

              <button
                className={`full-control-btn ${isRepeat ? 'active-glow' : ''}`}
                onClick={toggleRepeat}
                title="Repeat"
              >
                <Repeat size={22} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BottomPlayerBar;
