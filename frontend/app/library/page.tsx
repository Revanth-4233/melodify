'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { libraryApi, LibraryAlbum } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';

function StarRating({ rating, onRate }: { rating: number | null; onRate: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${star <= (hover || rating || 0) ? 'filled' : ''}`}
          onClick={() => onRate(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function EditModal({ album, onClose, onSave }: {
  album: LibraryAlbum;
  onClose: () => void;
  onSave: (id: number, data: { userRating?: number; userNotes?: string }) => void;
}) {
  const [rating, setRating] = useState(album.userRating || 0);
  const [notes, setNotes] = useState(album.userNotes || '');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Album</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <img
            src={album.artworkUrl || ''}
            alt={album.title}
            style={{ width: 80, height: 80, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
          />
          <div>
            <div className="album-title" style={{ fontSize: '1.1rem', whiteSpace: 'normal' }}>{album.title}</div>
            <div className="album-artist">{album.artistName}</div>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Your Rating</label>
          <StarRating rating={rating} onRate={setRating} />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="edit-notes">Your Notes</label>
          <textarea
            id="edit-notes"
            className="input"
            placeholder="Write your thoughts about this album..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave(album.id, { userRating: rating || undefined, userNotes: notes || undefined })}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryContent() {
  const [albums, setAlbums] = useState<LibraryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [editAlbum, setEditAlbum] = useState<LibraryAlbum | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchLibrary = useCallback(async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const data = await libraryApi.getAll(user.token, page, 12);
      setAlbums(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      showToast('Failed to load library', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.token, page, showToast]);

  useEffect(() => {
    if (user?.token) {
      fetchLibrary();
    }
  }, [user?.token, fetchLibrary]);

  const handleUpdate = async (id: number, data: { userRating?: number; userNotes?: string }) => {
    if (!user?.token) return;
    try {
      const updated = await libraryApi.update(user.token, id, data);
      setAlbums(prev => prev.map(a => a.id === id ? updated : a));
      setEditAlbum(null);
      showToast('Album updated!', 'success');
    } catch {
      showToast('Failed to update album', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!user?.token) return;
    if (!confirm('Remove this album from your library?')) return;

    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await libraryApi.delete(user.token, id);
      setAlbums(prev => prev.filter(a => a.id !== id));
      setTotalElements(prev => prev - 1);
      showToast('Album removed from library', 'success');
    } catch {
      showToast('Failed to delete album', 'error');
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (authLoading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">My Library</h1>
          <p className="page-subtitle">
            {totalElements > 0 ? `${totalElements} album${totalElements !== 1 ? 's' : ''} in your collection` : 'Your personal album collection'}
          </p>
        </div>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading your library...</p>
          </div>
        )}

        {!loading && albums.length === 0 && (
          <div className="empty-state animate-fade-in">
            <div className="empty-icon">📚</div>
            <h3 className="empty-title">Your library is empty</h3>
            <p className="empty-text">Search for albums and add them to your collection to get started</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => router.push('/search')}
            >
              🔍 Search Albums
            </button>
          </div>
        )}

        {!loading && albums.length > 0 && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {albums.map(album => (
                <div key={album.id} className="library-card">
                  <img
                    src={album.artworkUrl || ''}
                    alt={album.title}
                    className="library-card-artwork"
                    loading="lazy"
                  />
                  <div className="library-card-content">
                    <div className="album-title" style={{ fontSize: '1.05rem', whiteSpace: 'normal' }}>
                      {album.title}
                    </div>
                    <div className="album-artist">{album.artistName}</div>
                    <div className="album-meta">
                      {album.genre && <span className="album-genre">{album.genre}</span>}
                      {album.collectionPrice > 0 && <span className="album-price">${album.collectionPrice}</span>}
                      {album.trackCount > 0 && <span className="album-tracks">{album.trackCount} tracks</span>}
                      {album.releaseDate && (
                        <span className="album-tracks">{new Date(album.releaseDate).getFullYear()}</span>
                      )}
                    </div>
                    {album.userRating && (
                      <div style={{ color: 'var(--accent-warning)', fontSize: '0.9rem' }}>
                        {'★'.repeat(album.userRating)}{'☆'.repeat(5 - album.userRating)}
                      </div>
                    )}
                    {album.userNotes && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        &ldquo;{album.userNotes}&rdquo;
                      </div>
                    )}
                    <div className="library-card-actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditAlbum(album)}>
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(album.id)}
                        disabled={deletingIds.has(album.id)}
                      >
                        {deletingIds.has(album.id) ? 'Removing...' : '🗑 Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  ← Previous
                </button>
                <span className="pagination-info">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {editAlbum && (
          <EditModal
            album={editAlbum}
            onClose={() => setEditAlbum(null)}
            onSave={handleUpdate}
          />
        )}
      </div>
    </>
  );
}

export default function LibraryPage() {
  return (
    <ToastProvider>
      <LibraryContent />
    </ToastProvider>
  );
}
