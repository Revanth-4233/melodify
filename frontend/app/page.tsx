'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { authApi } from '@/lib/api';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/search');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null; // Prevents flashing the login form
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ username, password });
      login(res.token, res.username, res.email);
      router.push('/search');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
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
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your Melodify account</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="input"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link href="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
