'use client';

import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Album } from '@/lib/api';

interface PlayerContextType {
  currentSong: Album | null;
  playSong: (song: Album) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Album | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSong = (song: Album) => {
    setCurrentSong(song);
  };

  useEffect(() => {
    if (currentSong && currentSong.previewUrl && audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'AbortError') {
            console.error("Audio play failed", error);
          }
        });
      }
    }
  }, [currentSong]);

  return (
    <PlayerContext.Provider value={{ currentSong, playSong }}>
      {children}
      {currentSong && currentSong.previewUrl && (
        <div className="player-bar animate-slide-up">
          <div className="player-info">
            <img 
              src={currentSong.artworkUrl100?.replace('100x100', '150x150') || ''} 
              alt="cover" 
              className="player-art"
            />
            <div>
              <div className="player-title">{currentSong.trackName || currentSong.collectionName}</div>
              <div className="player-artist">{currentSong.artistName}</div>
            </div>
          </div>
          <div className="player-controls">
            <audio 
              ref={audioRef}
              src={currentSong.previewUrl} 
              controls 
              autoPlay
              controlsList="nodownload"
            />
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
}
