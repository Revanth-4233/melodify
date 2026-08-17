import { useState } from 'react';
import { authApi } from '../api';
import { useAuth, useToast } from '../App';
import { ArrowLeft, Smartphone } from 'lucide-react';

function AuthPage({ onClose }) {
  const [view, setView] = useState('welcome'); // 'welcome', 'login', 'register'
  const [loading, setLoading] = useState(false);
  const { handleLogin } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    username: '', email: '', password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const rawInput = (formData.email || formData.username || '').trim();
    const cleanEmail = rawInput.replace(/\s+/g, '');
    const cleanPassword = (formData.password || '').trim();

    try {
      if (view === 'login') {
        const usernameCandidate = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
        try {
          // Attempt 1: Try with derived username (e.g., 'mukeshrevanth94' from 'mukeshrevanth94@gmail.com')
          const data = await authApi.login({ username: usernameCandidate, password: cleanPassword });
          handleLogin(data);
        } catch (err1) {
          // Attempt 2: Try with full email / raw input directly
          const data = await authApi.login({ username: cleanEmail, password: cleanPassword });
          handleLogin(data);
        }
      } else {
        const derivedUsername = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
        const data = await authApi.register({
          username: derivedUsername,
          email: cleanEmail,
          password: cleanPassword
        });
        handleLogin(data);
      }
    } catch (err) {
      addToast(err.message || (view === 'login' ? 'Login failed' : 'Registration failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'welcome') {
    return (
      <div className="auth-mobile-container" style={{ justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <img 
            src="/auramusic_logo.png" 
            alt="AuraMusic Logo" 
            style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              margin: '0 auto 16px', display: 'block',
              boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)',
              border: '2px solid rgba(255,255,255,0.2)'
            }} 
          />
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>Millions of songs.</h1>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Free on AuraMusic.</h1>
        </div>

        <div className="auth-social-buttons" style={{ gap: '16px' }}>
          <button 
            className="btn-modern-primary" 
            style={{ marginBottom: '0', background: 'linear-gradient(135deg, #00e5ff, #b300ff)' }} 
            onClick={() => setView('register')}
          >
            Create Account
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}
            onClick={() => setView('login')}
          >
            Log in
          </button>
          {onClose && (
            <button 
              style={{ background: 'transparent', border: 'none', color: '#b3b3b3', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
              onClick={onClose}
            >
              Continue as Guest ➔
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-mobile-container">
      <div className="auth-mobile-header">
        <button className="back-button" onClick={() => setView('welcome')}>
          <ArrowLeft size={24} />
        </button>
        <h2>{view === 'login' ? 'Log in' : 'Create account'}</h2>
      </div>

      <div className="auth-mobile-content">
        <form onSubmit={handleSubmit}>
          
          <div className="input-group-modern">
            <label>{view === 'login' ? "Email or Username" : "What's your email address?"}</label>
            <input 
              type={view === 'login' ? "text" : "email"} 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value, username: e.target.value})}
              required
              autoCapitalize="none"
              autoCorrect="off"
            />
            {view === 'register' && <p className="input-hint">You'll need to confirm this email later.</p>}
          </div>

          <div className="input-group-modern">
            <label>Password</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-modern-primary" disabled={loading} style={{ marginTop: '24px', background: 'linear-gradient(135deg, #00e5ff, #b300ff)' }}>
            {loading ? 'Processing...' : (view === 'login' ? 'Log in' : 'Continue')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
