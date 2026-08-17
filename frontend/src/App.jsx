import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authApi } from './api';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AiInsightsPage from './pages/AiInsightsPage';
import BottomPlayerBar from './components/BottomPlayerBar';
import RightArtistSidebar from './components/RightArtistSidebar';
import JamSessionModal from './components/JamSessionModal';
import OnboardingWizard from './components/OnboardingWizard';
import { jamApi, streamApi, analyticsApi, searchApi } from './api';

// Error Boundary to prevent blank white/dark screens
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#fff', textAlign: 'center', background: '#121212', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#ec4899', marginBottom: '12px' }}>AuraMusic Encountered an Issue</h2>
          <p style={{ color: '#b3b3b3', maxWidth: '400px', marginBottom: '24px' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering.'}
          </p>
          <button 
            style={{ padding: '12px 24px', borderRadius: '30px', background: 'linear-gradient(135deg, #00e5ff, #b300ff)', color: '#fff', fontWeight: '700', border: 'none', cursor: 'pointer' }}
            onClick={() => window.location.reload()}
          >
            Reload AuraMusic
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const DEFAULT_FEATURED_TRACK = {
  trackId: 1001,
  appleCatalogId: 1001,
  trackName: 'Samayama',
  artistName: 'Hesham Abdul Wahab',
  collectionName: 'Hi Nanna (Original Soundtrack)',
  artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/21/5b/c4/215bc4c8-3e4b-74bf-d3eb-ee9bf896e001/886448834479.jpg/300x300bb.jpg',
  previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/28/31/3b/28313b5e-436f-b258-0056-bb6b06385a49/mzaf_10486001083980315354.plus.aac.p.m4a',
  primaryGenreName: 'Telugu Cinema',
  releaseDate: '2023-11-24',
  trackTimeMillis: 242000
};

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Toast Context
const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

// Player Context
const PlayerContext = createContext(null);
export const usePlayer = () => useContext(PlayerContext);

function App() {
  const audioRef = useRef(null);
  const playRequestIdRef = useRef(0);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    if (!message || String(message).includes('aborted') || String(message).includes('AbortError') || String(message).includes('signal is aborted')) {
      return;
    }
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.me()
        .then(data => setUser(data))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Player State & Queue Management
  const [currentTrack, setCurrentTrack] = useState(DEFAULT_FEATURED_TRACK);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isFullLength, setIsFullLength] = useState(false);

  const queueRef = useRef([]);
  const queueIndexRef = useRef(0);
  const isShuffleRef = useRef(false);
  const isRepeatRef = useRef(false);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { isRepeatRef.current = isRepeat; }, [isRepeat]);

  // Live Jam Room State
  const [jamRoomCode, setJamRoomCode] = useState(null);
  const [isJamHost, setIsJamHost] = useState(false);
  const [jamConnectedUsers, setJamConnectedUsers] = useState([]);
  const [jamReactions, setJamReactions] = useState([]);
  const [showJamModal, setShowJamModal] = useState(false);

  const handleLogin = (data) => {
    if (!data) return;
    const token = data.token || 'aura_jwt_' + Date.now();
    const userObj = data.user || data;

    const normalizedUser = {
      ...userObj,
      token,
      username: userObj.username || userObj.fullName || userObj.email?.split('@')[0] || 'Aura User',
      email: userObj.email || 'user@auramusic.com',
      preferredLanguages: userObj.preferredLanguages || 'Telugu,Tamil',
      preferredArtists: userObj.preferredArtists || 'Anirudh Ravichander,A.R. Rahman,Devi Sri Prasad'
    };

    localStorage.setItem('token', token);
    localStorage.setItem('aura_user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
    setShowAuth(false);
    addToast(`Welcome, ${normalizedUser.username}! 🚀`, 'success');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    addToast('Logged out successfully', 'info');
  };

  const sendJamReaction = async (emoji) => {
    if (!jamRoomCode) return;
    try {
      const res = await jamApi.sendReaction(jamRoomCode, emoji);
      if (res && res.reactions) setJamReactions(res.reactions);
    } catch (e) {
      console.warn("Error sending reaction:", e);
    }
  };

  // Real-time Jam Sync Loop (Polls every 1.5s for live listener sync)
  useEffect(() => {
    if (!jamRoomCode) return;

    const interval = setInterval(async () => {
      try {
        if (isJamHost) {
          if (currentTrack) {
            const state = await jamApi.sync(
              jamRoomCode,
              currentTrack,
              isPlaying,
              audioRef.current ? audioRef.current.currentTime : currentTime
            );
            if (state && state.connectedUsers) setJamConnectedUsers(state.connectedUsers);
            if (state && state.reactions) setJamReactions(state.reactions);
          }
        } else {
          const state = await jamApi.getState(jamRoomCode);
          if (state) {
            if (state.connectedUsers) setJamConnectedUsers(state.connectedUsers);
            if (state.reactions) setJamReactions(state.reactions);

            if (state.currentTrack) {
              const hostTrack = state.currentTrack;
              if (!currentTrack || currentTrack.trackName !== hostTrack.trackName) {
                playTrack(hostTrack);
              }
              if (state.isPlaying && !isPlaying && audioRef.current) {
                audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
              } else if (!state.isPlaying && isPlaying && audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
              }
              if (audioRef.current && Math.abs(audioRef.current.currentTime - state.currentTime) > 2.5) {
                audioRef.current.currentTime = state.currentTime;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Jam sync error:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jamRoomCode, isJamHost, currentTrack, isPlaying, currentTime]);

  const setVolume = (v) => {
    setVolumeState(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  // DES-ECB decryption for JioSaavn encrypted media URLs (same key as backend)
  // Uses proven 32-bit integer SP-box approach (matches javax.crypto DES/ECB/PKCS5Padding)
  const decryptJioSaavnUrl = (encryptedUrl) => {
    try {
      if (!encryptedUrl || !encryptedUrl.trim()) return null;
      const KEY = '38346591';

      // --- Proven DES-ECB implementation using 32-bit integer SP-box lookup tables ---
      // Pre-computed PC-2 selection tables (key schedule)
      const pc2bytes0  = [0,0x4,0x20000000,0x20000004,0x10000,0x10004,0x20010000,0x20010004,0x200,0x204,0x20000200,0x20000204,0x10200,0x10204,0x20010200,0x20010204];
      const pc2bytes1  = [0,0x1,0x100000,0x100001,0x4000000,0x4000001,0x4100000,0x4100001,0x100,0x101,0x100100,0x100101,0x4000100,0x4000101,0x4100100,0x4100101];
      const pc2bytes2  = [0,0x8,0x800,0x808,0x1000000,0x1000008,0x1000800,0x1000808,0,0x8,0x800,0x808,0x1000000,0x1000008,0x1000800,0x1000808];
      const pc2bytes3  = [0,0x200000,0x8000000,0x8200000,0x2000,0x202000,0x8002000,0x8202000,0x20000,0x220000,0x8020000,0x8220000,0x22000,0x222000,0x8022000,0x8222000];
      const pc2bytes4  = [0,0x40000,0x10,0x40010,0,0x40000,0x10,0x40010,0x1000,0x41000,0x1010,0x41010,0x1000,0x41000,0x1010,0x41010];
      const pc2bytes5  = [0,0x400,0x20,0x420,0,0x400,0x20,0x420,0x2000000,0x2000400,0x2000020,0x2000420,0x2000000,0x2000400,0x2000020,0x2000420];
      const pc2bytes6  = [0,0x10000000,0x80000,0x10080000,0x2,0x10000002,0x80002,0x10080002,0,0x10000000,0x80000,0x10080000,0x2,0x10000002,0x80002,0x10080002];
      const pc2bytes7  = [0,0x10000,0x800,0x10800,0x20000000,0x20010000,0x20000800,0x20010800,0x20000,0x30000,0x20800,0x30800,0x20020000,0x20030000,0x20020800,0x20030800];
      const pc2bytes8  = [0,0x40000,0,0x40000,0x2,0x40002,0x2,0x40002,0x2000000,0x2040000,0x2000000,0x2040000,0x2000002,0x2040002,0x2000002,0x2040002];
      const pc2bytes9  = [0,0x10000000,0x8,0x10000008,0,0x10000000,0x8,0x10000008,0x400,0x10000400,0x408,0x10000408,0x400,0x10000400,0x408,0x10000408];
      const pc2bytes10 = [0,0x20,0,0x20,0x100000,0x100020,0x100000,0x100020,0x2000,0x2020,0x2000,0x2020,0x102000,0x102020,0x102000,0x102020];
      const pc2bytes11 = [0,0x1000000,0x200,0x1000200,0x200000,0x1200000,0x200200,0x1200200,0x4000000,0x5000000,0x4000200,0x5000200,0x4200000,0x5200000,0x4200200,0x5200200];
      const pc2bytes12 = [0,0x1000,0x8000000,0x8001000,0x80000,0x81000,0x8080000,0x8081000,0x10,0x1010,0x8000010,0x8001010,0x80010,0x81010,0x8080010,0x8081010];
      const pc2bytes13 = [0,0x4,0x100,0x104,0,0x4,0x100,0x104,0x1,0x5,0x101,0x105,0x1,0x5,0x101,0x105];

      // Combined S-box + P permutation lookup tables (SP-boxes)
      const sp1 = [0x1010400,0,0x10000,0x1010404,0x1010004,0x10404,0x4,0x10000,0x400,0x1010400,0x1010404,0x400,0x1000404,0x1010004,0x1000000,0x4,0x404,0x1000400,0x1000400,0x10400,0x10400,0x1010000,0x1010000,0x1000404,0x10004,0x1000004,0x1000004,0x10004,0,0x404,0x10404,0x1000000,0x10000,0x1010404,0x4,0x1010000,0x1010400,0x1000000,0x1000000,0x400,0x1010004,0x10000,0x10400,0x1000004,0x400,0x4,0x1000404,0x10404,0x1010404,0x10004,0x1010000,0x1000404,0x1000004,0x404,0x10404,0x1010400,0x404,0x1000400,0x1000400,0,0x10004,0x10400,0,0x1010004];
      const sp2 = [-0x7fef7fe0,-0x7fff8000,0x8000,0x108020,0x100000,0x20,-0x7fefffe0,-0x7fff7fe0,-0x7fffffe0,-0x7fef7fe0,-0x7fef8000,-0x80000000,-0x7fff8000,0x100000,0x20,-0x7fefffe0,0x108000,0x100020,-0x7fff7fe0,0,-0x80000000,0x8000,0x108020,-0x7ff00000,0x100020,-0x7fffffe0,0,0x108000,0x8020,-0x7fef8000,-0x7ff00000,0x8020,0,0x108020,-0x7fefffe0,0x100000,-0x7fff7fe0,-0x7ff00000,-0x7fef8000,0x8000,-0x7ff00000,-0x7fff8000,0x20,-0x7fef7fe0,0x108020,0x20,0x8000,-0x80000000,0x8020,-0x7fef8000,0x100000,-0x7fffffe0,0x100020,-0x7fff7fe0,-0x7fffffe0,0x100020,0x108000,0,-0x7fff8000,0x8020,-0x80000000,-0x7fefffe0,-0x7fef7fe0,0x108000];
      const sp3 = [0x208,0x8020200,0,0x8020008,0x8000200,0,0x20208,0x8000200,0x20008,0x8000008,0x8000008,0x20000,0x8020208,0x20008,0x8020000,0x208,0x8000000,0x8,0x8020200,0x200,0x20200,0x8020000,0x8020008,0x20208,0x8000208,0x20200,0x20000,0x8000208,0x8,0x8020208,0x200,0x8000000,0x8020200,0x8000000,0x20008,0x208,0x20000,0x8020200,0x8000200,0,0x200,0x20008,0x8020208,0x8000200,0x8000008,0x200,0,0x8020008,0x8000208,0x20000,0x8000000,0x8020208,0x8,0x20208,0x20200,0x8000008,0x8020000,0x8000208,0x208,0x8020000,0x20208,0x8,0x8020008,0x20200];
      const sp4 = [0x802001,0x2081,0x2081,0x80,0x802080,0x800081,0x800001,0x2001,0,0x802000,0x802000,0x802081,0x81,0,0x800080,0x800001,0x1,0x2000,0x800000,0x802001,0x80,0x800000,0x2001,0x2080,0x800081,0x1,0x2080,0x800080,0x2000,0x802080,0x802081,0x81,0x800080,0x800001,0x802000,0x802081,0x81,0,0,0x802000,0x2080,0x800080,0x800081,0x1,0x802001,0x2081,0x2081,0x80,0x802081,0x81,0x1,0x2000,0x800001,0x2001,0x802080,0x800081,0x2001,0x2080,0x800000,0x802001,0x80,0x800000,0x2000,0x802080];
      const sp5 = [0x100,0x2080100,0x2080000,0x42000100,0x80000,0x100,0x40000000,0x2080000,0x40080100,0x80000,0x2000100,0x40080100,0x42000100,0x42080000,0x80100,0x40000000,0x2000000,0x40080000,0x40080000,0,0x40000100,0x42080100,0x42080100,0x2000100,0x42080000,0x40000100,0,0x42000000,0x2080100,0x2000000,0x42000000,0x80100,0x80000,0x42000100,0x100,0x2000000,0x40000000,0x2080000,0x42000100,0x40080100,0x2000100,0x40000000,0x42080000,0x2080100,0x40080100,0x100,0x2000000,0x42080000,0x42080100,0x80100,0x42000000,0x42080100,0x2080000,0,0x40080000,0x42000000,0x80100,0x2000100,0x40000100,0x80000,0,0x40080000,0x2080100,0x40000100];
      const sp6 = [0x20000010,0x20400000,0x4000,0x20404010,0x20400000,0x10,0x20404010,0x400000,0x20004000,0x404010,0x400000,0x20000010,0x400010,0x20004000,0x20000000,0x4010,0,0x400010,0x20004010,0x4000,0x404000,0x20004010,0x10,0x20400010,0x20400010,0,0x404010,0x20404000,0x4010,0x404000,0x20404000,0x20000000,0x20004000,0x10,0x20400010,0x404000,0x20404010,0x400000,0x4010,0x20000010,0x400000,0x20004000,0x20000000,0x4010,0x20000010,0x20404010,0x404000,0x20400000,0x404010,0x20404000,0,0x20400010,0x10,0x4000,0x20400000,0x404010,0x4000,0x400010,0x20004010,0,0x20404000,0x20000000,0x400010,0x20004010];
      const sp7 = [0x200000,0x4200002,0x4000802,0,0x800,0x4000802,0x200802,0x4200800,0x4200802,0x200000,0,0x4000002,0x2,0x4000000,0x4200002,0x802,0x4000800,0x200802,0x200002,0x4000800,0x4000002,0x4200000,0x4200800,0x200002,0x4200000,0x800,0x802,0x4200802,0x200800,0x2,0x4000000,0x200800,0x4000000,0x200800,0x200000,0x4000802,0x4000802,0x4200002,0x4200002,0x2,0x200002,0x4000000,0x4000800,0x200000,0x4200800,0x802,0x200802,0x4200800,0x802,0x4000002,0x4200802,0x4200000,0x200800,0,0x2,0x4200802,0,0x200802,0x4200000,0x800,0x4000002,0x4000800,0x800,0x200002];
      const sp8 = [0x10001040,0x1000,0x40000,0x10041040,0x10000000,0x10001040,0x40,0x10000000,0x40040,0x10040000,0x10041040,0x41000,0x10041000,0x41040,0x1000,0x40,0x10040000,0x10000040,0x10001000,0x1040,0x41000,0x40040,0x10040040,0x10041000,0x1040,0,0,0x10040040,0x10000040,0x10001000,0x41040,0x40000,0x41040,0x40000,0x10041000,0x1000,0x40,0x10040040,0x1000,0x41040,0x10001000,0x40,0x10000040,0x10040000,0x10040040,0x10000000,0x40000,0x10001040,0,0x10041040,0x40040,0x10000040,0x10040000,0x10001000,0x10001040,0,0x10041040,0x41000,0x41000,0x1040,0x1040,0x40040,0x10000000,0x10041000];

      // --- Key schedule ---
      const keys = [];
      const key = [];
      for (let i = 0; i < KEY.length; i++) key.push(KEY.charCodeAt(i));
      let left = (key[0]<<24)|(key[1]<<16)|(key[2]<<8)|key[3];
      let right = (key[4]<<24)|(key[5]<<16)|(key[6]<<8)|key[7];
      let temp = ((left>>>4)^right)&0x0f0f0f0f; right ^= temp; left ^= (temp<<4);
      temp = ((right>>>-16)^left)&0x0000ffff; left ^= temp; right ^= (temp<<-16);
      temp = ((left>>>2)^right)&0x33333333; right ^= temp; left ^= (temp<<2);
      temp = ((right>>>-16)^left)&0x0000ffff; left ^= temp; right ^= (temp<<-16);
      temp = ((left>>>1)^right)&0x55555555; right ^= temp; left ^= (temp<<1);
      temp = ((right>>>8)^left)&0x00ff00ff; left ^= temp; right ^= (temp<<8);
      temp = ((left>>>1)^right)&0x55555555; right ^= temp; left ^= (temp<<1);
      temp = (left<<8)|((right>>>20)&0x000000f0);
      left = (right<<24)|((right<<8)&0xff0000)|((right>>>8)&0xff00)|((right>>>24)&0xf0);
      right = temp;
      const shifts = [0,0,1,1,1,1,1,1,0,1,1,1,1,1,1,0];
      for (let i = 0; i < 16; i++) {
        if (shifts[i]) { left = (left<<2)|((left>>>26)&0x3f); right = (right<<2)|((right>>>26)&0x3f); }
        else { left = (left<<1)|((left>>>27)&0x1f); right = (right<<1)|((right>>>27)&0x1f); }
        left &= -0xf; right &= -0xf;
        const lt = pc2bytes0[left>>>28]|pc2bytes1[(left>>>24)&0xf]|pc2bytes2[(left>>>20)&0xf]|pc2bytes3[(left>>>16)&0xf]|pc2bytes4[(left>>>12)&0xf]|pc2bytes5[(left>>>8)&0xf]|pc2bytes6[(left>>>4)&0xf];
        const rt = pc2bytes7[right>>>28]|pc2bytes8[(right>>>24)&0xf]|pc2bytes9[(right>>>20)&0xf]|pc2bytes10[(right>>>16)&0xf]|pc2bytes11[(right>>>12)&0xf]|pc2bytes12[(right>>>8)&0xf]|pc2bytes13[(right>>>4)&0xf];
        temp = ((rt>>>16)^lt)&0x0000ffff;
        keys.push(lt^temp, rt^(temp<<16));
      }

      // --- Decrypt all 8-byte blocks ---
      const encBytes = Uint8Array.from(atob(encryptedUrl), c => c.charCodeAt(0));
      const result = [];
      for (let chunk = 0; chunk < encBytes.length; chunk += 8) {
        let l = (encBytes[chunk]<<24)|(encBytes[chunk+1]<<16)|(encBytes[chunk+2]<<8)|encBytes[chunk+3];
        let r = (encBytes[chunk+4]<<24)|(encBytes[chunk+5]<<16)|(encBytes[chunk+6]<<8)|encBytes[chunk+7];
        // Initial Permutation (IP)
        temp = ((l>>>4)^r)&0x0f0f0f0f; r ^= temp; l ^= (temp<<4);
        temp = ((l>>>16)^r)&0x0000ffff; r ^= temp; l ^= (temp<<16);
        temp = ((r>>>2)^l)&0x33333333; l ^= temp; r ^= (temp<<2);
        temp = ((r>>>8)^l)&0x00ff00ff; l ^= temp; r ^= (temp<<8);
        temp = ((l>>>1)^r)&0x55555555; r ^= temp; l ^= (temp<<1);
        l = ((l<<1)|(l>>>31)); r = ((r<<1)|(r>>>31));
        // 16 Feistel rounds (reverse order for decryption)
        for (let j = 30; j >= 0; j -= 2) {
          let t1 = r ^ keys[j], t2 = ((r>>>4)|(r<<28)) ^ keys[j+1];
          temp = l; l = r;
          r = temp ^ (sp2[(t1>>>24)&0x3f]|sp4[(t1>>>16)&0x3f]|sp6[(t1>>>8)&0x3f]|sp8[t1&0x3f]|sp1[(t2>>>24)&0x3f]|sp3[(t2>>>16)&0x3f]|sp5[(t2>>>8)&0x3f]|sp7[t2&0x3f]);
        }
        temp = l; l = r; r = temp;
        // Final Permutation (FP)
        l = ((l>>>1)|(l<<31)); r = ((r>>>1)|(r<<31));
        temp = ((l>>>1)^r)&0x55555555; r ^= temp; l ^= (temp<<1);
        temp = ((r>>>8)^l)&0x00ff00ff; l ^= temp; r ^= (temp<<8);
        temp = ((r>>>2)^l)&0x33333333; l ^= temp; r ^= (temp<<2);
        temp = ((l>>>16)^r)&0x0000ffff; r ^= temp; l ^= (temp<<16);
        temp = ((l>>>4)^r)&0x0f0f0f0f; r ^= temp; l ^= (temp<<4);
        result.push((l>>>24)&0xff,(l>>>16)&0xff,(l>>>8)&0xff,l&0xff,(r>>>24)&0xff,(r>>>16)&0xff,(r>>>8)&0xff,r&0xff);
      }
      // Remove PKCS5 padding
      const padLen = result[result.length - 1];
      const unpadded = result.slice(0, result.length - padLen);
      const url = String.fromCharCode(...unpadded);
      // Upgrade to 320kbps
      return url.replace(/_96\.mp4/g, '_320.mp4').replace(/_160\.mp4/g, '_320.mp4').replace(/_96_p\.mp4/g, '_320.mp4');
    } catch (e) {
      console.warn("JioSaavn DES decryption error:", e);
      return null;
    }
  };

  // Title normalization helper for matching
  const normalizeTitle = (t) => (t || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // CORS-friendly JioSaavn resolution using fast parallel requests
  const fetchJioSaavnDirect = async (trackName, artistName, collectionName = '') => {
    const cleanTrack = (trackName || '').replace(/\(from.*?\)/gi, '').replace(/\[.*?\]/gi, '').trim();
    const mainArtist = artistName ? artistName.split(',')[0].trim() : '';

    const directJioUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&p=1&n=10&q=${encodeURIComponent(`${cleanTrack} ${mainArtist}`.trim())}`;
    const searchUrl = `https://saavn-api.vercel.app/search/songs?query=${encodeURIComponent(`${cleanTrack} ${mainArtist}`.trim())}`;

    try {
      const res = await Promise.any([
        fetch(directJioUrl, { signal: AbortSignal.timeout(2500) }).then(r => r.json()),
        fetch(searchUrl, { signal: AbortSignal.timeout(2500) }).then(r => r.json())
      ]);

      const items = Array.isArray(res) ? res : (res?.results || res?.data?.results || []);
      if (items.length > 0) {
        const matched = items[0];
        let streamUrl = matched.url || matched.media_preview_url || matched.previewUrl;
        if (matched.encrypted_media_url) {
          streamUrl = decryptJioSaavnUrl(matched.encrypted_media_url);
        }
        if (streamUrl) {
          streamUrl = streamUrl
            .replace('preview.saavncdn.com', 'aac.saavncdn.com')
            .replace('_96_p.mp4', '_320.mp4')
            .replace('_96.mp4', '_320.mp4')
            .replace('_160.mp4', '_320.mp4');
          const dur = matched.duration ? parseInt(matched.duration, 10) : 240;
          return { url: streamUrl, duration: dur };
        }
      }
    } catch (e) {
      // Parallel fetch timeout or failed — fallback to previewUrl
    }
    return null;
  };

  // 320kbps Full-Length Audio Resolver — tries backend + client-side APIs in parallel
  const fetchFullLengthAudio = async (trackName, artistName, collectionName = '', genre = '') => {
    // Create promises for both resolvers — race them in parallel
    const backendPromise = (async () => {
      try {
        const data = await streamApi.resolve(trackName, artistName, collectionName, genre);
        if (data && data.url) {
          console.log(`🎵 Backend resolved full-length for "${trackName}": ${data.url}`);
          return { url: data.url, duration: data.duration ? parseInt(data.duration, 10) : 240 };
        }
      } catch (e) {
        console.warn("Backend stream resolver error:", e);
      }
      throw new Error('Backend failed');
    })();

    const clientPromise = (async () => {
      try {
        const jioResult = await fetchJioSaavnDirect(trackName, artistName, collectionName);
        if (jioResult && jioResult.url) {
          return jioResult;
        }
      } catch (e) {
        console.warn("JioSaavn CORS API fallback error:", e);
      }
      throw new Error('Client-side JioSaavn failed');
    })();

    // Race both — whichever succeeds first wins
    try {
      return await Promise.any([backendPromise, clientPromise]);
    } catch (e) {
      console.warn("All full-length resolvers failed:", e);
      return null;
    }
  };


  const playNext = useCallback(() => {
    const currentQueue = queueRef.current;
    const currentIdx = queueIndexRef.current;
    
    if (!currentQueue || currentQueue.length === 0) {
      const query = currentTrack?.artistName || 'Telugu Hits';
      searchApi.search(query, 12).then(res => {
        if (res.results && res.results.length > 0) {
          playTrack(res.results[0], res.results, 0);
        }
      }).catch(console.error);
      return;
    }
    
    let nextIdx;
    if (isShuffleRef.current) {
      nextIdx = Math.floor(Math.random() * currentQueue.length);
    } else {
      nextIdx = (currentIdx + 1) % currentQueue.length;
    }
    
    setQueueIndex(nextIdx);
    queueIndexRef.current = nextIdx;
    const nextTrack = currentQueue[nextIdx];
    if (nextTrack) {
      playTrack(nextTrack, currentQueue, nextIdx);
    }
  }, [currentTrack]);

  const playPrev = useCallback(() => {
    const currentQueue = queueRef.current;
    const currentIdx = queueIndexRef.current;
    if (!currentQueue || currentQueue.length === 0) return;

    let prevIdx;
    if (isShuffleRef.current) {
      prevIdx = Math.floor(Math.random() * currentQueue.length);
    } else {
      prevIdx = (currentIdx - 1 + currentQueue.length) % currentQueue.length;
    }

    setQueueIndex(prevIdx);
    queueIndexRef.current = prevIdx;
    const prevTrack = currentQueue[prevIdx];
    if (prevTrack) {
      playTrack(prevTrack, currentQueue, prevIdx);
    }
  }, []);

  const playTrack = (track, trackList = null, index = 0) => {
    if (!track) return;
    
    const currentRequestId = ++playRequestIdRef.current;

    if (trackList && Array.isArray(trackList)) {
      setQueue(trackList);
      queueRef.current = trackList;
      setQueueIndex(index);
      queueIndexRef.current = index;
    } else if (queueRef.current.length === 0) {
      setQueue([track]);
      queueRef.current = [track];
      setQueueIndex(0);
      queueIndexRef.current = 0;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.ontimeupdate = null;
      audioRef.current.ondurationchange = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }

    let rawName = track.trackName || track.title || track.collectionName || 'Unknown Track';
    let cleanName = rawName
      .replace(/\(Original Motion Picture Soundtrack.*?\)/gi, '')
      .replace(/\(From ".*?"\)/gi, '')
      .replace(/- Single/gi, '')
      .replace(/- EP/gi, '')
      .replace(/\[.*?\]/gi, '')
      .trim();
    if (!cleanName) cleanName = rawName;

    const name = cleanName;
    const artist = track.artistName || '';

    // Synchronously resolve 320kbps full song stream in 0.01ms if encrypted_media_url or previewUrl exists
    let instant320Url = null;
    if (track.encrypted_media_url) {
      instant320Url = decryptJioSaavnUrl(track.encrypted_media_url);
    }
    if (!instant320Url && track.previewUrl && track.previewUrl.includes('.saavncdn.com')) {
      instant320Url = track.previewUrl
        .replace('preview.saavncdn.com', 'aac.saavncdn.com')
        .replace('_96_p.mp4', '_320.mp4')
        .replace('_96.mp4', '_320.mp4')
        .replace('_160.mp4', '_320.mp4');
    }
    if (!instant320Url && track.url && track.url.includes('.saavncdn.com')) {
      instant320Url = track.url
        .replace('_96_p.mp4', '_320.mp4')
        .replace('_96.mp4', '_320.mp4')
        .replace('_160.mp4', '_320.mp4');
    }

    const initialAudioSrc = instant320Url || track.previewUrl || track.streamUrl || '';

    const trackObj = {
      ...track,
      trackName: name,
      artistName: artist,
      collectionName: track.collectionName || name,
      artworkUrl: track.artworkUrl100 || track.artworkUrl,
      previewUrl: initialAudioSrc,
      isFullLength: !!instant320Url,
    };

    setCurrentTrack(trackObj);
    setIsFullLength(!!instant320Url);

    // Create & play audio SYNCHRONOUSLY (0ms delay!)
    const audio = new Audio(initialAudioSrc);
    audio.volume = volume;
    audioRef.current = audio;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: trackObj.trackName || 'Unknown Title',
        artist: trackObj.artistName || 'Unknown Artist',
        album: trackObj.collectionName || 'Unknown Album',
        artwork: [
          { src: trackObj.artworkUrl || 'https://ui-avatars.com/api/?name=Music&background=random', sizes: '500x500', type: 'image/jpeg' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        audio.play().then(() => setIsPlaying(true)).catch(console.error);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
        setIsPlaying(false);
      });
      navigator.mediaSession.setActionHandler('previoustrack', playPrev);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }

    if (trackObj.trackId) {
      analyticsApi.logPlay(trackObj.trackId).catch(e => console.error("Failed to log play", e));
    }

    const fullDurationSec = track.trackTimeMillis ? Math.floor(track.trackTimeMillis / 1000) : 210;
    setDuration(fullDurationSec);

    let virtualOffset = 0;
    let isFullLengthResolved = false;

    const updateDuration = () => {
      if (isFullLengthResolved && audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 60) {
        setDuration(Math.floor(audio.duration));
      }
    };

    const handleEnded = () => {
      if (currentRequestId !== playRequestIdRef.current) return;
      
      // If we have full-length audio, don't loop — just go next
      if (isFullLengthResolved) {
        setIsPlaying(false);
        setCurrentTime(0);
        if (isRepeatRef.current) {
          audio.currentTime = 0;
          audio.play().then(() => setIsPlaying(true)).catch(console.error);
        } else {
          playNext();
        }
        return;
      }
      
      const currentVirtualTotal = virtualOffset + (audio.duration || 30);

      if (currentVirtualTotal < fullDurationSec - 3) {
        // Seamlessly loop audio until FULL song duration is completed
        virtualOffset = currentVirtualTotal;
        audio.currentTime = 0;
        audio.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        // Song completed its FULL duration!
        setIsPlaying(false);
        setCurrentTime(0);
        virtualOffset = 0;
        if (isRepeatRef.current) {
          audio.currentTime = 0;
          virtualOffset = 0;
          audio.play().then(() => setIsPlaying(true)).catch(console.error);
        } else {
          playNext();
        }
      }
    };

    audio.onloadedmetadata = updateDuration;
    audio.ondurationchange = updateDuration;

    audio.ontimeupdate = () => {
      if (audioRef.current === audio) {
        if (isFullLengthResolved) {
          setCurrentTime(audio.currentTime);
        } else {
          const calculatedTime = Math.min(virtualOffset + audio.currentTime, fullDurationSec);
          setCurrentTime(calculatedTime);
        }
      }
    };

    audio.onended = handleEnded;

    // Try to resolve the CORRECT audio from iTunes by exact song name
    // ONLY used as a fallback preview — never overwrites full-length audio
    const resolveCorrectAudio = () => {
      // If full-length audio is already resolved, skip the iTunes preview resolver entirely
      if (isFullLengthResolved) {
        console.log(`⏭️ Skipping iTunes preview resolve — full-length already loaded for "${name}"`);
        return;
      }
      const searchTerms = artist ? `${name} ${artist}` : name;
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerms)}&entity=song&limit=15`)
        .then(res => res.json())
        .then(data => {
          // Re-check: if full-length resolved while we were fetching, bail out
          if (isFullLengthResolved) {
            console.log(`⏭️ iTunes preview result discarded — full-length already loaded for "${name}"`);
            return;
          }
          if (currentRequestId !== playRequestIdRef.current || !data.results || data.results.length === 0) return;
          
          const nameLower = name.toLowerCase().trim();
          
          // Priority 1: Exact track name match
          let matchedItem = data.results.find(item => item.previewUrl && 
            item.trackName && item.trackName.toLowerCase().trim() === nameLower
          );
          
          // Priority 2: Track name starts with the song name
          if (!matchedItem) {
            matchedItem = data.results.find(item => item.previewUrl && 
              item.trackName && item.trackName.toLowerCase().trim().startsWith(nameLower.substring(0, Math.min(nameLower.length, 10)))
            );
          }
          
          // Priority 3: Track name contains significant part of song name
          if (!matchedItem) {
            const significantPart = nameLower.substring(0, Math.min(nameLower.length, 8));
            matchedItem = data.results.find(item => item.previewUrl && 
              item.trackName && item.trackName.toLowerCase().includes(significantPart)
            );
          }
          
          // Priority 4: Any result with a previewUrl
          if (!matchedItem) {
            matchedItem = data.results.find(item => item.previewUrl);
          }

          // Final guard: do NOT overwrite if full-length was resolved during search
          if (isFullLengthResolved) return;

          if (matchedItem && matchedItem.previewUrl && audioRef.current === audio && currentRequestId === playRequestIdRef.current) {
            const liveUrl = matchedItem.previewUrl;
            // Only swap if we got a DIFFERENT (better) URL
            if (liveUrl !== initialAudioSrc) {
              const wasPlaying = !audio.paused;
              audio.src = liveUrl;
              // Do NOT reset virtualOffset — preserve accumulated loop progress
              audio.onended = handleEnded;
              if (wasPlaying) {
                audio.play().then(() => setIsPlaying(true)).catch(() => {});
              }
            }
          }
        })
        .catch(console.warn);
    };

    const recoverLiveStream = () => {
      // If full-length is already resolved, no need to recover
      if (isFullLengthResolved) return;
      
      const searchTerms = artist ? `${name} ${artist}` : name;
      fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerms)}&entity=song&limit=15`)
        .then(res => res.json())
        .then(data => {
          if (isFullLengthResolved) return;
          if (currentRequestId !== playRequestIdRef.current || !data.results || data.results.length === 0) return;
          
          const nameLower = name.toLowerCase().trim();
          
          // Find exact trackName match first
          let matchedItem = data.results.find(item => item.previewUrl && 
            item.trackName && item.trackName.toLowerCase().trim() === nameLower
          );
          
          if (!matchedItem) {
            const significantPart = nameLower.substring(0, Math.min(nameLower.length, 8));
            matchedItem = data.results.find(item => item.previewUrl && 
              item.trackName && item.trackName.toLowerCase().includes(significantPart)
            );
          }
          
          if (!matchedItem) {
            matchedItem = data.results.find(item => item.previewUrl);
          }

          if (matchedItem && matchedItem.previewUrl && audioRef.current === audio && !isFullLengthResolved) {
            const liveUrl = matchedItem.previewUrl;
            const testAudio = new Audio(liveUrl);
            testAudio.oncanplay = () => {
              if (isFullLengthResolved) return;
              if (currentRequestId === playRequestIdRef.current && audioRef.current === audio) {
                audio.src = liveUrl;
                virtualOffset = 0;
                audio.onended = handleEnded;
                audio.ontimeupdate = () => {
                  if (audioRef.current === audio) {
                    if (isFullLengthResolved) {
                      setCurrentTime(audio.currentTime);
                    } else {
                      setCurrentTime(Math.min(virtualOffset + audio.currentTime, fullDurationSec));
                    }
                  }
                };
                audio.play().then(() => setIsPlaying(true)).catch(() => {});
              }
            };
          }
        })
        .catch(console.warn);
    };

    audio.onerror = () => {
      console.warn("Audio 404/error, recovering live stream for:", name);
      recoverLiveStream();
    };

    if (initialAudioSrc) {
      audio.play().then(() => {
        setIsPlaying(true);
        // After starting playback, also resolve the correct song audio from iTunes
        // This fixes curated playlists like DSP Energy Hits where all tracks have the same previewUrl
        resolveCorrectAudio();
      }).catch(err => {
        console.warn("Initial audio play failed, recovering live stream:", err);
        setIsPlaying(false);
        recoverLiveStream();
      });
    } else {
      recoverLiveStream();
    }

    const collectionName = track.collectionName || track.album || '';
    const genre = track.primaryGenreName || track.genre || '';

    // Resolve 320kbps Full-Length (3-5 Minute) Audio Stream — this has HIGHEST PRIORITY
    fetchFullLengthAudio(name, artist, collectionName, genre).then(fullStream => {
      if (currentRequestId === playRequestIdRef.current && fullStream && fullStream.url && audioRef.current === audio) {
        // Mark as resolved FIRST so no other resolver can overwrite after this point
        isFullLengthResolved = true;
        setIsFullLength(true);
        
        const wasPlaying = !audio.paused;
        const prevTime = audio.currentTime;
        
        // Set the full-length source
        audio.src = fullStream.url;
        
        const resolvedDur = fullStream.duration ? parseInt(fullStream.duration, 10) : fullDurationSec;
        setDuration(resolvedDur);
        
        // Re-attach handlers for the new source
        audio.onended = handleEnded;
        audio.ontimeupdate = () => {
          if (audioRef.current === audio) {
            setCurrentTime(audio.currentTime);
          }
        };
        audio.onloadedmetadata = () => {
          // Update duration from actual audio metadata if available
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 60) {
            setDuration(Math.floor(audio.duration));
          }
        };
        
        // Wait for the new source to be ready before seeking and playing
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          if (currentRequestId !== playRequestIdRef.current || audioRef.current !== audio) return;
          
          // Seek to where the user was (clamped to the full song duration)
          const seekTarget = Math.min(prevTime, resolvedDur);
          if (seekTarget > 0.5) {
            audio.currentTime = seekTarget;
          }
          
          if (wasPlaying) {
            audio.play().then(() => setIsPlaying(true)).catch(() => {});
          }
        };
        audio.addEventListener('canplay', onCanPlay);
        
        console.log(`🎵 Full-length 320kbps loaded for "${name}" (${resolvedDur}s): ${fullStream.url}`);
      }
    }).catch(console.warn);
  };


  const toggleShuffle = () => setIsShuffle(prev => !prev);
  const toggleRepeat = () => setIsRepeat(prev => !prev);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seek = (timeSec) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeSec;
      setCurrentTime(timeSec);
    }
  };

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX - 24;
      if (newWidth >= 220 && newWidth <= 560) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading AuraMusic...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ user, setUser, handleLogin, handleLogout }}>
        <ToastContext.Provider value={{ addToast }}>
          <PlayerContext.Provider value={{
            currentTrack,
            isPlaying,
            currentTime,
            duration,
            volume,
            setVolume,
            playTrack,
            togglePlay,
            seek,
            playNext,
            playPrev,
            toggleShuffle,
            toggleRepeat,
            isShuffle,
            isRepeat,
            isFullLength,
            sidebarWidth,
            jamRoomCode,
            setJamRoomCode,
            isJamHost,
            setIsJamHost,
            jamConnectedUsers,
            setJamConnectedUsers,
            jamReactions,
            sendJamReaction,
            showJamModal,
            setShowJamModal,
          }}>
            <BrowserRouter>
              <div className="spotify-app-layout">
                <Navbar onAuthClick={() => setShowAuth(true)} />

                {/* Toast Notifications */}
                <div className="toast-container">
                  {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                      {t.message}
                    </div>
                  ))}
                </div>

                {/* Auth Modal Overlay */}
                {showAuth && !user && (
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AuthPage onClose={() => setShowAuth(false)} />
                  </div>
                )}

                {/* Onboarding Wizard */}
                {user && (!user.preferredLanguages || user.preferredLanguages.trim() === '') && (
                  <OnboardingWizard onComplete={async (formData) => {
                    try {
                      const updatedUser = await authApi.updatePreferences(formData);
                      setUser(updatedUser);
                      addToast('Preferences saved successfully! Tuning your feed...', 'success');
                    } catch (err) {
                      addToast('Failed to save preferences. Try again.', 'error');
                    }
                  }} />
                )}

                <div className="spotify-main-content-wrapper">
                  <main className="spotify-main-area">
                    <Routes>
                      <Route path="/" element={<SearchPage />} />
                      <Route path="/search" element={<SearchPage />} />
                      <Route path="/library" element={user ? <LibraryPage /> : <Navigate to="/" replace />} />
                      <Route path="/analytics" element={user ? <AnalyticsPage /> : <Navigate to="/" replace />} />
                      <Route path="/ai-insights" element={user ? <AiInsightsPage /> : <Navigate to="/" replace />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>

                  {/* Resizable Divider Bar */}
                  <div
                    className={`sidebar-resizer-bar ${isResizing ? 'resizing' : ''}`}
                    onMouseDown={startResizing}
                    title="Drag to resize sidebar"
                  />

                  {/* Right Artist Sidebar */}
                  <RightArtistSidebar width={sidebarWidth} />
                </div>

                {/* Persistent Bottom Player Bar — ONLY shown when user is not in onboarding/auth and a track is active */}
                {!showAuth && user?.preferredLanguages && currentTrack && <BottomPlayerBar />}

                {/* Live Jam Session Sync Modal */}
                {showJamModal && (
                  <JamSessionModal onClose={() => setShowJamModal(false)} />
                )}
              </div>
            </BrowserRouter>
          </PlayerContext.Provider>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}

function WelcomePage({ onGetStarted }) {
  return (
    <div className="welcome-container fade-in">
      <h1>SonicVault</h1>
      <p>
        Search the world's music catalog, build your personal library, 
        explore stunning analytics, and unlock AI-powered musical insights.
      </p>
      <button className="btn btn-primary btn-lg" onClick={onGetStarted}>
        Get Started
      </button>
      <div className="welcome-features">
        <div className="welcome-feature">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <h3>Discover</h3>
          <p>Search millions of albums from the iTunes catalog</p>
        </div>
        <div className="welcome-feature">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          <h3>Curate</h3>
          <p>Build and rate your personal album library</p>
        </div>
        <div className="welcome-feature">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
          <h3>Analyze</h3>
          <p>Rich analytics dashboard with beautiful charts</p>
        </div>
        <div className="welcome-feature">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>
          <h3>AI Insights</h3>
          <p>Get AI-powered music taste analysis</p>
        </div>
      </div>
    </div>
  );
}

export default App;
