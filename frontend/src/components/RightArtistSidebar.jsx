import { usePlayer } from '../App';
import { Plus, Check, Disc, ExternalLink, Sparkles, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { libraryApi } from '../api';
import { useToast } from '../App';

function RightArtistSidebar({ width }) {
  const { currentTrack, isPlaying, sidebarWidth } = usePlayer();
  const [saved, setSaved] = useState(false);
  const { addToast } = useToast();

  const activeWidth = width || sidebarWidth || 340;

  const [isTasteExcluded, setIsTasteExcluded] = useState(false);

  const checkTasteStatus = () => {
    if (!currentTrack) return;
    const tid = String(currentTrack.trackId || currentTrack.appleCatalogId || '');
    try {
      const stored = localStorage.getItem('excluded_taste_ids');
      const set = stored ? new Set(JSON.parse(stored)) : new Set();
      setIsTasteExcluded(set.has(tid));
    } catch (e) {
      setIsTasteExcluded(false);
    }
  };

  useEffect(() => {
    if (currentTrack) {
      setSaved(currentTrack.inLibrary || false);
      checkTasteStatus();
    }

    window.addEventListener('taste-profile-updated', checkTasteStatus);
    return () => window.removeEventListener('taste-profile-updated', checkTasteStatus);
  }, [currentTrack]);

  if (!currentTrack) {
    return (
      <aside className="spotify-right-sidebar" style={{ width: `${activeWidth}px` }}>
        <div className="sidebar-right-empty">
          <Disc size={44} className="ai-glow" />
          <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Aura Hub Insights</h3>
          <p style={{ fontSize: '0.82rem' }}>Select any song or album to view artist details and AI taste analysis</p>
        </div>
      </aside>
    );
  }

  const getArtUrl = (url) => {
    if (!url) return '';
    return url.replace(/\d+x\d+bb/, '500x500bb');
  };

  const handleSave = async () => {
    try {
      await libraryApi.add({
        appleCatalogId: currentTrack.collectionId || currentTrack.trackId || Date.now(),
        title: currentTrack.collectionName || currentTrack.trackName || 'Unknown Title',
        artistName: currentTrack.artistName || 'Unknown Artist',
        genre: currentTrack.primaryGenreName || 'Music',
        releaseDate: currentTrack.releaseDate || '2024',
        artworkUrl: currentTrack.artworkUrl100 || '',
        userRating: 5,
        userNotes: 'Added from Aura Player',
      });
      setSaved(true);
      addToast(`Saved "${currentTrack.trackName || currentTrack.collectionName}" to library! ❤️`, 'success');
    } catch (err) {
      addToast('Track is already in your library!', 'info');
    }
  };

  const handleTasteToggle = () => {
    if (!currentTrack) return;
    const tid = String(currentTrack.trackId || currentTrack.appleCatalogId || '');
    try {
      const stored = localStorage.getItem('excluded_taste_ids');
      let set = stored ? new Set(JSON.parse(stored)) : new Set();
      if (set.has(tid)) {
        set.delete(tid);
        addToast(`Included "${currentTrack.trackName || currentTrack.collectionName}" back in your AI Taste Profile! ✨`, 'success');
      } else {
        set.add(tid);
        addToast(`Excluded "${currentTrack.trackName || currentTrack.collectionName}" from your AI Taste Profile! 🛑`, 'info');
      }
      localStorage.setItem('excluded_taste_ids', JSON.stringify(Array.from(set)));
      setIsTasteExcluded(set.has(tid));
      window.dispatchEvent(new Event('taste-profile-updated'));
    } catch (e) {
      console.error(e);
    }
  };

  // Generate monthly listeners based on artist string hash
  const getListenersStr = (name) => {
    if (!name) return '12,450,910';
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const num = Math.abs(hash % 45000000) + 5000000;
    return num.toLocaleString();
  };

  // AI Taste Match calculation
  const getTasteMatch = (name) => {
    if (!name) return 94;
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return 88 + (hash % 11);
  };

  return (
    <aside
      className="spotify-right-sidebar"
      style={{
        width: `${activeWidth}px`,
        maxHeight: 'calc(100vh - 90px)',
        overflowY: 'auto',
        paddingBottom: '120px',
        boxSizing: 'border-box'
      }}
    >
      <div className="sidebar-right-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Aura Insights</h3>
        {isPlaying && (
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={14} className="ai-glow" /> NOW PLAYING
          </span>
        )}
      </div>

      {/* Main Track Image */}
      <div className="sidebar-right-card">
        <div className="sidebar-artist-img-wrapper">
          <img
            src={getArtUrl(currentTrack.artworkUrl100 || currentTrack.artworkUrl)}
            alt={currentTrack.trackName || currentTrack.collectionName}
            className="sidebar-artist-img"
          />
        </div>

        <div className="sidebar-artist-meta">
          <h2 className="sidebar-track-name">{currentTrack.trackName || currentTrack.collectionName}</h2>
          <p className="sidebar-artist-name">{currentTrack.artistName}</p>
        </div>
      </div>

      {/* AI Taste Match Badge */}
      <div style={{
        background: isTasteExcluded ? 'rgba(255, 255, 255, 0.04)' : 'var(--grad-card)',
        border: isTasteExcluded ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: isTasteExcluded ? '#b3b3b3' : 'var(--neon-violet)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: isTasteExcluded ? '#b3b3b3' : 'var(--text-secondary)' }}>
            {isTasteExcluded ? 'Taste Profile Status' : 'AI Taste Match'}
          </span>
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: '900', color: isTasteExcluded ? '#b3b3b3' : 'var(--neon-violet)' }}>
          {isTasteExcluded ? 'Excluded 🚫' : `${getTasteMatch(currentTrack.artistName)}%`}
        </span>
      </div>

      {/* About the Artist Box */}
      <div className="sidebar-about-artist" style={{ marginBottom: '24px' }}>
        <h4 className="sidebar-section-title">About the artist</h4>
        <div className="sidebar-artist-box" style={{ paddingBottom: '16px' }}>
          <div className="sidebar-artist-avatar-wrapper">
            <img
              src={getArtUrl(currentTrack.artworkUrl100 || currentTrack.artworkUrl)}
              alt={currentTrack.artistName}
              className="sidebar-artist-avatar"
            />
          </div>
          <div className="sidebar-artist-box-info">
            <div className="sidebar-artist-badge-name">
              <span>{currentTrack.artistName}</span>
              <Check size={14} className="verified-badge" />
            </div>
            <p className="sidebar-listeners-count">{getListenersStr(currentTrack.artistName)} monthly listeners</p>
            <p className="sidebar-artist-bio">
              Top trending South Indian composer & artist. Known for hit releases in Telugu, Tamil, and Indian cinema.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 24px',
                  borderRadius: '50px',
                  background: saved ? 'transparent' : '#ffffff',
                  color: saved ? '#ffffff' : '#000000',
                  border: saved ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid #ffffff',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                }}
              >
                {saved ? <Check size={14} /> : <Plus size={14} />}
                {saved ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default RightArtistSidebar;
