'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { libraryApi, AnalyticsData, AIInsights } from '@/lib/api';
import Navbar from '@/components/Navbar';
import { ToastProvider, useToast } from '@/components/Toast';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#7c3aed', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
                '#8b5cf6', '#f472b6', '#22d3ee', '#34d399', '#fbbf24', '#fb7185'];

const chartTooltipStyle = {
  backgroundColor: '#1a1a3e',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#f1f5f9',
  fontSize: '0.85rem',
};

function AnalyticsContent() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user?.token) return;

    setLoading(true);
    setAiLoading(true);

    try {
      const [analyticsData, insightsData] = await Promise.all([
        libraryApi.analytics(user.token),
        libraryApi.aiInsights(user.token),
      ]);
      setAnalytics(analyticsData);
      setAiInsights(insightsData);
    } catch {
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  }, [user?.token, showToast]);

  useEffect(() => {
    if (user?.token) fetchData();
  }, [user?.token, fetchData]);

  if (authLoading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Loading analytics...</p>
          </div>
        </div>
      </>
    );
  }

  if (!analytics || analytics.totalAlbums === 0) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">Analytics Dashboard</h1>
          </div>
          <div className="empty-state animate-fade-in">
            <div className="empty-icon">📊</div>
            <h3 className="empty-title">No data to analyze</h3>
            <p className="empty-text">Add some albums to your library first to see analytics and AI insights</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => router.push('/search')}>
              🔍 Search Albums
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Insights into your music collection</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid animate-fade-in">
          <div className="stat-card">
            <div className="stat-value">{analytics.totalAlbums}</div>
            <div className="stat-label">Total Albums</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.totalArtists}</div>
            <div className="stat-label">Unique Artists</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.totalGenres}</div>
            <div className="stat-label">Genres</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.averageRating > 0 ? `${analytics.averageRating}★` : '—'}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${analytics.totalValue || 0}</div>
            <div className="stat-label">Library Value</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid animate-slide-up">
          {/* 1. Genre Distribution - Pie/Donut Chart */}
          {analytics.genreDistribution && analytics.genreDistribution.length > 0 && (
            <div className="chart-card">
              <h3 className="chart-title">🎭 Genre Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.genreDistribution}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={2}
                    label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {analytics.genreDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 2. Releases by Year - Bar Chart */}
          {analytics.releasesByYear && analytics.releasesByYear.length > 0 && (
            <div className="chart-card">
              <h3 className="chart-title">📅 Releases by Year</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.releasesByYear}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="value" name="Albums" radius={[4, 4, 0, 0]}>
                    {analytics.releasesByYear.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 3. Rating Distribution - Histogram */}
          {analytics.ratingDistribution && analytics.ratingDistribution.length > 0 && (
            <div className="chart-card">
              <h3 className="chart-title">⭐ Rating Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="value" name="Albums" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 4. Top Artists - Horizontal Bar Chart */}
          {analytics.topArtists && analytics.topArtists.length > 0 && (
            <div className="chart-card">
              <h3 className="chart-title">🎤 Top Artists</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topArtists} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar dataKey="value" name="Albums" radius={[0, 4, 4, 0]}>
                    {analytics.topArtists.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 5. Library Growth - Line Chart */}
          {analytics.libraryGrowth && analytics.libraryGrowth.length > 0 && (
            <div className="chart-card">
              <h3 className="chart-title">📈 Library Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.libraryGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Albums Added"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{ fill: '#7c3aed', r: 5 }}
                    activeDot={{ r: 7, stroke: '#ec4899', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* AI Insights Section */}
        <div className="ai-section animate-slide-up">
          <div className="page-header" style={{ marginTop: '2rem' }}>
            <h2 className="page-title" style={{ fontSize: '1.6rem' }}>🤖 AI Insights</h2>
            <p className="page-subtitle">Personalized analysis of your music library</p>
          </div>

          {aiLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Generating AI insights...</p>
            </div>
          ) : aiInsights ? (
            <>
              {/* Summary Card */}
              <div className="ai-card" style={{ marginBottom: '1.5rem' }}>
                <div className="ai-badge">✨ AI Analysis</div>
                <p className="ai-summary">{aiInsights.summary}</p>

                {aiInsights.profile && (
                  <div className="profile-grid">
                    <div className="profile-stat">
                      <div className="profile-stat-value">{aiInsights.profile.dominantGenre}</div>
                      <div className="profile-stat-label">Top Genre</div>
                    </div>
                    <div className="profile-stat">
                      <div className="profile-stat-value">{aiInsights.profile.dominantEra}</div>
                      <div className="profile-stat-label">Favorite Era</div>
                    </div>
                    <div className="profile-stat">
                      <div className="profile-stat-value">{aiInsights.profile.genreDiversityScore}/100</div>
                      <div className="profile-stat-label">Diversity Score</div>
                    </div>
                    <div className="profile-stat">
                      <div className="profile-stat-value">{aiInsights.profile.favoriteArtist}</div>
                      <div className="profile-stat-label">Top Artist</div>
                    </div>
                    <div className="profile-stat">
                      <div className="profile-stat-value">{aiInsights.profile.totalUniqueArtists}</div>
                      <div className="profile-stat-label">Artists</div>
                    </div>
                    <div className="profile-stat">
                      <div className="profile-stat-value">{aiInsights.profile.totalUniqueGenres}</div>
                      <div className="profile-stat-label">Genres</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Insights */}
              {aiInsights.insights && aiInsights.insights.length > 0 && (
                <div className="ai-card" style={{ marginBottom: '1.5rem' }}>
                  <div className="ai-badge">💡 Insights</div>
                  <ul className="ai-insights-list">
                    {aiInsights.insights.map((insight, i) => (
                      <li key={i} className="ai-insight-item"
                        dangerouslySetInnerHTML={{
                          __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#a78bfa">$1</strong>')
                        }}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                <div className="ai-card">
                  <div className="ai-badge">🎯 Recommendations</div>
                  <div className="ai-recs-grid">
                    {aiInsights.recommendations.map((rec, i) => (
                      <div key={i} className="ai-rec-card"
                        dangerouslySetInnerHTML={{
                          __html: rec.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#a78bfa">$1</strong>')
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default function AnalyticsPage() {
  return (
    <ToastProvider>
      <AnalyticsContent />
    </ToastProvider>
  );
}
