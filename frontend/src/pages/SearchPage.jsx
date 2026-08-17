import { useState, useEffect, useCallback, useRef } from 'react';
import { searchApi, libraryApi, playlistApi } from '../api';
import { useAuth, useToast, usePlayer } from '../App';
import { Search, Music, Play, Flame, Heart, Sparkles, Zap, Radio, Plus, Check, Home, FolderHeart, Disc } from 'lucide-react';
import AlbumDetailView from '../components/AlbumDetailView';

// Fallback chips if not logged in or no preferences
const DEFAULT_VIBE_CHIPS = [
  { label: '🔥 2026 New Releases', query: '2026_special' },
  { label: '⚡ Telugu Superhits', query: 'Telugu' },
  { label: '💥 Tamil Explosive Hits', query: 'Tamil Hits' },
  { label: '🎶 Sid Sriram Melodies', query: 'Sid Sriram' },
  { label: '🎸 Anirudh Beats', query: 'Anirudh Ravichander' },
  { label: '✨ A.R. Rahman Magic', query: 'A.R. Rahman' },
  { label: '🌟 DSP Energy Hits', query: 'Devi Sri Prasad' },
];

const DEFAULT_CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: '2026', label: '🔥 2026 New Releases', query: '2026_special' },
  { id: 'telugu', label: 'Telugu Hits', query: 'Telugu' },
  { id: 'tamil', label: 'Tamil Hits', query: 'Tamil Hits' },
  { id: 'regional', label: 'Sid Sriram & Melodies', query: 'Sid Sriram Melodies' },
];

// Dynamic Auto-Rotating Hourly Trending Spotlight Pool
const SPOTLIGHT_TRENDING_POOL = [
  { collectionId: 1004, collectionName: 'Pushpa 2 The Rule', artistName: 'Devi Sri Prasad', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/59/19/65/591965d4-84b4-d62d-345f-88bd29ce0843/cover.jpg/300x300bb.jpg', primaryGenreName: 'Telugu Cinema' },
  { collectionId: 1003, collectionName: 'Devara Part 1', artistName: 'Anirudh Ravichander', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/86/7c/53/867c53cc-4efe-faef-a20e-8d9c896053db/8903431011411_cover.jpg/300x300bb.jpg', primaryGenreName: 'Telugu Cinema' },
  { collectionId: 1002, collectionName: 'Guntur Kaaram', artistName: 'Thaman S', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ff/e9/12/ffe9126b-d040-f90c-2df7-6baf1d00d1e6/cover.jpg/300x300bb.jpg', primaryGenreName: 'Telugu Cinema' },
  { collectionId: 1005, collectionName: 'Game Changer', artistName: 'Thaman S', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/64/4c/1d/644c1db5-68f8-0640-21e2-dd440f7290e7/8903431963253_cover.jpg/300x300bb.jpg', primaryGenreName: 'Telugu Cinema' },
  { collectionId: 1001, collectionName: 'Hi Nanna', artistName: 'Hesham Abdul Wahab', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/4d/7c/4a/4d7c4a33-0c3b-b0e5-1e5a-8182d9a25811/cover.jpg/300x300bb.jpg', primaryGenreName: 'Telugu Cinema' },
  { collectionId: 2003, collectionName: 'GOAT (Greatest Of All Time)', artistName: 'Yuvan Shankar Raja', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/68/f1/52/68f1523b-3c40-f2cc-7d4a-376642897adb/cover.jpg/300x300bb.jpg', primaryGenreName: 'Tamil Cinema' }
];

const getHourlySpotlight = () => {
  const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const idx = currentHour % SPOTLIGHT_TRENDING_POOL.length;
  return SPOTLIGHT_TRENDING_POOL[idx];
};

const DEFAULT_SPOTLIGHT = getHourlySpotlight();

const DEFAULT_TELUGU = [
  { collectionId: 1002, collectionName: 'Guntur Kaaram', artistName: 'Thaman S', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/44/2c/3a/442c3a50-60b6-ee8b-f2ea-626d03d36bbf/886449071484.jpg/300x300bb.jpg', primaryGenreName: 'Telugu', releaseDate: '2024-01-12' },
  { collectionId: 1003, collectionName: 'Devara Part 1', artistName: 'Anirudh Ravichander', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/9d/28/919d28e7-c6ee-d0b8-c30c-2a5433ce8538/886449120786.jpg/300x300bb.jpg', primaryGenreName: 'Telugu', releaseDate: '2024-09-27' },
  { collectionId: 1004, collectionName: 'Pushpa 2 The Rule', artistName: 'Devi Sri Prasad', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7e/bb/12/7ebb12e6-76dd-d922-263a-bbce5d8c3fb9/886449231840.jpg/300x300bb.jpg', primaryGenreName: 'Telugu', releaseDate: '2024-12-05' },
  { collectionId: 1005, collectionName: 'Kalki 2898 AD', artistName: 'Santhosh Narayanan', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/21/5b/c4/215bc4c8-3e4b-74bf-d3eb-ee9bf896e001/886448834479.jpg/300x300bb.jpg', primaryGenreName: 'Telugu', releaseDate: '2024-06-27' },
  { collectionId: 1006, collectionName: 'Sita Ramam', artistName: 'Vishal Chandrashekhar', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/44/2c/3a/442c3a50-60b6-ee8b-f2ea-626d03d36bbf/886449071484.jpg/300x300bb.jpg', primaryGenreName: 'Telugu', releaseDate: '2022-08-05' },
  { collectionId: 1007, collectionName: 'RRR (Soundtrack)', artistName: 'M. M. Keeravani', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/9d/28/919d28e7-c6ee-d0b8-c30c-2a5433ce8538/886449120786.jpg/300x300bb.jpg', primaryGenreName: 'Telugu', releaseDate: '2022-03-25' }
];

const DEFAULT_TAMIL = [
  { collectionId: 2001, collectionName: 'Leo', artistName: 'Anirudh Ravichander', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/9d/28/919d28e7-c6ee-d0b8-c30c-2a5433ce8538/886449120786.jpg/300x300bb.jpg', primaryGenreName: 'Tamil', releaseDate: '2023-10-19' },
  { collectionId: 2002, collectionName: 'Jailer', artistName: 'Anirudh Ravichander', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7e/bb/12/7ebb12e6-76dd-d922-263a-bbce5d8c3fb9/886449231840.jpg/300x300bb.jpg', primaryGenreName: 'Tamil', releaseDate: '2023-08-10' },
  { collectionId: 2003, collectionName: 'GOAT (Greatest Of All Time)', artistName: 'Yuvan Shankar Raja', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/44/2c/3a/442c3a50-60b6-ee8b-f2ea-626d03d36bbf/886449071484.jpg/300x300bb.jpg', primaryGenreName: 'Tamil', releaseDate: '2024-09-05' },
  { collectionId: 2004, collectionName: 'Vikram', artistName: 'Anirudh Ravichander', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/21/5b/c4/215bc4c8-3e4b-74bf-d3eb-ee9bf896e001/886448834479.jpg/300x300bb.jpg', primaryGenreName: 'Tamil', releaseDate: '2022-06-03' },
  { collectionId: 2005, collectionName: 'Ponniyin Selvan Part 1', artistName: 'A.R. Rahman', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/9d/28/919d28e7-c6ee-d0b8-c30c-2a5433ce8538/886449120786.jpg/300x300bb.jpg', primaryGenreName: 'Tamil', releaseDate: '2022-09-30' }
];

const DEFAULT_ANIRUDH = [
  { collectionId: 3001, collectionName: 'Master', artistName: 'Anirudh Ravichander', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7e/bb/12/7ebb12e6-76dd-d922-263a-bbce5d8c3fb9/886449231840.jpg/300x300bb.jpg', primaryGenreName: 'Tamil', releaseDate: '2021-01-13' },
  { collectionId: 3002, collectionName: 'Jawan', artistName: 'Anirudh Ravichander', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/44/2c/3a/442c3a50-60b6-ee8b-f2ea-626d03d36bbf/886449071484.jpg/300x300bb.jpg', primaryGenreName: 'Hindi', releaseDate: '2023-09-07' },
  { collectionId: 3003, collectionName: 'Beast', artistName: 'Anirudh Ravichander', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/9d/28/919d28e7-c6ee-d0b8-c30c-2a5433ce8538/886449120786.jpg/300x300bb.jpg', primaryGenreName: 'Tamil', releaseDate: '2022-04-13' },
  { collectionId: 3004, collectionName: 'Doctor', artistName: 'Anirudh Ravichander', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/21/5b/c4/215bc4c8-3e4b-74bf-d3eb-ee9bf896e001/886448834479.jpg/300x300bb.jpg', primaryGenreName: 'Tamil', releaseDate: '2021-10-09' }
];

function SafeImage({ src, alt, className, style, fallbackIcon }) {
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {fallbackIcon || (
          <img 
            src="/auramusic_logo.png" 
            alt="AuraMusic" 
            style={{ width: '50%', height: '50%', objectFit: 'contain', opacity: 0.9, filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.6))' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
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

const INSTANT_TELUGU_TRACKS = [
  { trackId: 101, trackName: 'Neno Butterfly', artistName: 'G.V. Prakash Kumar, Sublahshini', collectionName: 'Vishwanath & Sons', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/9d/28/919d28e7-c6ee-d0b8-c30c-2a5433ce8538/886449120786.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 102, trackName: 'Samayama', artistName: 'Hesham Abdul Wahab, Anurag Kulkarni', collectionName: 'Hi Nanna', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music123/v4/4d/7c/4a/4d7c4a33-0c3b-b0e5-1e5a-8182d9a25811/cover.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 103, trackName: 'Chuttamalle', artistName: 'Anirudh Ravichander, Shilpa Rao', collectionName: 'Devara Part 1', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/86/7c/53/867c53cc-4efe-faef-a20e-8d9c896053db/8903431011411_cover.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 104, trackName: 'Fear Song', artistName: 'Anirudh Ravichander', collectionName: 'Devara Part 1', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/86/7c/53/867c53cc-4efe-faef-a20e-8d9c896053db/8903431011411_cover.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 105, trackName: 'Kurchi Madathapetti', artistName: 'Thaman S, Sri Krishna', collectionName: 'Guntur Kaaram', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ff/e9/12/ffe9126b-d040-f90c-2df7-6baf1d00d1e6/cover.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 106, trackName: 'Pushpa Pushpa', artistName: 'Devi Sri Prasad, Nakash Aziz', collectionName: 'Pushpa 2 The Rule', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7e/bb/12/7ebb12e6-76dd-d922-263a-bbce5d8c3fb9/886449231840.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 107, trackName: 'Sooseki', artistName: 'Devi Sri Prasad, Shreya Ghoshal', collectionName: 'Pushpa 2 The Rule', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7e/bb/12/7ebb12e6-76dd-d922-263a-bbce5d8c3fb9/886449231840.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 108, trackName: 'Ramuloo Ramulaa', artistName: 'Thaman S, Anurag Kulkarni', collectionName: 'Ala Vaikunthapurramuloo', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/44/2c/3a/442c3a50-60b6-ee8b-f2ea-626d03d36bbf/886449071484.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 109, trackName: 'Naatu Naatu', artistName: 'M.M. Keeravani, Rahul Sipligunj', collectionName: 'RRR', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/9d/28/919d28e7-c6ee-d0b8-c30c-2a5433ce8538/886449120786.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 110, trackName: 'Oo Antava Mawa', artistName: 'Devi Sri Prasad, Indravathi Chauhan', collectionName: 'Pushpa The Rise', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7e/bb/12/7ebb12e6-76dd-d922-263a-bbce5d8c3fb9/886449231840.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 111, trackName: 'Srivalli', artistName: 'Devi Sri Prasad, Sid Sriram', collectionName: 'Pushpa The Rise', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/7e/bb/12/7ebb12e6-76dd-d922-263a-bbce5d8c3fb9/886449231840.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 112, trackName: 'Inkem Inkem Inkem Kaavale', artistName: 'Gopi Sundar, Sid Sriram', collectionName: 'Geetha Govindam', artworkUrl100: 'https://c.saavncdn.com/269/Hi-Nanna-Telugu-2023-20231124174006-500x500.jpg', primaryGenreName: 'Telugu' },
  { trackId: 113, trackName: 'Butta Bomma', artistName: 'Thaman S, Armaan Malik', collectionName: 'Ala Vaikunthapurramuloo', artworkUrl100: 'https://c.saavncdn.com/267/Ala-Vaikunthapurramuloo-Telugu-2019-20200111162332-500x500.jpg', primaryGenreName: 'Telugu' },
  { trackId: 114, trackName: 'Nee Kannu Neeli Samudram', artistName: 'Devi Sri Prasad, Javed Ali', collectionName: 'Uppena', artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ff/e9/12/ffe9126b-d040-f90c-2df7-6baf1d00d1e6/cover.jpg/500x500bb.jpg', primaryGenreName: 'Telugu' },
  { trackId: 115, trackName: 'Odiyamma', artistName: 'Hesham Abdul Wahab, Vishal Mishra', collectionName: 'Hi Nanna', artworkUrl100: 'https://c.saavncdn.com/269/Hi-Nanna-Telugu-2023-20231124174006-500x500.jpg', primaryGenreName: 'Telugu' }
];

const DEFAULT_PLAYLISTS = [
  { id: 'liked', title: 'Liked Songs', queryTag: 'Telugu Hits', gradient: 'linear-gradient(135deg, #ec4899, #ff2d55)', icon: 'heart', tracks: INSTANT_TELUGU_TRACKS },
  { id: 'telugu-hits', title: 'Telugu Superhits', queryTag: 'Telugu Hits', gradient: 'linear-gradient(135deg, #f97316, #eab308)', icon: 'flame', tracks: INSTANT_TELUGU_TRACKS },
  { id: 'tamil-hits', title: 'Tamil Explosive Hits', queryTag: 'Tamil Hits', gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)', icon: 'zap', tracks: INSTANT_TELUGU_TRACKS },
  { id: 'anirudh-beats', title: 'Anirudh Beats', queryTag: 'Anirudh Ravichander', gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)', icon: 'radio', tracks: INSTANT_TELUGU_TRACKS },
  { id: 'ar-rahman', title: 'A.R. Rahman Magic', queryTag: 'A.R. Rahman', gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)', icon: 'sparkles', tracks: INSTANT_TELUGU_TRACKS },
  { id: 'sid-sriram', title: 'Sid Sriram Melodies', queryTag: 'Sid Sriram', gradient: 'linear-gradient(135deg, #10b981, #059669)', icon: 'music', tracks: INSTANT_TELUGU_TRACKS },
  { id: 'dsp-hits', title: 'DSP Energy Hits', queryTag: 'Devi Sri Prasad', gradient: 'linear-gradient(135deg, #f43f5e, #fb923c)', icon: 'flame', tracks: INSTANT_TELUGU_TRACKS },
  { id: 'global-top', title: 'Global Top 50', queryTag: 'Coldplay', gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', icon: 'disc', tracks: INSTANT_TELUGU_TRACKS }
];

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [spotlightAlbum, setSpotlightAlbum] = useState(DEFAULT_SPOTLIGHT);
  const [teluguFresh, setTeluguFresh] = useState(DEFAULT_TELUGU);
  const [tamilHits, setTamilHits] = useState(DEFAULT_TAMIL);
  const [anirudhHits, setAnirudhHits] = useState(DEFAULT_ANIRUDH);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [searched, setSearched] = useState(false);
  const [playerModalAlbum, setPlayerModalAlbum] = useState(null);
  const [playlists, setPlaylists] = useState(DEFAULT_PLAYLISTS);
  const [aiRecommendedHits, setAiRecommendedHits] = useState([]);
  
  const { user } = useAuth();
  const { addToast } = useToast();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const debounceRef = useRef(null);
  const searchCacheRef = useRef({});

  // Dynamically compute VIBE_CHIPS and CATEGORY_TABS based on user preferences
  const VIBE_CHIPS = user?.preferredArtists 
    ? user.preferredArtists.split(',').filter(Boolean).map(a => ({ label: `✨ ${a}`, query: a }))
      .concat(user.preferredLanguages ? user.preferredLanguages.split(',').filter(Boolean).map(l => ({ label: `🔥 ${l} Hits`, query: `${l} Hits` })) : [])
    : DEFAULT_VIBE_CHIPS;

  const CATEGORY_TABS = user?.preferredLanguages
    ? [{ id: 'all', label: 'All' }, ...user.preferredLanguages.split(',').filter(Boolean).map(l => ({ id: l.toLowerCase(), label: `${l} Hits`, query: `${l} Hits` }))]
    : DEFAULT_CATEGORY_TABS;

  const fetchAiRecommendations = useCallback(async () => {
    try {
      const storedHistory = localStorage.getItem('search_history');
      const searchList = storedHistory ? JSON.parse(storedHistory) : [];
      const storedExcluded = localStorage.getItem('excluded_taste_ids');
      const excludedSet = storedExcluded ? new Set(JSON.parse(storedExcluded)) : new Set();

      let targetQueries = searchList.length > 0 ? searchList.slice(0, 2) : [];
      
      if (user?.preferredArtists) {
        const artists = user.preferredArtists.split(',').filter(Boolean).slice(0, 2);
        targetQueries = [...targetQueries, ...artists];
      }
      if (user?.preferredLanguages && targetQueries.length < 3) {
        const langs = user.preferredLanguages.split(',').filter(Boolean).slice(0, 1);
        targetQueries = [...targetQueries, `${langs[0]} Hits`];
      }
      
      if (targetQueries.length === 0) {
        targetQueries = ['Telugu Melodies', 'Sid Sriram', 'Anirudh'];
      }
      
      const searchPromises = targetQueries.map(q => searchApi.search(q, 6));
      const resultsArray = await Promise.all(searchPromises);

      let allTracks = [];
      resultsArray.forEach(res => {
        if (res.results && Array.isArray(res.results)) {
          allTracks = [...allTracks, ...res.results];
        }
      });

      const filtered = allTracks.filter(t => {
        const tid = String(t.trackId || t.appleCatalogId || t.collectionId || '');
        return !excludedSet.has(tid);
      });

      const seen = new Set();
      const unique = [];
      for (const item of filtered) {
        const key = item.collectionId || item.trackName || item.collectionName;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push({
            ...item,
            aiMatchScore: 94 + (unique.length % 5)
          });
        }
      }

      setAiRecommendedHits(unique.slice(0, 10));
    } catch (err) {
      console.error("Error fetching AI recommendations:", err);
    }
  }, [user]);

  const recordSearchQuery = (qStr) => {
    if (!qStr || qStr.trim().length < 2) return;
    try {
      const q = qStr.trim();
      const stored = localStorage.getItem('search_history');
      let list = stored ? JSON.parse(stored) : [];
      list = [q, ...list.filter(item => item.toLowerCase() !== q.toLowerCase())].slice(0, 15);
      localStorage.setItem('search_history', JSON.stringify(list));
      window.dispatchEvent(new Event('search-history-updated'));
    } catch (e) {}
  };

  // Load initial feeds & spotlight album
  // Load initial feeds & spotlight album dynamically based on user preferences
  useEffect(() => {
    setLoadingFeeds(true);
    
    // Determine target queries based on user preferences
    let q1 = 'Hi Nanna';
    let q2 = 'Telugu Hits';
    let q3 = 'Tamil Hits';
    let q4 = 'Anirudh Ravichander';
    
    if (user && user.preferredLanguages && user.preferredArtists) {
      const langs = user.preferredLanguages.split(',').filter(Boolean);
      const artists = user.preferredArtists.split(',').filter(Boolean);
      if (langs.length > 0) {
        q2 = langs[0] + ' Hits';
        q3 = langs[1] ? langs[1] + ' Hits' : artists[0] || 'Bollywood Hits';
      }
      if (artists.length > 0) {
        q4 = artists[0];
      }
    }

    Promise.all([
      searchApi.search(q1, 1),
      searchApi.search(q2, 12),
      searchApi.search(q3, 12),
      searchApi.search(q4, 12),
    ]).then(([spotRes, telRes, tamRes, aniRes]) => {
      if (spotRes && spotRes.results && spotRes.results.length > 0) {
        setSpotlightAlbum(spotRes.results[0]);
      }
      if (telRes && telRes.results && telRes.results.length > 0) {
        setTeluguFresh(telRes.results);
      }
      if (tamRes && tamRes.results && tamRes.results.length > 0) {
        setTamilHits(tamRes.results);
      }
      if (aniRes && aniRes.results && aniRes.results.length > 0) {
        setAnirudhHits(aniRes.results);
      }
    }).catch(err => console.error("Error loading home feeds:", err))
      .finally(() => setLoadingFeeds(false));

    const fetchPlaylists = () => {
      playlistApi.getAll().then(res => {
        if (Array.isArray(res) && res.length > 0) {
          setPlaylists(res);
        }
      }).catch(console.error)
        .finally(() => setLoadingPlaylists(false));
    };

    fetchPlaylists();
    fetchAiRecommendations();

    window.addEventListener('playlists-updated', fetchPlaylists);
    window.addEventListener('search-history-updated', fetchAiRecommendations);
    window.addEventListener('taste-profile-updated', fetchAiRecommendations);
    return () => {
      window.removeEventListener('playlists-updated', fetchPlaylists);
      window.removeEventListener('search-history-updated', fetchAiRecommendations);
      window.removeEventListener('taste-profile-updated', fetchAiRecommendations);
    };
  }, [fetchAiRecommendations, user]);

  const executeSearch = useCallback(async (searchQuery) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setSearched(true);
    recordSearchQuery(trimmed);
    // Instant load from cache if available
    if (searchCacheRef.current[trimmed]) {
      setResults(searchCacheRef.current[trimmed]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await searchApi.search(trimmed, 30);
      let resList = data.results || [];
      // Sort newer releases first if searching for 2026 or new releases
      if (trimmed.toLowerCase().includes('2026') || trimmed.toLowerCase().includes('latest') || trimmed.toLowerCase().includes('new')) {
        resList = [...resList].sort((a, b) => {
          const yA = parseInt((a.releaseDate || '2000').substring(0, 4), 10);
          const yB = parseInt((b.releaseDate || '2000').substring(0, 4), 10);
          return yB - yA;
        });
      }
      searchCacheRef.current[trimmed] = resList;
      setResults(resList);
      if (resList.length > 0) {
        setSpotlightAlbum(resList[0]);
      }
    } catch (err) {
      addToast(err.message || 'Search failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      executeSearch(val);
    }, 300);
  };

  const handleVibeClick = (vibeQuery) => {
    if (vibeQuery === '2026_special' || vibeQuery.includes('2026')) {
      setPlayerModalAlbum({
        collectionId: 'custom-2026-trending',
        collectionName: 'Trending Telugu Songs 2026',
        title: 'Trending Telugu Songs 2026',
        artistName: 'Aura 2026 Releases Mix',
        primaryGenreName: 'Telugu',
        releaseDate: '2026',
        isCustomPlaylist: true
      });
      return;
    }
    setQuery(vibeQuery);
    executeSearch(vibeQuery);
  };

  const handlePlayAlbumDirect = (album, e) => {
    if (e) e.stopPropagation();
    searchApi.getAlbumTracks(album.collectionId || album.appleCatalogId)
      .then(data => {
        const songList = (data.results || []).filter(item => item.wrapperType === 'track');
        if (songList.length > 0) {
          playTrack(songList[0]);
          addToast(`Streaming "${songList[0].trackName}" 🎵`, 'info');
        } else {
          setPlayerModalAlbum(album);
        }
      })
      .catch(() => setPlayerModalAlbum(album));
  };

  const handleSaveAlbum = async (album, e) => {
    if (e) e.stopPropagation();
    try {
      await libraryApi.add({
        appleCatalogId: album.collectionId || album.appleCatalogId || Date.now(),
        title: album.collectionName || album.title || 'Unknown Title',
        artistName: album.artistName || 'Unknown Artist',
        genre: album.primaryGenreName || album.genre || 'Telugu/Tamil',
        releaseDate: album.releaseDate || '2024',
        artworkUrl: album.artworkUrl100 || album.artworkUrl || '',
        userRating: 5,
        userNotes: 'Added from AuraMusic Flow Hub',
      });
      addToast(`Saved "${album.collectionName}" to library! ❤️`, 'success');
    } catch (err) {
      addToast(`Album is already in your library!`, 'info');
    }
  };

  const getHighResArt = (url) => {
    if (!url) return '';
    return url.replace(/\d+x\d+bb/, '500x500bb');
  };

  const getYear = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.substring(0, 4);
  };

  if (playerModalAlbum) {
    return (
      <AlbumDetailView
        album={playerModalAlbum}
        onClose={() => setPlayerModalAlbum(null)}
      />
    );
  }

  return (
    <div className="sonic-discover-page fade-in">
      {/* Spotify Top Header Bar matching Image 2 */}
      <div className="spotify-top-header-bar">
        {/* Circular Home Button */}
        <button
          className="spotify-home-btn"
          onClick={() => { setQuery(''); setSearched(false); setActiveTab('all'); }}
          title="Home"
        >
          <Home size={22} color="#ffffff" />
        </button>

        {/* Center Search Pill matching Image 2 */}
        <div className="spotify-search-pill-container">
          <Search size={20} className="spotify-search-pill-icon" />
          <input
            type="text"
            className="spotify-search-pill-input"
            placeholder="What do you want to play?"
            value={query}
            onChange={handleQueryChange}
          />
          <div className="spotify-search-pill-divider" />
          <FolderHeart size={18} className="spotify-search-pill-browse" title="Browse Catalog" />
        </div>

        {/* Dynamic Category Tabs */}
        <div className="sonic-category-tabs">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              className={`sonic-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.query) {
                  handleVibeClick(tab.query);
                } else {
                  setSearched(false);
                  setQuery('');
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* Main Area Body */}
      <div className="spotify-content-body">
        {/* Loading Spinner */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Searching AuraMusic Catalog...</p>
          </div>
        )}

        {/* Search Results */}
        {!loading && searched && (
          <div className="spotify-section">
            <div className="spotify-section-header">
              <h2>Search Results for "{query}"</h2>
            </div>
            {results.length === 0 ? (
              <div className="empty-state">
                <Music />
                <h3>No music found for "{query}"</h3>
                <p>Try searching for Telugu or Tamil terms like Anirudh, Thaman, Sid Sriram, A.R. Rahman</p>
              </div>
            ) : (
              <div className="sonic-card-grid">
                {results.map(album => (
                  <div
                    key={album.collectionId}
                    className="sonic-music-card"
                    onClick={() => setPlayerModalAlbum(album)}
                  >
                    <div className="sonic-card-img-wrapper">
                      <SafeImage src={getHighResArt(album.artworkUrl100)} alt={album.collectionName} />
                      <button
                        className="sonic-hover-play-btn"
                        onClick={(e) => handlePlayAlbumDirect(album, e)}
                        title="Stream Track"
                      >
                        <Play size={22} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                      </button>
                      {album.inLibrary && <span className="sonic-saved-badge">✓ Saved</span>}
                    </div>
                    <div className="sonic-card-info">
                      <h4 className="sonic-card-title">{album.collectionName}</h4>
                      <p className="sonic-card-artist">{album.artistName}</p>
                      <div className="sonic-card-meta">
                        <span className="sonic-genre-tag">{album.primaryGenreName}</span>
                        <span className="sonic-card-year">{getYear(album.releaseDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Default Home Flow (Shown when search is empty) */}
        {!loading && !searched && (
          <>
            {/* Spotify Home Grid (Image 1) */}
            <div className="spotify-home-grid">
              {loadingPlaylists ? (
                Array.from({length: 8}).map((_, i) => (
                  <div key={'skel-' + i} className="spotify-home-grid-card" style={{ opacity: 0.6, cursor: 'default' }}>
                    <div style={{ width: '64px', height: '64px', background: '#282828' }} />
                    <span className="title" style={{ width: '60%', height: '14px', background: '#282828', borderRadius: '4px', margin: '0 16px' }}></span>
                  </div>
                ))
              ) : playlists.length > 0 ? playlists.map((item, index) => {
                const displayAlbum = { 
                  collectionId: 'custom-' + item.id,
                  collectionName: item.title,
                  artworkUrl100: item.artworks,
                  artistName: 'Aura Mix',
                  isCustomPlaylist: true,
                  searchQuery: item.queryTag || item.title,
                  backendTracks: item.tracks
                };
                
                const isPlayingThisAlbum = isPlaying && currentTrack && (
                  (currentTrack.collectionName && currentTrack.collectionName.toLowerCase().includes(item.title.toLowerCase())) ||
                  (item.title && currentTrack.collectionName && item.title.toLowerCase().includes(currentTrack.collectionName.toLowerCase())) ||
                  (item.title === 'Liked Songs' && (currentTrack.collectionName === 'Liked Songs' || currentTrack.isLiked))
                );

                return (
                  <div 
                    key={'grid-' + index} 
                    className={`spotify-home-grid-card ${isPlayingThisAlbum ? 'active-playing-card' : ''}`}
                    onClick={() => {
                      setPlayerModalAlbum({
                        ...displayAlbum,
                        backendTracks: item.tracks || []
                      });
                    }}
                    style={{
                      border: isPlayingThisAlbum ? '2px solid #00e5ff' : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: isPlayingThisAlbum ? '0 0 20px rgba(0, 229, 255, 0.45)' : undefined,
                      background: isPlayingThisAlbum ? 'rgba(0, 229, 255, 0.12)' : undefined,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ 
                      background: item.gradient || 'linear-gradient(135deg, #333344, #1a1a24)', 
                      width: '48px', 
                      height: '100%', 
                      minWidth: '48px',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      overflow: 'hidden' 
                    }}>
                      {item.icon === 'heart' ? (
                        <Heart size={20} fill="#fff" color="#fff" />
                      ) : item.icon === 'flame' ? (
                        <Flame size={20} fill="#fff" color="#fff" />
                      ) : item.icon === 'zap' ? (
                        <Zap size={20} fill="#fff" color="#fff" />
                      ) : item.icon === 'radio' ? (
                        <Radio size={20} color="#fff" />
                      ) : item.icon === 'sparkles' ? (
                        <Sparkles size={20} color="#fff" />
                      ) : item.icon === 'music' ? (
                        <Music size={20} color="#fff" />
                      ) : item.icon === 'disc' ? (
                        <Disc size={20} color="#fff" />
                      ) : item.artworks && item.artworks.length > 0 ? (
                        <SafeImage src={item.artworks[0]} alt={item.title} style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                      ) : (
                        <Disc size={20} color="#fff" />
                      )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '10px', paddingRight: '8px', overflow: 'hidden' }}>
                      <span className="title" title={item.title} style={{ fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isPlayingThisAlbum ? '#00e5ff' : '#fff' }}>{item.title}</span>
                      {isPlayingThisAlbum && (
                        <span style={{ background: '#00e5ff', color: '#000', fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                          PLAYING ▶
                        </span>
                      )}
                    </div>
                  </div>
                );
              }) : <div style={{ padding: '20px', color: '#b3b3b3' }}>No playlists generated yet. The backend scheduled tasks will populate these.</div>}
            </div>

            {/* Hero Spotlight Banner - Dynamic Hourly Auto-Rotating */}
            {spotlightAlbum && (
              <div className="sonic-spotlight-hero">
                <div>
                  <div className="hero-tag" style={{ background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                    <Sparkles size={14} color="#00e5ff" /> 🔥 TRENDING RELEASE THIS HOUR
                  </div>
                  <h1 className="hero-title">{spotlightAlbum.collectionName}</h1>
                  <p className="hero-subtitle" style={{ color: '#00e5ff', fontWeight: 600 }}>
                    {spotlightAlbum.artistName} · {spotlightAlbum.primaryGenreName || 'Cinema'} · 🎧 2.8M Streams Today • Updated Hourly
                  </p>
                  <div className="hero-actions">
                    <button
                      className="sonic-spotlight-play-btn"
                      onClick={(e) => handlePlayAlbumDirect(spotlightAlbum, e)}
                      title="Play Spotlight Release"
                    >
                      <Play size={24} fill="#ffffff" color="#ffffff" style={{ marginLeft: '3px' }} />
                    </button>

                    <button
                      className="btn-pill-save"
                      onClick={(e) => handleSaveAlbum(spotlightAlbum, e)}
                    >
                      <Plus size={18} /> Save to Library
                    </button>
                  </div>
                </div>
                <div style={{ width: '180px', height: '180px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 15px 35px rgba(0,0,0,0.6)' }}>
                  <SafeImage src={getHighResArt(spotlightAlbum.artworkUrl100)} alt={spotlightAlbum.collectionName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            )}
            {/* AI Recommendation Engine Feed Section */}
            {aiRecommendedHits.length > 0 && (
              <div className="spotify-section" style={{ marginBottom: '2.5rem' }}>
                <div className="spotify-section-header">
                  <div>
                    <span className="spotify-section-subtitle" style={{ color: 'var(--neon-violet)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} className="ai-glow" /> AI Music Intelligence
                    </span>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ✨ Made For You <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#b3b3b3' }}>(Based on your search history)</span>
                    </h2>
                  </div>
                </div>

                <div className="sonic-card-grid">
                  {aiRecommendedHits.map(album => (
                    <div
                      key={'ai-' + (album.collectionId || album.trackId || Math.random())}
                      className="sonic-music-card"
                      onClick={() => setPlayerModalAlbum(album)}
                      style={{ border: '1px solid rgba(139, 92, 246, 0.25)', position: 'relative' }}
                    >
                      <div className="sonic-card-img-wrapper">
                        <SafeImage src={getHighResArt(album.artworkUrl100 || album.artworkUrl)} alt={album.collectionName || album.trackName} />
                        <button
                          className="sonic-hover-play-btn"
                          onClick={(e) => handlePlayAlbumDirect(album, e)}
                          title="Stream Track"
                        >
                          <Play size={22} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                        </button>
                      </div>
                      <div className="sonic-card-info">
                        <h4 className="sonic-card-title">{album.collectionName || album.trackName}</h4>
                        <p className="sonic-card-artist">{album.artistName}</p>
                        <div className="sonic-card-meta">
                          <span className="sonic-genre-tag" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--neon-violet)' }}>
                            {album.primaryGenreName || 'Recommendation'}
                          </span>
                          <span className="sonic-card-year">{getYear(album.releaseDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feeds View */}
            <div className="spotify-feeds-container fade-in">

                {/* Section 1: User's Top Language Hits */}
                <div className="spotify-section">
                  <div className="spotify-section-header">
                    <div>
                      <span className="spotify-section-subtitle">Based on your preferences</span>
                      <h2>🔥 {user?.preferredLanguages ? user.preferredLanguages.split(',')[0] : 'Trending Telugu'} Hits & Soundtracks</h2>
                    </div>
                    <button className="spotify-show-all" onClick={() => handleVibeClick(user?.preferredLanguages ? user.preferredLanguages.split(',')[0] : 'Telugu')}>Explore all</button>
                  </div>

              {loadingFeeds ? (
                <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
              ) : (
                <div className="sonic-card-grid">
                  {teluguFresh.map(album => (
                    <div
                      key={album.collectionId}
                      className="sonic-music-card"
                      onClick={() => setPlayerModalAlbum(album)}
                    >
                      <div className="sonic-card-img-wrapper">
                        <SafeImage src={getHighResArt(album.artworkUrl100)} alt={album.collectionName} />
                        <button
                          className="sonic-hover-play-btn"
                          onClick={(e) => handlePlayAlbumDirect(album, e)}
                          title="Stream Track"
                        >
                          <Play size={22} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                        </button>
                        {album.inLibrary && <span className="sonic-saved-badge">✓ Saved</span>}
                      </div>
                      <div className="sonic-card-info">
                        <h4 className="sonic-card-title">{album.collectionName}</h4>
                        <p className="sonic-card-artist">{album.artistName}</p>
                        <div className="sonic-card-meta">
                          <span className="sonic-genre-tag">{album.primaryGenreName}</span>
                          <span className="sonic-card-year">{getYear(album.releaseDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

                {/* Section 2: Secondary Language Hits */}
                <div className="spotify-section">
                  <div className="spotify-section-header">
                    <div>
                      <span className="spotify-section-subtitle">Hot Right Now</span>
                      <h2>⚡ Top Trending {(user?.preferredLanguages && user.preferredLanguages.split(',').length > 1) ? user.preferredLanguages.split(',')[1] : 'Tamil'} Songs & Viral Hits</h2>
                    </div>
                    <button className="spotify-show-all" onClick={() => handleVibeClick((user?.preferredLanguages && user.preferredLanguages.split(',').length > 1) ? user.preferredLanguages.split(',')[1] : 'Tamil Hits')}>Explore all</button>
                  </div>

              {loadingFeeds ? (
                <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
              ) : (
                <div className="sonic-card-grid">
                  {tamilHits.map(album => (
                  <div
                    key={album.collectionId}
                    className="sonic-music-card"
                    onClick={() => setPlayerModalAlbum(album)}
                  >
                    <div className="sonic-card-img-wrapper">
                      <SafeImage src={getHighResArt(album.artworkUrl100)} alt={album.collectionName} />
                      <button
                        className="sonic-hover-play-btn"
                        onClick={(e) => handlePlayAlbumDirect(album, e)}
                        title="Stream Track"
                      >
                        <Play size={22} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                      </button>
                      {album.inLibrary && <span className="sonic-saved-badge">✓ Saved</span>}
                    </div>
                    <div className="sonic-card-info">
                      <h4 className="sonic-card-title">{album.collectionName}</h4>
                      <p className="sonic-card-artist">{album.artistName}</p>
                      <div className="sonic-card-meta">
                        <span className="sonic-genre-tag">{album.primaryGenreName}</span>
                        <span className="sonic-card-year">{getYear(album.releaseDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>

                {/* Section 3: Favorite Artists */}
                <div className="spotify-section">
                  <div className="spotify-section-header">
                    <div>
                      <span className="spotify-section-subtitle">Artist Spotlight</span>
                      <h2>✨ {user?.preferredArtists ? user.preferredArtists.split(',')[0] : 'Anirudh Ravichander & A.R. Rahman'} Specials</h2>
                    </div>
                    <button className="spotify-show-all" onClick={() => handleVibeClick(user?.preferredArtists ? user.preferredArtists.split(',')[0] : 'Anirudh')}>Explore all</button>
                  </div>

              {loadingFeeds ? (
                <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
              ) : (
                <div className="sonic-card-grid">
                  {anirudhHits.map(album => (
                  <div
                    key={album.collectionId}
                    className="sonic-music-card"
                    onClick={() => setPlayerModalAlbum(album)}
                  >
                    <div className="sonic-card-img-wrapper">
                      <SafeImage src={getHighResArt(album.artworkUrl100)} alt={album.collectionName} />
                      <button
                        className="sonic-hover-play-btn"
                        onClick={(e) => handlePlayAlbumDirect(album, e)}
                        title="Stream Track"
                      >
                        <Play size={22} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                      </button>
                      {album.inLibrary && <span className="sonic-saved-badge">✓ Saved</span>}
                    </div>
                    <div className="sonic-card-info">
                      <h4 className="sonic-card-title">{album.collectionName}</h4>
                      <p className="sonic-card-artist">{album.artistName}</p>
                      <div className="sonic-card-meta">
                        <span className="sonic-genre-tag">{album.primaryGenreName}</span>
                        <span className="sonic-card-year">{getYear(album.releaseDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>

      {/* Album Details & Player Modal */}
      {playerModalAlbum && (
        <AlbumDetailView
          album={playerModalAlbum}
          isSaved={playerModalAlbum.inLibrary}
          onClose={() => setPlayerModalAlbum(null)}
          onLibraryUpdate={() => {}}
        />
      )}
    </div>
  );
}

export default SearchPage;
