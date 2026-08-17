import { useState, useEffect, useRef } from 'react';
import { searchApi, libraryApi } from '../api';
import { useToast } from '../App';
import { X, Play, Pause, ExternalLink, Plus, Check, Music, Star, Volume2 } from 'lucide-react';

function AlbumPlayerModal({ album, isSaved, savedItem, onClose, onLibraryUpdate }) {
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userRating, setUserRating] = useState(savedItem?.userRating || null);
  const [userNotes, setUserNotes] = useState(savedItem?.userNotes || '');
  const [saving, setSaving] = useState(false);
  const [inLibrary, setInLibrary] = useState(isSaved);
  const audioRef = useRef(null);
  const { addToast } = useToast();

  const catalogId = album.appleCatalogId || album.collectionId;
  const title = album.title || album.collectionName;
  const artist = album.artistName;
  const genre = album.genre || album.primaryGenreName;
  const releaseDate = album.releaseDate;
  const artworkUrl = album.artworkUrl || album.artworkUrl100;
  const collectionPrice = album.collectionPrice;

  useEffect(() => {
    if (catalogId) {
      setLoadingTracks(true);
      searchApi.getAlbumTracks(catalogId)
        .then(data => {
          const res = data.results || [];
          // Filter to song items only (skip album item)
          const songList = res.filter(item => item.wrapperType === 'track');
          setTracks(songList);
        })
        .catch(err => {
          console.error("Failed to load album tracks:", err);
        })
        .finally(() => setLoadingTracks(false));
    }
  }, [catalogId]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlayTrack = (track) => {
    if (!track.previewUrl) {
      addToast('No audio preview available for this track', 'info');
      return;
    }

    if (currentTrack?.trackId === track.trackId) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(track.previewUrl);
      audioRef.current = audio;
      audio.play().then(() => {
        setCurrentTrack(track);
        setIsPlaying(true);
      }).catch(err => {
        addToast('Audio playback failed', 'error');
      });

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTrack(null);
      };
    }
  };

  const handleSaveToLibrary = async () => {
    setSaving(true);
    try {
      if (savedItem?.id) {
        // Update
        const updated = await libraryApi.update(savedItem.id, { userRating, userNotes });
        addToast(`Updated rating/notes for "${title}"!`, 'success');
        if (onLibraryUpdate) onLibraryUpdate(updated);
      } else {
        // Add new
        const newObj = await libraryApi.add({
          appleCatalogId: catalogId,
          title,
          artistName: artist,
          genre,
          releaseDate,
          trackCount: tracks.length || album.trackCount,
          artworkUrl,
          collectionPrice,
          userRating,
          userNotes,
        });
        setInLibrary(true);
        addToast(`"${title}" saved to your library!`, 'success');
        if (onLibraryUpdate) onLibraryUpdate(newObj);
      }
    } catch (err) {
      addToast(err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return '--:--';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const getHighResArt = (url) => {
    if (!url) return '';
    return url.replace(/\d+x\d+bb/, '500x500bb');
  };

  const getYear = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.substring(0, 4);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal slide-up" style={{ maxWidth: '650px', width: '95%' }}>
        <div className="modal-header">
          <h2>Album Details & Player</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          {/* Header Card */}
          <div className="add-modal-album-info" style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <img
              src={getHighResArt(artworkUrl)}
              alt={title}
              style={{ width: '110px', height: '110px', borderRadius: '12px', objectFit: 'cover' }}
            />
            <div className="add-modal-album-details" style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--accent-purple)', fontWeight: '600', marginTop: '2px' }}>{artist}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {genre} · {getYear(releaseDate)} {collectionPrice ? `· $${collectionPrice}` : ''}
              </p>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className={`btn btn-sm ${inLibrary ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleSaveToLibrary}
                  disabled={saving}
                >
                  {inLibrary ? <Check size={14} /> : <Plus size={14} />}
                  {inLibrary ? 'Saved in Library' : 'Add to Library'}
                </button>
                {album.collectionViewUrl && (
                  <a
                    href={album.collectionViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <ExternalLink size={14} /> Apple Music
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* User Rating & Notes Section */}
          <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'var(--bg-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="form-label" style={{ margin: 0 }}>Your Rating</span>
              <div className="star-rating" style={{ fontSize: '1.3rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`star ${userRating >= star ? 'filled' : ''}`}
                    onClick={() => setUserRating(userRating === star ? null : star)}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <textarea
                className="form-input"
                placeholder="Write your personal notes or review for this album..."
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={2}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
            {(userRating !== savedItem?.userRating || userNotes !== (savedItem?.userNotes || '')) && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveToLibrary} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Rating & Notes'}
                </button>
              </div>
            )}
          </div>

          {/* Tracklist & Audio Previews */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={16} className="ai-glow" /> Track Previews {tracks.length > 0 ? `(${tracks.length})` : ''}
            </h4>

            {loadingTracks ? (
              <div className="loading-container" style={{ padding: '1.5rem 0' }}>
                <div className="loading-spinner" style={{ width: '24px', height: '24px' }}></div>
                <p className="loading-text" style={{ fontSize: '0.8rem' }}>Loading track previews...</p>
              </div>
            ) : tracks.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                No track previews found for this album.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {tracks.map((track, idx) => {
                  const isThisPlaying = currentTrack?.trackId === track.trackId && isPlaying;
                  return (
                    <div
                      key={track.trackId || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isThisPlaying ? 'rgba(139, 92, 246, 0.15)' : 'var(--bg-glass)',
                        border: isThisPlaying ? '1px solid var(--accent-purple)' : '1px solid transparent',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <button
                          onClick={() => togglePlayTrack(track)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isThisPlaying ? 'var(--accent-purple)' : 'var(--bg-tertiary)',
                            border: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center',
                            cursor: track.previewUrl ? 'pointer' : 'not-allowed',
                            opacity: track.previewUrl ? 1 : 0.4,
                            flexShrink: 0,
                          }}
                          title={track.previewUrl ? 'Play 30s Audio Preview' : 'No preview available'}
                        >
                          {isThisPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
                        </button>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '20px' }}>
                          {track.trackNumber || idx + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '0.85rem',
                            fontWeight: isThisPlaying ? '600' : '400',
                            color: isThisPlaying ? 'var(--accent-purple)' : 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {track.trackName}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '12px' }}>
                        {formatDuration(track.trackTimeMillis)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlbumPlayerModal;
