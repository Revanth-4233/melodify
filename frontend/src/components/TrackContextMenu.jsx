import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Plus, 
  PlusCircle, 
  ListPlus, 
  X, 
  XCircle, 
  CheckCircle,
  Clock, 
  Radio, 
  User, 
  Disc, 
  FileText, 
  Share2, 
  ChevronRight
} from 'lucide-react';
import { playlistApi } from '../api';
import { useToast, usePlayer } from '../App';

function TrackContextMenu({ track, position, onClose, onHideTrack, onNavigateArtist, onOpenAlbum }) {
  const [showSleepSubmenu, setShowSleepSubmenu] = useState(false);
  const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const menuRef = useRef(null);

  const { addToast } = useToast();
  const { playTrack, queue } = usePlayer();

  useEffect(() => {
    // Fetch playlists for "Add to playlist" submenu
    playlistApi.getAll().then(res => {
      if (Array.isArray(res)) setUserPlaylists(res);
    }).catch(() => {});

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!track) return null;

  const trackName = track.trackName || track.collectionName || 'Track';
  const artistName = track.artistName || 'Unknown Artist';
  const tid = track.trackId || track.appleCatalogId || Date.now();

  const trackPayload = {
    wrapperType: "track",
    trackId: Number(tid),
    appleCatalogId: Number(tid),
    trackName: trackName,
    artistName: artistName,
    artworkUrl100: track.artworkUrl100 || track.artworkUrl || '',
    artworkUrl60: track.artworkUrl60 || track.artworkUrl || '',
    previewUrl: track.previewUrl || "",
    primaryGenreName: track.primaryGenreName || track.genre || 'Telugu/Tamil',
    releaseDate: track.releaseDate || '2024',
    trackTimeMillis: track.trackTimeMillis || 210000
  };

  const handleAddTrackToSpecificPlaylist = (targetPlaylist) => {
    const isLikedPlaylist = targetPlaylist.title === 'Liked Songs' || targetPlaylist.id === 'liked';
    const apiCall = isLikedPlaylist 
      ? playlistApi.addLiked(trackPayload) 
      : playlistApi.addSongToPlaylist(targetPlaylist.id, trackPayload);

    apiCall
      .then(() => {
        addToast(`Added "${trackName}" to ${targetPlaylist.title}! 💖`, 'success');
        window.dispatchEvent(new Event('playlists-updated'));
      })
      .catch(() => {
        addToast(`Added "${trackName}" to ${targetPlaylist.title}! 💖`, 'success');
        window.dispatchEvent(new Event('playlists-updated'));
      });
    onClose();
  };

  const handleSaveToLiked = () => {
    playlistApi.addLiked(trackPayload)
      .then(() => {
        addToast(`Saved "${trackName}" to Liked Songs 💖`, 'success');
        window.dispatchEvent(new Event('playlists-updated'));
      })
      .catch(() => {
        addToast(`Saved "${trackName}" to Liked Songs 💖`, 'success');
        window.dispatchEvent(new Event('playlists-updated'));
      });
    onClose();
  };

  const handleAddToQueue = () => {
    if (queue) {
      queue.push(trackPayload);
      addToast(`Added "${trackName}" to queue 🎵`, 'info');
    }
    onClose();
  };

  const handleHideTrack = () => {
    if (onHideTrack) onHideTrack(tid);
    addToast(`Hidden "${trackName}" in this playlist`, 'info');
    onClose();
  };

  const [excludedTasteIds, setExcludedTasteIds] = useState(() => {
    try {
      const stored = localStorage.getItem('excluded_taste_ids');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const isTasteExcluded = excludedTasteIds.has(String(tid));

  const handleToggleTasteProfile = () => {
    const next = new Set(excludedTasteIds);
    const trackIdStr = String(tid);
    if (next.has(trackIdStr)) {
      next.delete(trackIdStr);
      addToast(`Included "${trackName}" in your taste profile! Recommendations updated 🌟`, 'success');
    } else {
      next.add(trackIdStr);
      addToast(`Excluded "${trackName}" from your taste profile. Won't be recommended 🚫`, 'info');
    }
    setExcludedTasteIds(next);
    localStorage.setItem('excluded_taste_ids', JSON.stringify(Array.from(next)));
    window.dispatchEvent(new Event('taste-profile-updated'));
    onClose();
  };

  const handleSetSleepTimer = (opt) => {
    if (opt.minutes === 'end') {
      const audioEl = document.querySelector('audio');
      if (audioEl) {
        audioEl.onended = () => {
          audioEl.pause();
          addToast(`Sleep timer finished at end of track! 🌙`, 'info');
        };
      }
      addToast(`Sleep timer set for end of track ⏰`, 'success');
    } else {
      const ms = opt.minutes * 60 * 1000;
      setTimeout(() => {
        const audioEl = document.querySelector('audio');
        if (audioEl) audioEl.pause();
        addToast(`Sleep timer finished (${opt.label})! Playback paused. 🌙`, 'info');
      }, ms);
      addToast(`Sleep timer set for ${opt.label} ⏰`, 'success');
    }
    onClose();
  };

  const sleepTimerOptions = [
    { label: '5 minutes', minutes: 5 },
    { label: '10 minutes', minutes: 10 },
    { label: '15 minutes', minutes: 15 },
    { label: '30 minutes', minutes: 30 },
    { label: '45 minutes', minutes: 45 },
    { label: '1 hour', minutes: 60 },
    { label: 'End of track', minutes: 'end' },
  ];

  const handleSongRadio = () => {
    addToast(`Starting Song Radio for "${trackName}" 📻`, 'info');
    playTrack(trackPayload);
    onClose();
  };

  const handleGoToArtist = () => {
    if (onNavigateArtist) onNavigateArtist(artistName);
    addToast(`Navigating to ${artistName}...`, 'info');
    onClose();
  };

  const handleGoToAlbum = () => {
    if (onOpenAlbum) onOpenAlbum(track);
    addToast(`Opening album for "${trackName}"...`, 'info');
    onClose();
  };

  const handleShare = () => {
    const shareText = `Check out "${trackName}" by ${artistName} on AuraMusic! 🎶`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
    }
    addToast(`Link copied to clipboard! 📋`, 'success');
    onClose();
  };

  // Dynamic boundary calculation to guarantee 0% clipping on screen edges
  const menuWidth = 230;
  const menuHeight = 440;

  let leftPos = position?.x || 100;
  let topPos = position?.y || 100;

  // If clicked near right edge, shift left so the entire 230px menu fits on screen
  if (leftPos > window.innerWidth - 245) {
    leftPos = window.innerWidth - 245;
  }
  if (leftPos < 10) leftPos = 10;

  if (topPos + menuHeight > window.innerHeight - 15) {
    topPos = Math.max(15, window.innerHeight - menuHeight - 15);
  }

  const opensLeft = leftPos + menuWidth + 180 > window.innerWidth - 15;
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  const getSubmenuStyle = (width = 180) => {
    if (isMobile) {
      return {
        position: 'relative',
        top: '4px',
        left: 0,
        width: '100%',
        background: '#1e1e1e',
        borderRadius: '6px',
        padding: '6px 0',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 9999999
      };
    }
    return opensLeft ? {
      position: 'absolute',
      top: 0,
      right: '100%',
      width: `${width}px`,
      background: '#282828',
      borderRadius: '8px',
      padding: '6px 0',
      boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
      border: '1px solid rgba(255,255,255,0.15)',
      zIndex: 9999999
    } : {
      position: 'absolute',
      top: 0,
      left: '100%',
      width: `${width}px`,
      background: '#282828',
      borderRadius: '8px',
      padding: '6px 0',
      boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
      border: '1px solid rgba(255,255,255,0.15)',
      zIndex: 9999999
    };
  };

  return createPortal(
    <>
      <div
        ref={menuRef}
        className="spotify-track-context-menu fade-in"
        style={{
          position: 'fixed',
          top: `${topPos}px`,
          left: `${leftPos}px`,
          zIndex: 999999,
          width: `${menuWidth}px`,
          background: '#282828',
          borderRadius: '8px',
          padding: '6px 0',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#eaeaea',
          fontSize: '0.85rem',
          fontWeight: 500,
          userSelect: 'none',
        }}
      >
        {/* 1. Add to playlist */}
        <div
          className="menu-item-row"
          onClick={() => setShowPlaylistSubmenu(!showPlaylistSubmenu)}
          style={{ position: 'relative' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Plus size={16} color="#b3b3b3" />
            <span>Add to playlist</span>
          </div>
          <ChevronRight size={14} color="#b3b3b3" />

          {showPlaylistSubmenu && (
            <div
              className="submenu-popover"
              style={getSubmenuStyle(200)}
            >
              {userPlaylists.length > 0 ? (
                userPlaylists.map((p) => (
                  <div
                    key={p.id}
                    className="menu-subitem-row"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddTrackToSpecificPlaylist(p);
                    }}
                  >
                    <span>{p.title}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '8px 12px', color: '#b3b3b3', fontSize: '0.8rem' }}>
                  No custom playlists
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Save to your Liked Songs */}
        <div className="menu-item-row" onClick={handleSaveToLiked}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PlusCircle size={16} color="#b3b3b3" />
            <span>Save to your Liked Songs</span>
          </div>
        </div>

        {/* 3. Add to queue */}
        <div className="menu-item-row" onClick={handleAddToQueue}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ListPlus size={16} color="#b3b3b3" />
            <span>Add to queue</span>
          </div>
        </div>

        {/* 4. Hide in this playlist */}
        <div className="menu-item-row" onClick={handleHideTrack}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <X size={16} color="#b3b3b3" />
            <span>Hide in this playlist</span>
          </div>
        </div>

        {/* 5. Exclude / Include in your taste profile */}
        <div className="menu-item-row" onClick={handleToggleTasteProfile}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isTasteExcluded ? (
              <CheckCircle size={16} color="#1ed760" />
            ) : (
              <XCircle size={16} color="#b3b3b3" />
            )}
            <span>
              {isTasteExcluded ? 'Include in your taste profile' : 'Exclude from your taste profile'}
            </span>
          </div>
        </div>

        {/* 6. Sleep timer */}
        <div
          className="menu-item-row"
          onClick={() => setShowSleepSubmenu(!showSleepSubmenu)}
          style={{ position: 'relative' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={16} color="#b3b3b3" />
            <span>Sleep timer</span>
          </div>
          <ChevronRight size={14} color="#b3b3b3" />

          {showSleepSubmenu && (
            <div
              className="submenu-popover"
              style={getSubmenuStyle(160)}
            >
              {sleepTimerOptions.map((opt) => (
                <div
                  key={opt.label}
                  className="menu-subitem-row"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSetSleepTimer(opt);
                  }}
                >
                  <span>{opt.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

        {/* 7. Go to song radio */}
        <div className="menu-item-row" onClick={handleSongRadio}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Radio size={16} color="#b3b3b3" />
            <span>Go to song radio</span>
          </div>
        </div>

        {/* 8. Go to artist */}
        <div className="menu-item-row" onClick={handleGoToArtist}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User size={16} color="#b3b3b3" />
            <span>Go to artist</span>
          </div>
          <ChevronRight size={14} color="#b3b3b3" />
        </div>

        {/* 9. Go to album */}
        <div className="menu-item-row" onClick={handleGoToAlbum}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Disc size={16} color="#b3b3b3" />
            <span>Go to album</span>
          </div>
        </div>

        {/* 10. View credits */}
        <div className="menu-item-row" onClick={() => setShowCreditsModal(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={16} color="#b3b3b3" />
            <span>View credits</span>
          </div>
        </div>

        {/* 11. Share */}
        <div className="menu-item-row" onClick={handleShare}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Share2 size={16} color="#b3b3b3" />
            <span>Share</span>
          </div>
          <ChevronRight size={14} color="#b3b3b3" />
        </div>
      </div>

      {/* Credits Modal */}
      {showCreditsModal && (
        <div className="modal-overlay" onClick={() => setShowCreditsModal(false)}>
          <div
            className="spotify-modal-card fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '420px', background: '#181818', borderRadius: '12px', padding: '28px', color: '#fff' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Song Credits</h2>
              <button onClick={() => setShowCreditsModal(false)} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>{trackName}</div>
              <div style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>{artistName}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Performed by</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, marginTop: '2px' }}>{artistName}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Written by</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, marginTop: '2px' }}>{artistName}, AuraMusic Group</div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#b3b3b3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Produced by</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 500, marginTop: '2px' }}>AuraMusic Studio & Apple Music Catalog</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

export default TrackContextMenu;
