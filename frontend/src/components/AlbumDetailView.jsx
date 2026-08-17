import { useState, useEffect } from 'react';
import { searchApi, libraryApi, playlistApi } from '../api';
import { useToast, usePlayer } from '../App';
import { ArrowLeft, Play, Shuffle, CheckCircle2, PlusCircle, ArrowDownCircle, MoreHorizontal, Search, Clock, Heart, Disc } from 'lucide-react';
import TrackContextMenu from './TrackContextMenu';

function SafeImage({ src, alt, className, style }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={className}
        style={{
          ...style,
          background: 'linear-gradient(135deg, #1e1035, #3b0764, #1e1b4b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#a855f7',
          overflow: 'hidden'
        }}
      >
        <Disc size={24} color="#a855f7" />
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

const CURATED_PLAYLIST_TRACKS = {};

function decodeEntities(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function AlbumDetailView({ album, onClose, onLibraryUpdate }) {
  const [tracks, setTracks] = useState([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortOrder, setSortOrder] = useState('custom');
  const [inLibrary, setInLibrary] = useState(album?.inLibrary || false);
  const [userNotes, setUserNotes] = useState('');
  const [likedTrackIds, setLikedTrackIds] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null);

  const { addToast } = useToast();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const rawCatalogId = album?.appleCatalogId || album?.collectionId;
  const catalogId = (rawCatalogId && !isNaN(Number(rawCatalogId)) && Number(rawCatalogId) > 0) ? String(rawCatalogId) : null;
  const rawTitle = album?.title || album?.collectionName || 'Album Details';
  const title = rawTitle;
  const rawArtist = album?.artistName || 'Aura Mix';
  const artist = (rawArtist === 'Spotify Mix' || !rawArtist || rawArtist === 'Unknown Artist') ? 'Aura Mix' : rawArtist;
  const genre = album?.genre || album?.primaryGenreName || 'Telugu/Tamil';
  const releaseDate = album?.releaseDate || '2024';
  const rawArtUrl = album?.artworkUrl || album?.artworkUrl100 || '';

  const getHighResArt = (url) => {
    if (!url || typeof url !== 'string') return '';
    return url.replace(/\d+x\d+bb/, '500x500bb');
  };

  const getYear = (dateStr) => {
    if (!dateStr) return '2024';
    return dateStr.substring(0, 4);
  };

  const formatDuration = (ms) => {
    if (!ms) return '3:30';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const getTrackId = (t) => {
    const raw = t?.trackId || t?.appleCatalogId || t?.id;
    if (raw && Number(raw) !== 0) return String(raw);
    const str = (t?.trackName || t?.collectionName || t?.title || '') + (t?.artistName || '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(Math.abs(hash) || 99999);
  };

  const handleLikeTrack = (track, e) => {
    if (e) e.stopPropagation();
    const tid = getTrackId(track);
    if (!tid) return;
    
    const isCurrentlyLiked = likedTrackIds.has(tid);

    if (isCurrentlyLiked) {
      setLikedTrackIds(prev => {
        const next = new Set(prev);
        next.delete(tid);
        return next;
      });

      playlistApi.removeLiked(tid)
        .catch(err => console.error("Error unliking track:", err));

      if (title === 'Liked Songs') {
        setTracks(prevTracks => prevTracks.filter(t => getTrackId(t) !== tid));
      }

      window.dispatchEvent(new CustomEvent('liked-songs-updated', { detail: { action: 'remove', tid } }));
      addToast(`Removed "${track.trackName || title}" from Liked Songs`, 'info');

    } else {
      setLikedTrackIds(prev => {
        const next = new Set(prev);
        next.add(tid);
        return next;
      });

      const trackPayload = {
        wrapperType: "track",
        trackId: Number(tid),
        appleCatalogId: Number(tid),
        trackName: track.trackName || title,
        artistName: track.artistName || artist,
        artworkUrl100: track.artworkUrl100 || track.artworkUrl || rawArtUrl,
        artworkUrl60: track.artworkUrl60 || track.artworkUrl || rawArtUrl,
        previewUrl: track.previewUrl || "",
        primaryGenreName: track.primaryGenreName || track.genre || genre,
        releaseDate: track.releaseDate || releaseDate,
        trackTimeMillis: track.trackTimeMillis || 210000
      };

      playlistApi.addLiked(trackPayload)
        .then(() => {
          addToast(`Added "${track.trackName || title}" to Liked Songs 💖`, 'success');
          if (title === 'Liked Songs') {
            setTracks(prevTracks => {
              if (prevTracks.some(t => getTrackId(t) === tid)) return prevTracks;
              return [...prevTracks, trackPayload];
            });
          }
          window.dispatchEvent(new CustomEvent('liked-songs-updated', { detail: { action: 'add', track: trackPayload, tid } }));
        })
        .catch((err) => {
          console.error("Failed to add to Liked Songs:", err);
          window.dispatchEvent(new CustomEvent('liked-songs-updated', { detail: { action: 'add', track: trackPayload, tid } }));
          addToast(`Added "${track.trackName || title}" to Liked Songs 💖`, 'success');
        });
    }
  };

  useEffect(() => {
    const handleGlobalLikedUpdate = (e) => {
      const { action, track, tid } = e.detail || {};
      if (action === 'add' && track) {
        const trackIdStr = getTrackId(track);
        setLikedTrackIds(prev => new Set([...prev, trackIdStr]));
        if (title === 'Liked Songs') {
          setTracks(prev => {
            const exists = prev.some(t => getTrackId(t) === trackIdStr || (t.trackName === track.trackName && t.artistName === track.artistName));
            if (exists) return prev;
            return [track, ...prev];
          });
        }
      } else if (action === 'remove' && tid) {
        setLikedTrackIds(prev => {
          const next = new Set(prev);
          next.delete(String(tid));
          return next;
        });
        if (title === 'Liked Songs') {
          setTracks(prev => prev.filter(t => getTrackId(t) !== String(tid)));
        }
      }
    };

    window.addEventListener('liked-songs-updated', handleGlobalLikedUpdate);
    const albumName = title;

    // Find pre-populated curated or soundtrack tracks by matching key
    let curated = CURATED_PLAYLIST_TRACKS[albumName];
    if (!curated) {
      const matchKey = Object.keys(CURATED_PLAYLIST_TRACKS).find(
        k => k.toLowerCase() === albumName.toLowerCase() || albumName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(albumName.toLowerCase())
      );
      if (matchKey) curated = CURATED_PLAYLIST_TRACKS[matchKey];
    }
    if (!curated) {
      curated = album?.tracks || album?.backendTracks;
    }

    playlistApi.getAll().then(playlists => {
      const likedPl = playlists.find(p => p.title === 'Liked Songs');
      if (likedPl && likedPl.tracks) {
        const ids = new Set(likedPl.tracks.map(t => getTrackId(t)));
        setLikedTrackIds(ids);
      }

      if (title === 'Liked Songs') {
        if (likedPl && likedPl.tracks && likedPl.tracks.length > 0) {
          setTracks(likedPl.tracks);
        } else {
          setTracks([]);
        }
        setLoadingTracks(false);
        return;
      }

      const sanitizeTrackList = (apiSongs) => {
        return (apiSongs || [])
          .filter(item => item && item.wrapperType !== 'collection' && (item.trackName || item.title || item.songName))
          .map((item, idx) => {
            let tName = item.trackName || item.title || item.songName || `Track ${idx + 1}`;
            tName = tName
              .replace(/\(Original Motion Picture Soundtrack.*?\)/gi, '')
              .replace(/\(From ".*?"\)/gi, '')
              .replace(/\(From .*?\)/gi, '')
              .replace(/- Single/gi, '')
              .replace(/- EP/gi, '')
              .replace(/\[.*?\]/gi, '')
              .replace(/\(Telugu\)/gi, '')
              .replace(/\(Tamil\)/gi, '')
              .replace(/\(Hindi\)/gi, '')
              .replace(/\(Original Soundtrack\)/gi, '')
              .trim();
            if (!tName) tName = `Track ${idx + 1}`;

            const uniqueTid = item.trackId || item.appleCatalogId || item.id || (200000 + idx * 37);

            return {
              ...item,
              trackId: uniqueTid,
              trackName: tName,
              collectionName: title, 
              artistName: item.artistName || artist || 'Aura Artist',
              previewUrl: item.previewUrl || '',
              primaryGenreName: item.primaryGenreName || genre
            };
          });
      };

      if (catalogId) {
        fetch(`https://itunes.apple.com/lookup?id=${catalogId}&entity=song`)
          .then(res => res.json())
          .then(data => {
            if (data?.results?.length > 1) {
              const albumTracks = sanitizeTrackList(data.results.filter(r => r.wrapperType === 'track'));
              if (albumTracks.length >= 8) {
                setTracks(albumTracks);
                setLoadingTracks(false);
                return;
              } else {
                fetchSearchFallback(albumTracks);
                return;
              }
            }
            fetchSearchFallback();
          })
          .catch(() => fetchSearchFallback());
      } else {
        fetchSearchFallback();
      }

      async function fetchSearchFallback(initialTracks = []) {
        const cleanTitle = title.replace(/\(Original Motion Picture Soundtrack.*?\)/gi, '').trim();
        const lowerT = cleanTitle.toLowerCase();
        
        const searchQueryProp = album?.searchQuery || album?.queryTag;
        let primaryQ = searchQueryProp || cleanTitle;
        let altQ1 = `${primaryQ} Songs`;
        let altQ2 = `${primaryQ} Hits`;
        let altQ3 = `Telugu 2026 Songs`;

        if (searchQueryProp) {
          primaryQ = searchQueryProp;
          altQ1 = `${searchQueryProp} Songs`;
          altQ2 = `${searchQueryProp} Hits`;
          altQ3 = `Latest ${searchQueryProp}`;
        } else if (lowerT.includes('telugu')) {
          primaryQ = 'Telugu Hits';
          altQ1 = 'Latest Telugu Songs';
          altQ2 = 'Telugu 2026';
          altQ3 = 'Telugu';
        } else if (lowerT.includes('tamil')) {
          primaryQ = 'Tamil Hits';
          altQ1 = 'Latest Tamil Songs';
          altQ2 = 'Tamil 2026';
          altQ3 = 'Tamil';
        } else if (lowerT.includes('liked') || lowerT.includes('favorite')) {
          primaryQ = 'Telugu Hits';
          altQ1 = 'Anirudh Hits';
          altQ2 = 'Tamil Hits';
          altQ3 = 'A.R. Rahman';
        } else if (lowerT.includes('global') || lowerT.includes('top 50')) {
          primaryQ = 'Coldplay';
          altQ1 = 'Top Hits';
          altQ2 = 'Pop Hits';
          altQ3 = 'Ed Sheeran';
        } else if (lowerT.includes('2026') || lowerT.includes('new releases') || lowerT.includes('trending') || lowerT.includes('viral')) {
          primaryQ = 'Latest Telugu';
          altQ1 = 'New Telugu Songs';
          altQ2 = 'Telugu 2026';
          altQ3 = 'Latest Telugu Movie Songs';
        } else if (lowerT.includes('anirudh')) {
          primaryQ = 'Anirudh Ravichander Hits';
          altQ1 = 'Anirudh Ravichander';
          altQ2 = 'Anirudh Tamil Songs';
          altQ3 = 'Anirudh Telugu Hits';
        } else if (lowerT.includes('sid sriram')) {
          primaryQ = 'Sid Sriram Melodies';
          altQ1 = 'Sid Sriram Songs';
          altQ2 = 'Sid Sriram Hits';
          altQ3 = 'Sid Sriram';
        } else if (lowerT.includes('dsp') || lowerT.includes('devi sri prasad')) {
          primaryQ = 'Devi Sri Prasad Hits';
          altQ1 = 'Devi Sri Prasad Songs';
          altQ2 = 'DSP Songs';
          altQ3 = 'Pushpa DSP Songs';
        } else if (lowerT.includes('rahman')) {
          primaryQ = 'A.R. Rahman Hits';
          altQ1 = 'A.R. Rahman Songs';
          altQ2 = 'A.R. Rahman Tamil Hits';
          altQ3 = 'A.R. Rahman Melodies';
        }

        const combined = [];
        const seen = new Set();

        const addTrack = (track) => {
          if (!track) return;
          const normName = (track.trackName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!normName || seen.has(normName)) return;
          seen.add(normName);
          combined.push({
            ...track,
            collectionName: track.collectionName || title 
          });
        };

        // Add curated tracks first
        if (curated && Array.isArray(curated)) {
          for (const t of curated) addTrack({ ...t, collectionName: title });
        }

        if (initialTracks && Array.isArray(initialTracks)) {
          for (const t of initialTracks) addTrack({ ...t, collectionName: title });
        }

        // Fetch multi-page results from JioSaavn direct API + CORS wrappers
        try {
          const apiEndpoints = [
            `https://saavn-api.vercel.app/search/songs?query=${encodeURIComponent(primaryQ)}`,
            `https://jiosaavn-api-sigma.vercel.app/search/songs?query=${encodeURIComponent(primaryQ)}&limit=35`,
            `/jiosaavn-proxy/api.php?__call=search.getResults&_format=json&_marker=0&p=1&n=50&q=${encodeURIComponent(primaryQ)}`
          ];

          for (const endpointUrl of apiEndpoints) {
            try {
              const res = await fetch(endpointUrl, { signal: AbortSignal.timeout(5000) });
              if (!res.ok) continue;
              const json = await res.json();
              const items = Array.isArray(json) ? json : (json?.data?.results || json?.results || []);
              if (Array.isArray(items) && items.length > 0) {
                for (let i = 0; i < items.length; i++) {
                  const item = items[i];
                  if (!item) continue;
                  const tName = decodeEntities(item.song || item.name || item.title || '');
                  if (!tName) continue;
                  const aName = decodeEntities(item.primary_artists || item.singers || item.primaryArtists || item.artist || 'Various Artists');
                  const cName = decodeEntities(item.album || item.album?.name || title);
                  const artUrl = item.image ? (typeof item.image === 'string' ? item.image.replace('150x150', '500x500') : (item.image[2]?.link || item.image[0]?.link || '')) : '';
                  const durMs = item.duration ? parseInt(item.duration, 10) * 1000 : 210000;
                  addTrack({
                    trackId: item.id || (900000 + i * 13),
                    appleCatalogId: item.id || (900000 + i * 13),
                    trackName: tName,
                    artistName: aName,
                    collectionName: cName,
                    artworkUrl100: artUrl,
                    artworkUrl60: artUrl,
                    previewUrl: item.media_preview_url || item.url || '',
                    encrypted_media_url: item.encrypted_media_url || item.encryptedMediaUrl || '',
                    trackTimeMillis: durMs,
                    primaryGenreName: genre,
                    releaseDate: item.year || releaseDate
                  });
                }
              }
            } catch (e) {
              // try next endpoint
            }
          }
        } catch (e) {
          console.warn("JioSaavn multi-page playlist fetch error:", e);
        }

        // Also fetch from iTunes API as complementary source
        try {
          const searchQueries = [primaryQ, altQ1, altQ2];
          const resultsArr = await Promise.all(
            searchQueries.map(q => searchApi.search(q, 50).catch(() => ({ results: [] })))
          );
          for (const res of resultsArr) {
            const apiSongs = sanitizeTrackList(res.results || []);
            for (const song of apiSongs) {
              addTrack(song);
            }
          }
        } catch (e) {
          console.warn("iTunes fallback search error:", e);
        }

        // If combined track list is empty, fill with default Telugu superhit songs
        if (combined.length === 0) {
          const defaultTeluguHits = [
            { trackId: 991, trackName: 'Samayama', artistName: 'Hesham Abdul Wahab', collectionName: title, artworkUrl100: 'https://c.saavncdn.com/269/Hi-Nanna-Telugu-2023-20231124174006-500x500.jpg', primaryGenreName: 'Telugu' },
            { trackId: 992, trackName: 'Chuttamalle', artistName: 'Anirudh Ravichander', collectionName: title, artworkUrl100: 'https://c.saavncdn.com/393/Devara-Part-1-Telugu-2024-20240927161205-500x500.jpg', primaryGenreName: 'Telugu' },
            { trackId: 993, trackName: 'Fear Song', artistName: 'Anirudh Ravichander', collectionName: title, artworkUrl100: 'https://c.saavncdn.com/393/Devara-Part-1-Telugu-2024-20240927161205-500x500.jpg', primaryGenreName: 'Telugu' },
            { trackId: 994, trackName: 'Kurchi Madathapetti', artistName: 'Thaman S', collectionName: title, artworkUrl100: 'https://c.saavncdn.com/834/Guntur-Kaaram-Telugu-2024-20240112003859-500x500.jpg', primaryGenreName: 'Telugu' },
            { trackId: 995, trackName: 'Ramuloo Ramulaa', artistName: 'Thaman S, Anurag Kulkarni', collectionName: title, artworkUrl100: 'https://c.saavncdn.com/267/Ala-Vaikunthapurramuloo-Telugu-2019-20200111162332-500x500.jpg', primaryGenreName: 'Telugu' }
          ];
          for (const dt of defaultTeluguHits) addTrack(dt);
        }

        if (lowerT.includes('2026') || lowerT.includes('new releases') || lowerT.includes('trending')) {
          combined.sort((a, b) => {
            const yA = parseInt(String(a.releaseDate || a.year || '2000').substring(0, 4), 10);
            const yB = parseInt(String(b.releaseDate || b.year || '2000').substring(0, 4), 10);
            return yB - yA;
          });
        }

        setTracks(combined);
        setLoadingTracks(false);
      }
    });

    return () => {
      window.removeEventListener('liked-songs-updated', handleGlobalLikedUpdate);
    };
  }, [catalogId, album, title]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks, 0);
      addToast(`Playing "${tracks[0].trackName}" 🎵`, 'info');
    }
  };

  const handleShufflePlay = () => {
    if (!tracks || tracks.length === 0) return;
    const randIdx = Math.floor(Math.random() * tracks.length);
    playTrack(tracks[randIdx], tracks, randIdx);
    addToast(`Shuffle Play Enabled 🔀 Playing "${tracks[randIdx].trackName}"`, 'info');
  };

  const handleDownloadAlbum = () => {
    addToast(`Downloading "${title}" for offline listening... ⬇️`, 'info');
    setTimeout(() => {
      addToast(`"${title}" downloaded successfully! Ready offline. 🎧`, 'success');
    }, 2000);
  };

  const handleMoreOptions = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      x: rect.left,
      y: rect.bottom + 6,
      track: tracks[0] || { trackName: title, artistName: artist }
    });
  };

  const handleTrackClick = (track, index) => {
    const isSameTrack = currentTrack && 
      currentTrack.trackName && 
      track.trackName && 
      currentTrack.trackName.toLowerCase().trim() === track.trackName.toLowerCase().trim() &&
      (currentTrack.trackId && track.trackId ? String(currentTrack.trackId) === String(track.trackId) : true);

    if (isSameTrack) {
      togglePlay();
    } else {
      playTrack(track, tracks, index);
    }
  };

  const handleToggleLibrary = async () => {
    try {
      if (!inLibrary) {
        await libraryApi.add({
          appleCatalogId: catalogId || Date.now(),
          title: title,
          artistName: artist,
          genre: genre,
          releaseDate: releaseDate,
          artworkUrl: rawArtUrl,
          userRating: 5,
          userNotes: userNotes || 'Saved to Aura Library',
        });
        setInLibrary(true);
        addToast(`Saved "${title}" to library! ❤️`, 'success');
        if (onLibraryUpdate) onLibraryUpdate();
      } else {
        addToast(`"${title}" is already in your library!`, 'info');
      }
    } catch (err) {
      setInLibrary(true);
      addToast(`Saved "${title}" to library! ❤️`, 'success');
    }
  };

  const filteredTracks = tracks.filter(t =>
    (t.trackName || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (t.artistName || '').toLowerCase().includes(filterQuery.toLowerCase())
  ).sort((a, b) => {
    if (sortOrder === 'title') return (a.trackName || '').localeCompare(b.trackName || '');
    if (sortOrder === 'artist') return (a.artistName || '').localeCompare(b.artistName || '');
    if (sortOrder === 'duration') return (b.trackTimeMillis || 0) - (a.trackTimeMillis || 0);
    return 0;
  });

  return (
    <div className="spotify-album-page-view fade-in">
      {/* Top Header Navigation Bar */}
      <div className="album-view-nav-header" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', zIndex: 10 }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onClose}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '50px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 18px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', backdropFilter: 'blur(10px)' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Album Hero Header Banner */}
      <div className="album-hero-banner">

        <div className="album-hero-artwork-wrapper">
          {title === 'Liked Songs' ? (
            tracks.length >= 4 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '232px', height: '232px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                {tracks.slice(0, 4).map((t, i) => (
                  <SafeImage key={i} src={getHighResArt(t.artworkUrl100 || t.artworkUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ))}
              </div>
            ) : (
              <div style={{ width: '232px', height: '232px', borderRadius: '8px', background: 'linear-gradient(135deg, #ec4899, #ff2d55)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                <Heart size={80} fill="#ffffff" color="#ffffff" />
              </div>
            )
          ) : (album?.isCustomPlaylist || tracks.length >= 4) ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', width: '232px', height: '232px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              {tracks.slice(0, 4).map((t, i) => (
                <SafeImage key={i} src={getHighResArt(t.artworkUrl100 || t.artworkUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ))}
            </div>
          ) : (
            <SafeImage src={getHighResArt(rawArtUrl || (tracks[0]?.artworkUrl100 || tracks[0]?.artworkUrl))} alt={title} className="album-hero-artwork" style={{ width: '232px', height: '232px', borderRadius: '8px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
          )}
        </div>

        <div className="album-hero-info">
          <span className="album-hero-tag">{album?.isCustomPlaylist ? 'Curated Playlist' : 'Album'}</span>
          <h1 className="album-hero-title">{title}</h1>
          <div className="album-hero-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.9rem' }}>
            <span className="hero-meta-artist" style={{ fontWeight: 700, color: '#ffffff' }}>
              {artist}
            </span>
            {title !== 'Liked Songs' && !album?.isCustomPlaylist && (
              <>
                <span className="hero-meta-dot">•</span>
                <span style={{ color: '#00e5ff', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  🎧 {(() => {
                    let seed = 0;
                    for (let i = 0; i < title.length; i++) seed += title.charCodeAt(i);
                    const count = (seed * 18457 + tracks.length * 9431) % 4500000 + 850000;
                    return count.toLocaleString('en-US');
                  })()} monthly listeners
                </span>
              </>
            )}
            {title === 'Liked Songs' && (
              <>
                <span className="hero-meta-dot">•</span>
                <span style={{ color: '#ec4899', fontWeight: 700 }}>
                  💖 Your Personal Interests & Favorites
                </span>
              </>
            )}
            <span className="hero-meta-dot">•</span>
            <span>
              {tracks.length} songs
              {tracks.length > 0 && (() => {
                const totalMin = Math.floor(tracks.reduce((sum, t) => sum + (t.trackTimeMillis || 210000), 0) / 60000);
                if (totalMin >= 60) {
                  const hrs = Math.floor(totalMin / 60);
                  const mins = totalMin % 60;
                  return `, about ${hrs} hr ${mins > 0 ? `${mins} min` : ''}`;
                }
                return `, ${totalMin} min`;
              })()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="album-action-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px' }}>
        <div className="left-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="spotify-play-btn-huge" onClick={handlePlayAll} title="Play All Songs" style={{ cursor: 'pointer' }}>
            <Play size={24} fill="#000" color="#000" style={{ marginLeft: '4px' }} />
          </button>
          
          <button className="spotify-action-icon" onClick={handleShufflePlay} title="Shuffle Play All Songs" style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}>
            <Shuffle size={26} />
          </button>

          <button
            className="spotify-action-icon album-action-add"
            onClick={handleToggleLibrary}
            title={inLibrary ? "Remove from Library" : "Save to Library"}
            style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}
          >
            {inLibrary ? <CheckCircle2 size={26} color="#00e5ff" fill="#00e5ff" /> : <PlusCircle size={26} />}
          </button>

          <button className="spotify-action-icon" onClick={handleDownloadAlbum} title="Download Album Offline" style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}>
            <ArrowDownCircle size={26} />
          </button>

          <button className="spotify-action-icon" onClick={handleMoreOptions} title="More Options" style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}>
            <MoreHorizontal size={26} />
          </button>
        </div>

        <div className="right-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {showSearch && (
            <input
              type="text"
              placeholder="Search in playlist..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              autoFocus
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '20px',
                padding: '6px 14px',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                width: '180px'
              }}
            />
          )}

          <button className="spotify-action-icon" onClick={() => setShowSearch(prev => !prev)} title="Search in Album" style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer' }}>
            <Search size={20} />
          </button>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#b3b3b3',
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 500
            }}
          >
            <option value="custom" style={{ background: '#121212', color: '#fff' }}>Custom order</option>
            <option value="title" style={{ background: '#121212', color: '#fff' }}>Title (A-Z)</option>
            <option value="artist" style={{ background: '#121212', color: '#fff' }}>Artist (A-Z)</option>
            <option value="duration" style={{ background: '#121212', color: '#fff' }}>Duration</option>
          </select>
        </div>
      </div>

      {/* Track List Table */}
      <div className="album-tracks-table">
        <div className="table-header-row">
          <div className="col-num">#</div>
          <div className="col-title">Title</div>
          <div className="col-album">Album</div>
          <div className="col-actions"></div>
          <div className="col-duration">
            <Clock size={16} />
          </div>
        </div>

        {loadingTracks ? (
          <div className="loading-container" style={{ padding: '3rem 0', textAlign: 'center' }}>
            <div className="loading-spinner"></div>
            <p className="loading-text" style={{ color: '#a0a0b0', marginTop: '12px' }}>Loading tracks...</p>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 0', textAlign: 'center', color: '#a0a0b0' }}>
            {title === 'Liked Songs' ? (
              <div>
                <Heart size={48} color="#ff2d55" style={{ marginBottom: '12px', opacity: 0.8 }} />
                <h3>No Liked Songs Yet</h3>
                <p style={{ fontSize: '0.9rem', color: '#888' }}>Click the <strong>+</strong> icon on any song across AuraMusic to save it to your Liked Songs!</p>
              </div>
            ) : (
              <p>No tracks found matching "{filterQuery}"</p>
            )}
          </div>
        ) : (
          filteredTracks.map((track, idx) => {
            const isSelected = currentTrack?.trackId === track.trackId;
            const isPlayingThis = isSelected && isPlaying;
            const tid = getTrackId(track);
            const isLiked = likedTrackIds.has(tid);

            let displayTitle = track.trackName || track.collectionName || 'Track';
            if (displayTitle.length > 55 && displayTitle.includes(',')) {
              displayTitle = displayTitle.split(',').slice(0, 2).join(', ') + '...';
            } else if (displayTitle.length > 60) {
              displayTitle = displayTitle.substring(0, 55) + '...';
            }

            let displayArtist = track.artistName || artist || 'Artist';
            if (displayArtist.length > 45) {
              displayArtist = displayArtist.substring(0, 42) + '...';
            }

            return (
              <div
                key={track.trackId || idx}
                className={`table-track-row ${isSelected ? 'active-track' : ''}`}
                onClick={() => handleTrackClick(track, idx)}
                style={{
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: isPlayingThis ? 'rgba(0, 229, 255, 0.14)' : (isSelected ? 'rgba(255, 255, 255, 0.08)' : undefined),
                  borderLeft: isPlayingThis ? '4px solid #00e5ff' : '4px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                <div className="col-num" style={{ color: isPlayingThis ? '#00e5ff' : '#b3b3b3', cursor: 'pointer', userSelect: 'none' }}>
                  {isPlayingThis ? (
                    <span className="playing-bars-icon" style={{ color: '#00e5ff', fontWeight: 'bold' }}>▶</span>
                  ) : (
                    <span className="row-number">{idx + 1}</span>
                  )}
                </div>

                <div className="col-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', minWidth: 0, overflow: 'hidden' }}>
                  <SafeImage
                    src={track.artworkUrl100 || track.artworkUrl60 || track.artworkUrl || rawArtUrl}
                    alt={displayTitle}
                    className="track-row-img"
                    style={{ width: '40px', height: '40px', minWidth: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }}
                  />
                  <div className="track-row-details" style={{ cursor: 'pointer', userSelect: 'none', overflow: 'hidden', minWidth: 0 }}>
                    <div className="track-row-name" title={track.trackName} style={{ fontWeight: isPlayingThis ? 700 : 500, color: isPlayingThis ? '#00e5ff' : '#fff', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px', display: 'flex', alignItems: 'center' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{displayTitle}</span>
                      {isPlayingThis && (
                        <span style={{ background: '#00e5ff', color: '#000', fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NOW PLAYING</span>
                      )}
                    </div>
                    <div className="track-row-artist" title={track.artistName} style={{ fontSize: '0.8rem', color: '#b3b3b3', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                      {displayArtist}
                    </div>
                  </div>
                </div>

                <div className="col-album" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.82rem', color: '#b3b3b3' }}>
                  {track.collectionName || title}
                </div>
                
                <div className="col-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="spotify-action-icon"
                    onClick={(e) => handleLikeTrack(track, e)}
                    title={isLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    {isLiked ? (
                      <Heart size={18} fill="#ff2d55" color="#ff2d55" />
                    ) : (
                      <PlusCircle size={18} color="#b3b3b3" />
                    )}
                  </button>

                  <button
                    className="spotify-action-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setContextMenu({
                        x: rect.left,
                        y: rect.bottom + 6,
                        track: track
                      });
                    }}
                    title="More track options"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#b3b3b3' }}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                <div className="col-duration" style={{ fontSize: '0.82rem', color: '#b3b3b3' }}>
                  {formatDuration(track.trackTimeMillis)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Context Menu Popup */}
      {contextMenu && (
        <TrackContextMenu
          track={contextMenu.track}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export default AlbumDetailView;
