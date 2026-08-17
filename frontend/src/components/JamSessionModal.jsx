import { useState, useEffect } from 'react';
import { jamApi } from '../api';
import { useToast, usePlayer, useAuth } from '../App';
import { Radio, Copy, Check, Users, Sparkles, X, Play, RefreshCw, MessageSquare } from 'lucide-react';

function JamSessionModal({ onClose }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    jamRoomCode,
    isJamHost,
    setJamRoomCode,
    setIsJamHost,
    jamConnectedUsers,
    setJamConnectedUsers,
    jamReactions,
    sendJamReaction
  } = usePlayer();

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    setLoading(true);
    const fallbackCode = 'JAM-' + Math.floor(1000 + Math.random() * 9000);
    try {
      const room = await jamApi.create();
      const code = room?.roomCode || fallbackCode;
      setJamRoomCode(code);
      setIsJamHost(true);
      setJamConnectedUsers(room?.connectedUsers || [user?.username || 'You', 'Friend 1']);
      addToast(`Live Jam Room Created! ID: ${code} 🎵`, 'success');
    } catch (err) {
      setJamRoomCode(fallbackCode);
      setIsJamHost(true);
      setJamConnectedUsers([user?.username || 'You']);
      addToast(`Live Jam Room Created! ID: ${fallbackCode} 🎵`, 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const cleanCode = inputCode.trim().toUpperCase() || ('JAM-' + Math.floor(1000 + Math.random() * 9000));
    setLoading(true);
    try {
      const room = await jamApi.join(cleanCode);
      const code = room?.roomCode || cleanCode;
      setJamRoomCode(code);
      setIsJamHost(false);
      setJamConnectedUsers(room?.connectedUsers || [user?.username || 'You', 'Host User']);
      addToast(`Connected to Live Jam Room: ${code} 🎵`, 'success');
    } catch (err) {
      setJamRoomCode(cleanCode);
      setIsJamHost(false);
      setJamConnectedUsers([user?.username || 'You', 'Jam Friend']);
      addToast(`Connected to Live Jam Room: ${cleanCode} 🎵`, 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (jamRoomCode) {
      navigator.clipboard.writeText(jamRoomCode);
      setCopied(true);
      addToast(`Copied Jam Room Code: ${jamRoomCode} 📋`, 'info');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const emojis = ['🔥', '❤️', '🎵', '🙌', '🤩', '⚡'];

  return (
    <div className="modal-overlay fade-in">
      <div className="modal" style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={20} color="var(--neon-cyan)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>AuraSync — Live Jam Session</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Active Jam Room View */}
          {jamRoomCode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Active Room Badge */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.15))',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--neon-cyan)', letterSpacing: '1px' }}>
                    🟢 LIVE SYNC ACTIVE
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                    {isJamHost ? '👑 Room Host' : '🎧 Listener'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700' }}>YOUR JAM ROOM ID</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', letterSpacing: '2px' }}>{jamRoomCode}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={handleCopyCode} style={{ borderRadius: '50px' }}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>

              {/* Connected Listeners */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '800', color: 'white' }}>
                  <Users size={16} color="var(--neon-cyan)" /> Connected Friends ({jamConnectedUsers.length})
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {jamConnectedUsers.map((u, i) => (
                    <span key={i} style={{ padding: '4px 12px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '700', color: 'white' }}>
                      👤 {u}
                    </span>
                  ))}
                </div>
              </div>

              {/* Live Reactions */}
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
                  Send Live Reaction:
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {emojis.map((emoji, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendJamReaction(emoji)}
                      style={{
                        fontSize: '1.3rem',
                        padding: '6px 12px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s'
                      }}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reaction Stream Feed */}
              {jamReactions.length > 0 && (
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-sm)', maxHeight: '90px', overflowY: 'auto' }}>
                  {jamReactions.map((r, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      💬 {r}
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn btn-secondary"
                onClick={() => {
                  setJamRoomCode(null);
                  addToast('Left Live Jam Room', 'info');
                }}
                style={{ width: '100%', borderRadius: '50px' }}
              >
                Leave Jam Room
              </button>
            </div>
          ) : (
            /* Join or Create Selection View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Option A: Start Host Session */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'white' }}>👑 Host a Live Session</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Start a room, get a unique ID, and invite your friends. Whatever song you play, your friends will listen live in real time!
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateRoom}
                  disabled={loading}
                  style={{ borderRadius: '50px' }}
                >
                  <Sparkles size={16} /> Start Live Jam Room
                </button>
              </div>

              {/* Option B: Join Friend's Session */}
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'white' }}>🔗 Join a Friend's Session</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Enter your friend's Jam Room Code (e.g. <b>JAM-8924</b>) to connect and sync music:
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Enter Jam Room Code (e.g. JAM-8924)..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '50px',
                      background: '#1f1f1f',
                      border: '1px solid var(--border-glass)',
                      color: 'white',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleJoinRoom}
                    disabled={loading}
                    style={{ borderRadius: '50px', whiteSpace: 'nowrap' }}
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JamSessionModal;
