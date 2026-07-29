'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import Link from 'next/link';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.register({ username, email, password });
      login(res.token, res.username, res.email);
      router.push('/search');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-up">
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '3rem' }}>🎵</span>
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join Melodify and build your music library</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              className="input"
              placeholder="Choose a username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              minLength={3}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              className="input"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              className="input"
              placeholder="Create a password (min 6 chars)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              className="input"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link href="/">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
