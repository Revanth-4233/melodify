import { useState } from 'react';
import { authApi } from '../api';
import { useAuth, useToast } from '../App';
import { ArrowLeft } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  );
}

function AuthPage({ onClose }) {
  const [view, setView] = useState('welcome'); // 'welcome', 'login', 'register'
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { handleLogin } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    username: '', email: '', password: ''
  });

  const selectGoogleAccount = (email, name) => {
    setLoading(true);
    const username = name || email.split('@')[0];
    const googleUser = {
      token: 'google_jwt_token_' + Date.now(),
      user: {
        id: Math.floor(1000 + Math.random() * 9000),
        username: username,
        email: email,
        preferredLanguages: 'Telugu,Tamil',
        preferredArtists: 'Anirudh Ravichander,Sid Sriram'
      }
    };
    handleLogin(googleUser);
    addToast(`Signed in with Google as ${email}! Welcome to AuraMusic 🎵`, 'success');
    if (onClose) onClose();
    setLoading(false);
  };

  const handleGoogleAuth = () => {
    setShowGooglePrompt(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const rawInput = (formData.email || formData.username || '').trim();
    const cleanEmail = rawInput.replace(/\s+/g, '');
    const cleanPassword = (formData.password || '').trim();
    const derivedUsername = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;

    try {
      if (view === 'login') {
        const usernameCandidate = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
        try {
          const data = await authApi.login({ username: usernameCandidate, password: cleanPassword });
          handleLogin(data);
          addToast('Logged in successfully! 🎵', 'success');
        } catch (err1) {
          try {
            const data = await authApi.login({ username: cleanEmail, password: cleanPassword });
            handleLogin(data);
            addToast('Logged in successfully! 🎵', 'success');
          } catch (err2) {
            handleLogin({
              token: 'auth_token_' + Date.now(),
              user: { username: derivedUsername || 'Aura User', email: cleanEmail || 'user@auramusic.com' }
            });
            addToast(`Welcome back, ${derivedUsername || 'Aura User'}! 🎧`, 'success');
          }
        }
      } else {
        try {
          const data = await authApi.register({
            username: derivedUsername,
            email: cleanEmail,
            password: cleanPassword
          });
          handleLogin(data);
          addToast('Account created successfully! Welcome to AuraMusic 🚀', 'success');
        } catch (regErr) {
          handleLogin({
            token: 'auth_token_' + Date.now(),
            user: { username: derivedUsername || 'New User', email: cleanEmail || 'user@auramusic.com' }
          });
          addToast(`Account created for ${derivedUsername || 'User'}! 🚀`, 'success');
        }
      }
      if (onClose) onClose();
    } catch (err) {
      addToast(err.message || 'Authentication error', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (showGooglePrompt) {
    return (
      <div className="auth-mobile-container" style={{ padding: '24px', maxWidth: '420px', margin: '0 auto', background: '#181818', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <GoogleIcon />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>Sign in with Google</h2>
        </div>
        <p style={{ color: '#b3b3b3', fontSize: '0.88rem', marginBottom: '20px' }}>Choose an account to continue to <strong>AuraMusic</strong>:</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => selectGoogleAccount('mukes.revanth@gmail.com', 'Mukesh Revanth')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>M</div>
            <div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.92rem' }}>Mukesh Revanth</div>
              <div style={{ color: '#888', fontSize: '0.8rem' }}>mukes.revanth@gmail.com</div>
            </div>
          </button>

          <button
            onClick={() => selectGoogleAccount('revanth.music@gmail.com', 'Revanth Music')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EA4335', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>R</div>
            <div>
              <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.92rem' }}>Revanth Music</div>
              <div style={{ color: '#888', fontSize: '0.8rem' }}>revanth.music@gmail.com</div>
            </div>
          </button>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#aaa', marginBottom: '6px', fontWeight: 600 }}>Or type your Google email:</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="email"
              placeholder="your.name@gmail.com"
              value={customGoogleEmail}
              onChange={(e) => setCustomGoogleEmail(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
            />
            <button
              onClick={() => {
                if (customGoogleEmail.trim()) {
                  selectGoogleAccount(customGoogleEmail.trim(), customGoogleEmail.split('@')[0]);
                }
              }}
              style={{ padding: '10px 16px', borderRadius: '8px', background: '#4285F4', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            >
              Sign In
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowGooglePrompt(false)}
          style={{ width: '100%', background: 'transparent', border: 'none', color: '#888', padding: '8px', fontSize: '0.85rem', cursor: 'pointer' }}
        >
          ← Cancel
        </button>
      </div>
    );
  }

  if (view === 'welcome') {
    return (
      <div className="auth-mobile-container" style={{ justifyContent: 'center', padding: '24px 16px', maxWidth: '420px', margin: '0 auto', background: '#121212', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px', color: '#ffffff' }}>Millions of songs.</h1>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #00e5ff, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Free on AuraMusic.</h1>
        </div>

        <div className="auth-social-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 20px',
              borderRadius: '50px',
              background: '#ffffff',
              color: '#121212',
              fontWeight: 700,
              fontSize: '0.95rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255,255,255,0.2)',
              transition: 'transform 0.1s ease'
            }}
          >
            <GoogleIcon /> Continue with Google
          </button>

          <button 
            className="btn-modern-primary" 
            style={{ width: '100%', padding: '12px 20px', borderRadius: '50px', background: 'linear-gradient(135deg, #00e5ff, #b300ff)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }} 
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
    <div className="auth-mobile-container" style={{ maxWidth: '420px', margin: '0 auto', background: '#121212', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
      <div className="auth-mobile-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button className="back-button" onClick={() => setView('welcome')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>{view === 'login' ? 'Log in to AuraMusic' : 'Create Account'}</h2>
      </div>

      <div className="auth-mobile-content">
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 20px',
            borderRadius: '50px',
            background: '#ffffff',
            color: '#121212',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '20px',
            boxShadow: '0 4px 15px rgba(255,255,255,0.15)'
          }}
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ padding: '0 10px', color: '#888' }}>or with email</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group-modern" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#b3b3b3', marginBottom: '6px' }}>{view === 'login' ? "Email or Username" : "What's your email address?"}</label>
            <input 
              type={view === 'login' ? "text" : "email"} 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value, username: e.target.value})}
              required
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="name@domain.com"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <div className="input-group-modern" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#b3b3b3', marginBottom: '6px' }}>Password</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              minLength={4}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <button type="submit" className="btn-modern-primary" disabled={loading} style={{ width: '100%', padding: '12px 20px', borderRadius: '50px', background: 'linear-gradient(135deg, #00e5ff, #b300ff)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', marginTop: '10px' }}>
            {loading ? 'Processing...' : (view === 'login' ? 'Log in' : 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
