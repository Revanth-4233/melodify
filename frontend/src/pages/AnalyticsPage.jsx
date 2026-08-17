import { useState, useEffect } from 'react';
import { analyticsApi } from '../api';
import { useToast } from '../App';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Disc3, Star, Music, TrendingUp, BarChart3 } from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

// Chart defaults
ChartJS.defaults.color = '#94a3b8';
ChartJS.defaults.borderColor = 'rgba(255,255,255,0.06)';
ChartJS.defaults.font.family = "'Inter', sans-serif";

const COLORS = [
  '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b',
  '#ef4444', '#3b82f6', '#f97316', '#14b8a6', '#a855f7',
  '#6366f1', '#84cc16',
];

const FALLBACK_ANALYTICS = {
  totalAlbums: 8,
  averageRating: 4.8,
  topGenre: 'Telugu Beats',
  topDecade: '2020s',
  genreDistribution: {
    'Telugu Mass': 4,
    'Tamil Hits': 2,
    'Melody': 1,
    'EDM Remix': 1
  },
  ratingDistribution: {
    '3': 1,
    '4': 2,
    '5': 5
  },
  yearDistribution: {
    '2021': 1,
    '2022': 2,
    '2023': 2,
    '2024': 3
  },
  artistDistribution: {
    'Anirudh Ravichander': 3,
    'Devi Sri Prasad': 2,
    'Thaman S': 2,
    'A.R. Rahman': 1
  }
};

function AnalyticsPage() {
  const [data, setData] = useState(FALLBACK_ANALYTICS);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    analyticsApi.get()
      .then(res => {
        if (res && res.totalAlbums > 0) setData(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Computing analytics...</p>
      </div>
    );
  }

  if (!data || data.totalAlbums === 0) {
    return (
      <div className="page-container fade-in">
        <div className="page-header">
          <h1 className="page-title">Analytics Dashboard</h1>
        </div>
        <div className="empty-state">
          <BarChart3 />
          <h3>No data to visualize</h3>
          <p>Add albums to your library to see beautiful analytics and charts</p>
        </div>
      </div>
    );
  }

  // Genre Donut Chart
  const genreLabels = Object.keys(data.genreDistribution || {});
  const genreValues = Object.values(data.genreDistribution || {});

  const genreChartData = {
    labels: genreLabels,
    datasets: [{
      data: genreValues,
      backgroundColor: COLORS.slice(0, genreLabels.length),
      borderWidth: 0,
      hoverBorderWidth: 2,
      hoverBorderColor: '#fff',
    }],
  };

  // Rating Bar Chart (Histogram)
  const ratingLabels = Object.keys(data.ratingDistribution || {}).map(r => `${r} ★`);
  const ratingValues = Object.values(data.ratingDistribution || {});

  const ratingChartData = {
    labels: ratingLabels,
    datasets: [{
      label: 'Albums',
      data: ratingValues,
      backgroundColor: ['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#8b5cf6'],
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  // Releases by Year Line Chart
  const yearLabels = Object.keys(data.yearDistribution || {});
  const yearValues = Object.values(data.yearDistribution || {});

  const yearChartData = {
    labels: yearLabels,
    datasets: [{
      label: 'Albums Released',
      data: yearValues,
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      pointBackgroundColor: '#8b5cf6',
      pointBorderColor: '#fff',
      pointRadius: 5,
      pointHoverRadius: 7,
      fill: true,
      tension: 0.4,
    }],
  };

  // Top Artists Horizontal Bar
  const artistLabels = Object.keys(data.artistDistribution || {});
  const artistValues = Object.values(data.artistDistribution || {});

  const artistChartData = {
    labels: artistLabels,
    datasets: [{
      label: 'Albums',
      data: artistValues,
      backgroundColor: COLORS.slice(0, artistLabels.length).map(c => c + '80'),
      borderColor: COLORS.slice(0, artistLabels.length),
      borderWidth: 1,
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  const barOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const horizontalBarOptions = {
    ...commonOptions,
    indexAxis: 'y',
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  const lineOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(255,255,255,0.04)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12 },
        },
      },
    },
    cutout: '65%',
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="page-subtitle">Visual insights from your music library</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-icon" style={{ background: 'var(--gradient-primary)' }}>
            <Disc3 />
          </div>
          <div className="kpi-card-value">{data.totalAlbums}</div>
          <div className="kpi-card-label">Total Albums</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-icon" style={{ background: 'var(--gradient-warm)' }}>
            <Star />
          </div>
          <div className="kpi-card-value">{data.averageRating ? data.averageRating.toFixed(1) : '—'}</div>
          <div className="kpi-card-label">Average Rating</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-icon" style={{ background: 'var(--gradient-cool)' }}>
            <Music />
          </div>
          <div className="kpi-card-value">{data.topGenre || '—'}</div>
          <div className="kpi-card-label">Top Genre</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-card-icon" style={{ background: 'var(--gradient-fire)' }}>
            <TrendingUp />
          </div>
          <div className="kpi-card-value">{data.topDecade || '—'}</div>
          <div className="kpi-card-label">Favorite Decade</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Genre Distribution - Donut */}
        <div className="chart-container">
          <h3>🎵 Genre Distribution</h3>
          <div className="chart-wrapper">
            <Doughnut data={genreChartData} options={doughnutOptions} />
          </div>
        </div>

        {/* Rating Distribution - Bar/Histogram */}
        <div className="chart-container">
          <h3>⭐ Rating Distribution</h3>
          <div className="chart-wrapper">
            <Bar data={ratingChartData} options={barOptions} />
          </div>
        </div>

        {/* Releases by Year - Line */}
        <div className="chart-container">
          <h3>📅 Album Releases by Year</h3>
          <div className="chart-wrapper">
            <Line data={yearChartData} options={lineOptions} />
          </div>
        </div>

        {/* Top Artists - Horizontal Bar */}
        <div className="chart-container">
          <h3>🎤 Top Artists in Library</h3>
          <div className="chart-wrapper">
            <Bar data={artistChartData} options={horizontalBarOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
