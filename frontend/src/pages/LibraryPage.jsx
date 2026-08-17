import { useState, useEffect, useCallback } from 'react';
import { libraryApi, recommendationsApi, searchApi } from '../api';
import { useToast, usePlayer } from '../App';
import { Search, Trash2, Edit3, Library, X, Play, Sparkles } from 'lucide-react';
import AlbumDetailView from '../components/AlbumDetailView';

const FALLBACK_LIBRARY_ITEMS = [
  { id: 1001, title: 'Devara Part 1', artistName: 'Anirudh Ravichander', genre: 'Telugu Action', releaseDate: '2024-09-27', artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/9d/28/919d28e7-c6ee-d0b8-c30c-2a5433ce8538/886449120786.jpg/500x500bb.jpg', userRating: 5, userNotes: 'Blockbuster Telugu Beats!' },
  { id: 1002, title: 'Pushpa 2 The Rule', artistName: 'Devi Sri Prasad', genre: 'Telugu Mass', releaseDate: '2024-12-05', artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7e/bb/12/7ebb12e6-76dd-d922-263a-bbce5d8c3fb9/886449231840.jpg/500x500bb.jpg', userRating: 5, userNotes: 'Wild DSP Energy & Mass Melodies' },
  { id: 1003, title: 'Guntur Kaaram', artistName: 'Thaman S', genre: 'Telugu Commercial', releaseDate: '2024-01-12', artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ff/e9/12/ffe9126b-d040-f90c-2df7-6baf1d00d1e6/cover.jpg/500x500bb.jpg', userRating: 4, userNotes: 'Kurchi Madathapetti Energy!' },
  { id: 1004, title: 'Hi Nanna', artistName: 'Hesham Abdul Wahab', genre: 'Telugu Melody', releaseDate: '2023-12-07', artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/4d/7c/4a/4d7c4a33-0c3b-b0e5-1e5a-8182d9a25811/cover.jpg/500x500bb.jpg', userRating: 5, userNotes: 'Pure Heartwarming Melodies' }
];

function LibraryPage() {
  const [items, setItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trendingAlbums, setTrendingAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [direction, setDirection] = useState('desc');
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ userRating: null, userNotes: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [playerAlbum, setPlayerAlbum] = useState(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const { playTrack } = usePlayer();

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await libraryApi.getAll(0, 200, sortBy, direction);
      if (data && Array.isArray(data.content) && data.content.length > 0) {
        setItems(data.content);
      } else {
        setItems(FALLBACK_LIBRARY_ITEMS);
      }
    } catch (err) {
      setItems(FALLBACK_LIBRARY_ITEMS);
    } finally {
      setLoading(false);
    }
  }, [sortBy, direction]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const recs = await recommendationsApi.getRecommendations();
      setRecommendations(recs || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  }, []);

  const fetchTrending = useCallback(async () => {
    try {
      const data = await searchApi.search('Trending Hits 2026', 12);
      setTrendingAlbums(data.results || []);
    } catch (err) {
      console.error('Failed to load trending albums:', err);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
    fetchRecommendations();
    fetchTrending();
  }, [fetchLibrary, fetchRecommendations, fetchTrending]);

  if (playerAlbum) {
    return (
      <AlbumDetailView
        album={playerAlbum}
        onClose={() => setPlayerAlbum(null)}
        onLibraryUpdate={fetchLibrary}
      />
    );
  }

  const handleEdit = (item) => {
    setEditModal(item);
    setEditForm({
      userRating: item.userRating || null,
      userNotes: item.userNotes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const updated = await libraryApi.update(editModal.id, editForm);
      setItems(prev => prev.map(i => i.id === editModal.id ? updated : i));
      setEditModal(null);
      addToast('Album updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await libraryApi.delete(id);
      setItems(prev => prev.filter(i => i.id !== id));
      setDeleteConfirm(null);
      addToast('Album removed from library', 'info');
    } catch (err) {
      addToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleLibraryUpdateFromPlayer = (updatedItem) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === updatedItem.id || i.appleCatalogId === updatedItem.appleCatalogId);
      if (exists) {
        return prev.map(i => (i.id === updatedItem.id || i.appleCatalogId === updatedItem.appleCatalogId) ? updatedItem : i);
      }
      return [updatedItem, ...prev];
    });
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.artistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHighResArt = (url) => {
    if (!url) return '';
    return url.replace(/\d+x\d+bb/, '500x500bb');
  };

  const getYear = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.substring(0, 4);
  };

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map(star => (
      <span key={star} style={{ color: rating >= star ? 'var(--accent-amber)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your library...</p>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">My Library</h1>
        <p className="page-subtitle">
          {items.length} album{items.length !== 1 ? 's' : ''} in your collection
        </p>
      </div>

      {items.length > 0 && (
        <div className="library-toolbar">
          <div className="input-group">
            <Search />
            <input
              id="library-search"
              className="input-field"
              type="text"
              placeholder="Filter by title, artist, or genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="library-sort">
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">Date Added</option>
              <option value="title">Title</option>
              <option value="artistName">Artist</option>
              <option value="userRating">Rating</option>
              <option value="releaseDate">Release Date</option>
            </select>
            <select
              id="sort-direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="empty-state">
          <Library />
          <h3>Your library is empty</h3>
          <p>Head to the Search page to discover and add albums to your collection</p>
        </div>
      )}

      {items.length > 0 && filteredItems.length === 0 && (
        <div className="empty-state">
          <Search />
          <h3>No matches found</h3>
          <p>Try a different filter term</p>
        </div>
      )}

      <div className="library-grid">
        {filteredItems.map(item => (
          <div key={item.id} className="library-card">
            <div
              className="library-card-top"
              onClick={() => setPlayerAlbum(item)}
              style={{ cursor: 'pointer' }}
              title="Click to open album player and details"
            >
              <div className="library-card-artwork">
                <img
                  src={getHighResArt(item.artworkUrl)}
                  alt={item.title}
                  loading="lazy"
                />
              </div>
              <div className="library-card-details">
                <div className="library-card-title" title={item.title}>{item.title}</div>
                <div className="library-card-artist">{item.artistName}</div>
                <div className="library-card-genre-year">
                  <span className="album-card-genre">{item.genre}</span>
                  <span className="album-card-year">{getYear(item.releaseDate)}</span>
                </div>
                {item.userRating && (
                  <div style={{ marginTop: '4px' }}>
                    {renderStars(item.userRating)}
                  </div>
                )}
              </div>
            </div>
            {item.userNotes && (
              <div className="library-card-notes">
                <p>"{item.userNotes}"</p>
              </div>
            )}
            <div className="library-card-actions">
              <button className="btn btn-primary btn-sm" onClick={() => setPlayerAlbum(item)}>
                <Play size={14} /> Listen & Details
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item)}>
                <Edit3 size={14} /> Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(item)}>
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recommended for You Section */}
      {recommendations.length > 0 && (
        <div style={{ marginTop: '40px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={22} color="#1ed760" />
            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Recommended for You</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {recommendations.map((rec, index) => (
              <div
                key={rec.appleCatalogId || index}
                style={{
                  background: '#181818',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  position: 'relative'
                }}
                className="spotify-album-card"
                onClick={() => playTrack(rec, recommendations, index)}
              >
                <img
                  src={getHighResArt(rec.artworkUrl100)}
                  alt={rec.trackName}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                />
                <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                  {rec.trackName}
                </div>
                <div style={{ fontSize: '12px', color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }}>
                  {rec.artistName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Albums Section */}
      {trendingAlbums.length > 0 && (
        <div style={{ marginTop: '40px', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sparkles size={22} color="#ec4899" />
            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Trending Hits & Albums</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {trendingAlbums.map((album, index) => {
              const displayAlbum = { 
                  collectionId: album.collectionId,
                  collectionName: album.collectionName,
                  artworkUrl100: album.artworkUrl100,
                  artistName: album.artistName,
                  isCustomPlaylist: true,
                  searchQuery: album.collectionName
              };
              return (
              <div
                key={album.collectionId || index}
                style={{
                  background: '#181818',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  position: 'relative'
                }}
                className="spotify-album-card"
                onClick={() => setPlayerAlbum(displayAlbum)}
              >
                <img
                  src={getHighResArt(album.artworkUrl100)}
                  alt={album.collectionName}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                />
                <div style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                  {album.collectionName}
                </div>
                <div style={{ fontSize: '12px', color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }}>
                  {album.artistName}
                </div>
              </div>
            )})}
          </div>
        </div>
      )}

      {/* Album Player Modal */}
      {playerAlbum && (
        <AlbumDetailView
          album={playerAlbum}
          isSaved={true}
          savedItem={playerAlbum}
          onClose={() => setPlayerAlbum(null)}
          onLibraryUpdate={handleLibraryUpdateFromPlayer}
        />
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditModal(null)}>
          <div className="modal slide-up">
            <div className="modal-header">
              <h2>Edit Album</h2>
              <button className="modal-close" onClick={() => setEditModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="add-modal-album-info">
                <img src={getHighResArt(editModal.artworkUrl)} alt={editModal.title} />
                <div className="add-modal-album-details">
                  <h4>{editModal.title}</h4>
                  <p>{editModal.artistName}</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rating</label>
                <div className="star-rating" style={{ fontSize: '1.5rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${editForm.userRating >= star ? 'filled' : ''}`}
                      onClick={() => setEditForm({
                        ...editForm,
                        userRating: editForm.userRating === star ? null : star,
                      })}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  id="edit-notes"
                  className="form-input"
                  placeholder="Your thoughts about this album..."
                  value={editForm.userNotes}
                  onChange={(e) => setEditForm({ ...editForm, userNotes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModal(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirm(null)}>
          <div className="modal slide-up">
            <div className="modal-header">
              <h2>Remove Album</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body confirm-dialog">
              <p>
                Are you sure you want to remove <strong>"{deleteConfirm.title}"</strong> by{' '}
                <strong>{deleteConfirm.artistName}</strong> from your library?
              </p>
              <div className="btn-group">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LibraryPage;
