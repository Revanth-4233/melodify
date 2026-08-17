import { Capacitor } from '@capacitor/core';

export const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Mobile Native App (Android/iOS APK)
  if (typeof window !== 'undefined' && (Capacitor?.isNativePlatform() || window.Capacitor?.isNativePlatform())) {
    return 'https://melodify-backend.onrender.com/api';
  }
  // Local Web Development (localhost / 127.0.0.1)
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return '/api';
  }
  // Deployed Web App (Render)
  return 'https://melodify-backend.onrender.com/api';
};

const API_BASE = {
  toString: () => getApiBase()
};

const getToken = () => localStorage.getItem('token');

const headers = (isJson = true) => {
  const h = {
    'Bypass-Tunnel-Reminder': 'true',
    'bypass-tunnel-reminder': 'true'
  };
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (isJson) h['Content-Type'] = 'application/json';
  return h;
};

const fetchWithTimeout = async (url, options = {}, timeoutMs = 25000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

const handleResponse = async (res) => {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const text = await res.text();
    if (text.includes('localtunnel') || text.includes('Tunnel Reminder') || text.includes('Click to Continue')) {
      throw new Error('Please open https://sonicvault-api-live.loca.lt once in your phone Chrome browser and tap "Click to Continue"!');
    }
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export const authApi = {
  register: (data) =>
    fetchWithTimeout(`${getApiBase()}/auth/register`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  login: (data) =>
    fetchWithTimeout(`${getApiBase()}/auth/login`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  me: () =>
    fetchWithTimeout(`${getApiBase()}/auth/me`, { headers: headers(false) }).then(handleResponse),

  updatePreferences: (data) =>
    fetch(`${getApiBase()}/auth/preferences`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    }).then(handleResponse),
};

export const searchApi = {
  search: (query, limit = 25, entity = 'album') =>
    fetchWithTimeout(`${API_BASE}/search?query=${encodeURIComponent(query)}&limit=${limit}&entity=${entity}`, {
      headers: headers(),
    }, 25000).then(handleResponse),

  getAlbumTracks: (id) =>
    fetchWithTimeout(`${API_BASE}/album/${id}/tracks`, {
      headers: headers(),
    }, 25000).then(handleResponse),
};

export const recommendationsApi = {
  getRecommendations: () =>
    fetchWithTimeout(`${API_BASE}/recommendations`, {
      headers: headers(),
    }, 25000).then(handleResponse),
};

export const libraryApi = {
  getAll: (page = 0, size = 50, sortBy = 'createdAt', direction = 'desc') =>
    fetchWithTimeout(
      `${API_BASE}/library?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`,
      { headers: headers() },
      25000
    ).then(handleResponse),

  add: (data) =>
    fetchWithTimeout(`${API_BASE}/library`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  update: (id, data) =>
    fetchWithTimeout(`${API_BASE}/library/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (id) =>
    fetchWithTimeout(`${API_BASE}/library/${id}`, {
      method: 'DELETE',
      headers: headers(),
    }).then(handleResponse),
};

export const analyticsApi = {
  get: () =>
    fetchWithTimeout(`${API_BASE}/analytics`, { headers: headers() }, 25000).then(handleResponse),
  logPlay: (songId) =>
    fetchWithTimeout(`${API_BASE}/analytics/play`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ songId }),
    }).then(handleResponse),
};

export const aiApi = {
  getInsights: (query = '') =>
    fetchWithTimeout(`${API_BASE}/ai/insights`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ query }),
    }).then(handleResponse),
};

export const jamApi = {
  create: () =>
    fetchWithTimeout(`${API_BASE}/jam/create`, {
      method: 'POST',
      headers: headers(),
    }).then(handleResponse),

  join: (roomCode) =>
    fetchWithTimeout(`${API_BASE}/jam/join?roomCode=${encodeURIComponent(roomCode)}`, {
      method: 'POST',
      headers: headers(),
    }).then(handleResponse),

  sync: (roomCode, currentTrack, isPlaying, currentTime) =>
    fetchWithTimeout(`${API_BASE}/jam/sync`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ roomCode, currentTrack, isPlaying, currentTime }),
    }, 2000).then(handleResponse),

  getState: (roomCode) =>
    fetchWithTimeout(`${API_BASE}/jam/state/${encodeURIComponent(roomCode)}`, {
      headers: headers(),
    }, 2000).then(handleResponse),

  sendReaction: (roomCode, emoji) =>
    fetchWithTimeout(`${API_BASE}/jam/reaction`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ roomCode, emoji }),
    }).then(handleResponse),
};

export const streamApi = {
  resolve: (trackName, artistName = '', collectionName = '', language = '') =>
    fetchWithTimeout(
      `${API_BASE}/stream/resolve?trackName=${encodeURIComponent(trackName)}&artistName=${encodeURIComponent(artistName)}&collectionName=${encodeURIComponent(collectionName)}&language=${encodeURIComponent(language)}`,
      { headers: headers() },
      30000
    ).then(handleResponse),
};

export const playlistApi = {
  getAll: () =>
    fetchWithTimeout(`${API_BASE}/playlists`, { headers: headers() }, 3000)
      .then(handleResponse)
      .catch(() => []),

  addLiked: (trackPayload) =>
    fetch(`${API_BASE}/playlists/liked`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(trackPayload),
    }).then(handleResponse),

  removeLiked: (trackId) =>
    fetch(`${API_BASE}/playlists/liked/${encodeURIComponent(trackId)}`, {
      method: 'DELETE',
      headers: headers(),
    }).then(handleResponse),

  addSongToPlaylist: (playlistId, trackPayload) =>
    fetch(`${API_BASE}/playlists/${encodeURIComponent(playlistId)}/songs`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(trackPayload),
    }).then(handleResponse),
};
