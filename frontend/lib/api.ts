const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// Auth
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    request<{ token: string; username: string; email: string; message: string }>('/api/auth/register', { method: 'POST', body: data }),

  login: (data: { username: string; password: string }) =>
    request<{ token: string; username: string; email: string; message: string }>('/api/auth/login', { method: 'POST', body: data }),
};

// Search
export const searchApi = {
  search: (query: string, type: string = 'album', limit: number = 25) =>
    request<{ resultCount: number; results: Album[] }>(`/api/search?query=${encodeURIComponent(query)}&type=${type}&limit=${limit}`),
};

// Library
export const libraryApi = {
  getAll: (token: string, page: number = 0, size: number = 20) =>
    request<PaginatedResponse<LibraryAlbum>>(`/api/library?page=${page}&size=${size}`, { token }),

  save: (token: string, data: SaveAlbumData) =>
    request<LibraryAlbum>('/api/library', { method: 'POST', body: data, token }),

  update: (token: string, id: number, data: { userRating?: number; userNotes?: string }) =>
    request<LibraryAlbum>(`/api/library/${id}`, { method: 'PUT', body: data, token }),

  delete: (token: string, id: number) =>
    request<{ message: string }>(`/api/library/${id}`, { method: 'DELETE', token }),

  analytics: (token: string) =>
    request<AnalyticsData>('/api/library/analytics', { token }),

  aiInsights: (token: string) =>
    request<AIInsights>('/api/library/ai-insights', { token }),
};

// Types
export interface Album {
  collectionId: number;
  trackId?: number;
  artistName: string;
  collectionName: string;
  trackName?: string;
  collectionPrice: number;
  trackPrice?: number;
  releaseDate: string;
  trackCount: number;
  primaryGenreName: string;
  artworkUrl100: string;
  artworkUrl60?: string;
  collectionViewUrl?: string;
  wrapperType: string;
  previewUrl?: string;
}

export interface LibraryAlbum {
  id: number;
  appleCatalogId: number;
  title: string;
  artistName: string;
  genre: string;
  releaseDate: string;
  trackCount: number;
  artworkUrl: string;
  collectionPrice: number;
  userRating: number | null;
  userNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveAlbumData {
  appleCatalogId: number;
  title: string;
  artistName: string;
  genre: string;
  releaseDate: string;
  trackCount: number;
  artworkUrl: string;
  collectionPrice: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface AnalyticsData {
  totalAlbums: number;
  totalArtists: number;
  totalGenres: number;
  averageRating: number;
  totalValue: number;
  genreDistribution: ChartData[];
  releasesByYear: ChartData[];
  ratingDistribution: ChartData[];
  topArtists: ChartData[];
  libraryGrowth: ChartData[];
}

export interface AIInsights {
  summary: string;
  insights: string[];
  recommendations: string[];
  profile: {
    dominantGenre: string;
    dominantEra: string;
    genreDiversityScore: number;
    favoriteArtist: string;
    totalUniqueArtists: number;
    totalUniqueGenres: number;
  } | null;
}
