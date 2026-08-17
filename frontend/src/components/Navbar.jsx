import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, usePlayer } from '../App';
import { Search, Library, BarChart3, Sparkles, Disc3, Radio } from 'lucide-react';

function Navbar({ onAuthClick }) {
  const { user, handleLogout } = useAuth();
  const { setShowJamModal, jamRoomCode } = usePlayer();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/search', label: 'Search', icon: Search },
    { path: '/library', label: 'Library', icon: Library },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/ai-insights', label: 'AI Insights', icon: Sparkles },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate(user ? '/search' : '/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <img 
          src="/auramusic_logo.png" 
          alt="AuraMusic Logo" 
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
            border: '1px solid rgba(255,255,255,0.2)'
          }} 
        />
        <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>
          Aura<span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Music</span>
        </span>
      </div>

      <ul className="navbar-nav">
        {navItems.map(item => (
          <li key={item.path}>
            <button
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => {
                if (!user && (item.path === '/library' || item.path === '/analytics' || item.path === '/ai-insights')) {
                  onAuthClick();
                } else {
                  navigate(item.path);
                }
              }}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="navbar-user">
        {user ? (
          <>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowJamModal(true)}
              style={{
                borderRadius: '50px',
                padding: '6px 16px',
                background: jamRoomCode ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(139, 92, 246, 0.25))' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-glow)',
                color: 'white',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="SonicSync — Live Jam with Friends"
            >
              <Radio size={16} color={jamRoomCode ? 'var(--neon-cyan)' : '#ffffff'} className={jamRoomCode ? 'ai-glow' : ''} />
              {jamRoomCode ? `🟢 ${jamRoomCode}` : 'Live Jam'}
            </button>

            <div className="user-badge">
              <div className="user-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              {user.username}
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onAuthClick}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
