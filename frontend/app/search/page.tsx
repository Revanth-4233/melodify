'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { searchApi, libraryApi, Album } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';
import { usePlayer } from '@/components/Player';

function AlbumCard({ album, onSave, isSaving, isSaved }: { album: Album, onSave: (a: Album) => void, isSaving: boolean, isSaved: boolean }) {
  const id = album.trackId || album.collectionId;
  const title = album.trackName || album.collectionName;
  const price = album.trackPrice || album.collectionPrice;
  const { playSong, currentSong } = usePlayer();
  
  const isPlaying = currentSong?.trackId === id && !!id;

  return (
    <div className="album-card">
      <div style={{ position: 'relative' }}>
        <img
          src={album.artworkUrl100?.replace('100x100', '300x300') || ''}
          alt={title}
          className="album-artwork"
          loading="lazy"
        />
        {album.previewUrl && (
          <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
            <button className="album-play-btn" onClick={() => playSong(album)} title="Play Preview">
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>
        )}
      </div>
      <div className="album-info">
        <div className="album-title" title={title}>
          {title}
        </div>
        <div className="album-artist" title={album.artistName}>
          {album.artistName}
        </div>
        <div className="album-meta">
          {album.primaryGenreName && (
            <span className="album-genre">{album.primaryGenreName}</span>
          )}
          {price > 0 && (
            <span className="album-price">${price}</span>
          )}
        </div>
        <div className="album-meta" style={{ marginTop: '0.25rem' }}>
          {album.trackCount > 0 && (
            <span className="album-tracks">{album.trackCount} tracks</span>
          )}
          {album.releaseDate && (
            <span className="album-tracks">
              {new Date(album.releaseDate).getFullYear()}
            </span>
          )}
        </div>
      </div>
      <div className="album-actions">
        <button
          className={`btn btn-sm ${isSaved ? 'btn-success' : 'btn-primary'}`}
          onClick={() => onSave(album)}
          disabled={isSaving || isSaved}
          style={{ flex: 1 }}
        >
          {isSaved ? '✓ Saved' : isSaving ? 'Saving...' : '+ Add to Library'}
        </button>
      </div>
    </div>
  );
}

function SearchContent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [trendingAlbums, setTrendingAlbums] = useState<Album[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    async function loadTrending() {
      setTrendingLoading(true);
      try {
        // Search for a popular Telugu artist to guarantee Telugu songs
        const telugu = await searchApi.search('Sid Sriram Telugu', 'song', 12);
        
        const albums = (telugu.results || []).filter((r: Album) => r.wrapperType === 'track' || r.wrapperType === 'collection' || r.collectionName || r.trackName);
        
        setTrendingAlbums(albums);
      } catch (e) {
        console.error('Failed to load trending', e);
      } finally {
        setTrendingLoading(false);
      }
    }
    
    if (isAuthenticated) {
      loadTrending();
    }
  }, [isAuthenticated]);

  // Debounced search
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const data = await searchApi.search(searchQuery, 'song', 25);
        // Filter to show songs/albums
        const albums = (data.results || []).filter(
          (r: Album) => r.wrapperType === 'track' || r.wrapperType === 'collection' || r.collectionName || r.trackName
        );
        setResults(albums);
      } catch {
        showToast('Search failed. Please try again.', 'error');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [showToast]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  };

  const handleSave = async (album: Album) => {
    if (!user?.token) return;

    const id = album.trackId || album.collectionId;
    setSavingIds(prev => new Set(prev).add(id));
    try {
      await libraryApi.save(user.token, {
        appleCatalogId: id,
        title: album.trackName || album.collectionName,
        artistName: album.artistName,
        genre: album.primaryGenreName,
        releaseDate: album.releaseDate,
        trackCount: album.trackCount || 1,
        artworkUrl: album.artworkUrl100?.replace('100x100', '600x600') || album.artworkUrl100,
        collectionPrice: album.trackPrice || album.collectionPrice || 0,
      });
      setSavedIds(prev => new Set(prev).add(id));
      showToast('Saved to library!', 'success');
    } catch (err: any) {
      if (err.status === 409) {
        setSavedIds(prev => new Set(prev).add(id));
        showToast('Already in your library', 'info');
      } else {
        showToast('Failed to save. Please try again.', 'error');
      }
    } finally {
      const newSaving = new Set(savingIds);
      newSaving.delete(id);
      setSavingIds(newSaving);
    }
  };

  if (authLoading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <h1 className="page-title">Discover Music</h1>
          <p className="page-subtitle">Search the iTunes catalog and build your personal library</p>
        </div>

        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input
            id="search-input"
            type="text"
            className="search-input"
            placeholder="Search for albums, artists..."
            value={query}
            onChange={handleSearch}
            autoFocus
          />
        </div>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Searching iTunes catalog...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="empty-state animate-fade-in">
            <div className="empty-icon">🔎</div>
            <h3 className="empty-title">No albums found</h3>
            <p className="empty-text">Try a different search term or check your spelling</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="animate-fade-in">
            <p className="page-subtitle" style={{ marginBottom: '1rem' }}>
              Found {results.length} album{results.length !== 1 ? 's' : ''}
            </p>
            <div className="album-grid">
              {results.map((album) => {
                const id = album.trackId || album.collectionId;
                return (
                  <AlbumCard
                    key={`res-${id}-${Math.random()}`}
                    album={album}
                    onSave={handleSave}
                    isSaving={savingIds.has(id)}
                    isSaved={savedIds.has(id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {!loading && !searched && (
          <div className="animate-fade-in" style={{ marginTop: '1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 className="page-title" style={{ fontSize: '1.8rem' }}>🔥 Top Telugu Songs</h2>
              <p className="page-subtitle">Trending hits in Telugu</p>
            </div>
            
            {trendingLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="album-grid">
                {trendingAlbums.map((album) => {
                  const id = album.trackId || album.collectionId;
                  return (
                    <AlbumCard
                      key={`trend-${id}-${Math.random()}`}
                      album={album}
                      onSave={handleSave}
                      isSaving={savingIds.has(id)}
                      isSaved={savedIds.has(id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <ToastProvider>
      <SearchContent />
    </ToastProvider>
  );
}
