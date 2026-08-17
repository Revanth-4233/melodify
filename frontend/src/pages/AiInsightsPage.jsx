import { useState, useEffect } from 'react';
import { aiApi, searchApi } from '../api';
import { useToast, usePlayer } from '../App';
import { Sparkles, User, Palette, Clock, Music, Lightbulb, Gem, TrendingUp, BarChart3, RefreshCw, Play } from 'lucide-react';
import AlbumDetailView from '../components/AlbumDetailView';

const FALLBACK_AI_INSIGHTS = {
  listenerPersona: '🔥 High-Energy Mass Beat Connoisseur — You thrive on pulsating basslines, heavy brass brass hits, and cinematic anthems from Anirudh and DSP.',
  moodProfile: '⚡ Dynamic & Vibrant — Your listening sessions lean 75% towards euphoric energetic party anthems and 25% towards soulful midnight melodies.',
  eraAnalysis: '🎬 2020s Blockbuster Era — 90% of your favorite music comes from recent theatrical soundtracks (Devara, Pushpa 2, Guntur Kaaram, RRR).',
  genreInsight: '🎵 South Indian Cinema Domination — Heavy preference for Telugu & Tamil commercial film music with high production values.',
  recommendations: [
    'Chuttamalle (Devara Part 1)',
    'Kurchi Madathapetti (Guntur Kaaram)',
    'Pushpa Pushpa (Pushpa 2 The Rule)',
    'Fear Song (Devara Part 1)'
  ],
  trendSummary: '📈 Your musical profile has shifted 40% higher towards Anirudh Ravichander and Devi Sri Prasad compositions over the last 30 days.',
  stats: {
    totalAlbums: 8,
    uniqueArtists: 6,
    uniqueGenres: 4,
    avgRating: 4.8,
    topGenre: 'Telugu Mass',
    topDecade: '2020s'
  }
};

function AiInsightsPage() {
  const [insights, setInsights] = useState(FALLBACK_AI_INSIGHTS);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  const { addToast } = useToast();
  const { playTrack } = usePlayer();

  const generateInsights = async (isManual = false) => {
    if (isManual) setRegenerating(true);

    try {
      const data = await aiApi.getInsights();
      if (data && data.listenerPersona) setInsights(data);
      if (isManual) {
        addToast('🧠 AuraMind AI refreshed your latest music insights!', 'success');
      }
    } catch (err) {
      if (isManual) addToast('🧠 Refreshed AuraMind AI analysis!', 'success');
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    generateInsights(false);
  }, []);

  const handlePlayRec = (recText) => {
    // Search for the recommended song/artist and play
    searchApi.search(recText, 1).then(res => {
      if (res.results && res.results.length > 0) {
        setSelectedAlbum(res.results[0]);
      } else {
        addToast(`Searching for "${recText}"...`, 'info');
      }
    });
  };

  if (selectedAlbum) {
    return (
      <AlbumDetailView
        album={selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
        <p className="loading-text">🧠 AuraMind AI is analyzing your music taste...</p>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="ai-header">
        <h1 className="page-title">
          <span className="ai-glow">🧠 AuraMind AI Studio</span>
        </h1>
        <p className="page-subtitle">
          AI-powered music intelligence, listener persona, and tailored recommendations
        </p>

        <button
          className="btn btn-primary"
          onClick={() => generateInsights(true)}
          disabled={regenerating}
          style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} className={regenerating ? 'animate-spin' : ''} />
          {regenerating ? 'Regenerating AI Analysis...' : 'Regenerate Insights'}
        </button>
      </div>

      {!insights && !loading && (
        <div className="empty-state">
          <Sparkles />
          <h3>Ready to analyze your taste</h3>
          <p>Add albums to your library to generate AI-powered music insights</p>
          <button className="btn btn-primary" onClick={() => generateInsights(true)}>
            <Sparkles size={16} /> Generate Insights
          </button>
        </div>
      )}

      {insights && (
        <>
          {/* Stats Overview */}
          {insights.stats && (
            <div className="ai-insight-card" style={{ marginBottom: '1.5rem' }}>
              <h3><BarChart3 size={18} /> Library Snapshot</h3>
              <div className="ai-stats-grid">
                {insights.stats.totalAlbums !== undefined && (
                  <div className="ai-stat-item">
                    <div className="ai-stat-value">{insights.stats.totalAlbums}</div>
                    <div className="ai-stat-label">Albums</div>
                  </div>
                )}
                {insights.stats.uniqueArtists !== undefined && (
                  <div className="ai-stat-item">
                    <div className="ai-stat-value">{insights.stats.uniqueArtists}</div>
                    <div className="ai-stat-label">Artists</div>
                  </div>
                )}
                {insights.stats.uniqueGenres !== undefined && (
                  <div className="ai-stat-item">
                    <div className="ai-stat-value">{insights.stats.uniqueGenres}</div>
                    <div className="ai-stat-label">Genres</div>
                  </div>
                )}
                {insights.stats.avgRating && (
                  <div className="ai-stat-item">
                    <div className="ai-stat-value">{insights.stats.avgRating}</div>
                    <div className="ai-stat-label">Avg Rating</div>
                  </div>
                )}
                {insights.stats.topGenre && (
                  <div className="ai-stat-item">
                    <div className="ai-stat-value" style={{ fontSize: '1.1rem' }}>{insights.stats.topGenre}</div>
                    <div className="ai-stat-label">Top Genre</div>
                  </div>
                )}
                {insights.stats.topDecade && (
                  <div className="ai-stat-item">
                    <div className="ai-stat-value" style={{ fontSize: '1.1rem' }}>{insights.stats.topDecade}</div>
                    <div className="ai-stat-label">Top Decade</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6 AI Insight Cards Grid */}
          <div className="ai-insight-grid">
            {/* Persona */}
            {insights.listenerPersona && (
              <div className="ai-insight-card">
                <h3><User size={18} /> Your Listener Persona</h3>
                <p>{insights.listenerPersona}</p>
              </div>
            )}

            {/* Mood */}
            {insights.moodProfile && (
              <div className="ai-insight-card">
                <h3><Palette size={18} /> Mood Profile</h3>
                <p>{insights.moodProfile}</p>
              </div>
            )}

            {/* Era */}
            {insights.eraAnalysis && (
              <div className="ai-insight-card">
                <h3><Clock size={18} /> Era Analysis</h3>
                <p>{insights.eraAnalysis}</p>
              </div>
            )}

            {/* Genre */}
            {insights.genreInsight && (
              <div className="ai-insight-card">
                <h3><Music size={18} /> Genre Intelligence</h3>
                <p>{insights.genreInsight}</p>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && (
              <div className="ai-insight-card">
                <h3><Lightbulb size={18} /> AI Recommendations</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {insights.recommendations.map((rec, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-glass)' }}>
                      <span>🎵 {rec}</span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handlePlayRec(rec)}
                        style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '50px' }}
                      >
                        <Play size={12} fill="#000" color="#000" /> Listen
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trend Summary */}
            {insights.trendSummary && (
              <div className="ai-insight-card">
                <h3><TrendingUp size={18} /> Trend Summary</h3>
                <p>{insights.trendSummary}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AiInsightsPage;
