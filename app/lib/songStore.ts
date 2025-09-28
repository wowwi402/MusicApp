// lib/songStore.ts
import React, { createContext, useContext, useMemo, useState } from 'react';

export type Song = {
  id: string;
  title: string;
  artist: string;
  duration: number; // giây
  genre: string;
  isFavorite: boolean;
};

const INITIAL_SONGS: Song[] = [
  { id: '1', title: 'Sunrise', artist: 'Luma', duration: 184, genre: 'Pop', isFavorite: false },
  { id: '2', title: 'Night Drive', artist: 'Neon Wave', duration: 212, genre: 'Synthwave', isFavorite: true },
  { id: '3', title: 'Lotus', artist: 'Minh', duration: 156, genre: 'Indie', isFavorite: false },
  { id: '4', title: 'Rainy Mood', artist: 'Chill Studio', duration: 241, genre: 'Chill', isFavorite: false },
  { id: '5', title: 'Temple Bells', artist: 'Zen Lab', duration: 301, genre: 'Ambient', isFavorite: false },
  { id: '6', title: 'Fire Dance', artist: 'Tribalix', duration: 199, genre: 'World', isFavorite: true },
  { id: '7', title: 'Focus Flow', artist: 'DeepWork', duration: 265, genre: 'Lo-Fi', isFavorite: false },
  { id: '8', title: 'Ocean Air', artist: 'Azure', duration: 178, genre: 'Chill', isFavorite: false },
  { id: '9', title: 'Golden Hour', artist: 'Aura', duration: 223, genre: 'Pop', isFavorite: false },
  { id: '10', title: 'Meditation', artist: 'Calm Mind', duration: 420, genre: 'Ambient', isFavorite: false },
];

type SortKey = 'az' | 'za' | 'dur_asc' | 'dur_desc';

type Store = {
  songs: Song[];
  setSongs: React.Dispatch<React.SetStateAction<Song[]>>;

  // playback
  currentId: string | null;
  setCurrentId: (id: string | null) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;

  // actions
  toggleFavorite: (id: string) => void;
  playSong: (id: string) => void;

  // helpers
  current: Song | null;

  // filters
  query: string;
  setQuery: (v: string) => void;
  genre: string;
  setGenre: (v: string) => void;
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
};

const SongCtx = createContext<Store | null>(null);

// ✅ CHỈNH CHỖ NÀY: thêm { children }: { children: React.ReactNode }
export function SongProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>(INITIAL_SONGS);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('az');

  const toggleFavorite = (id: string) => {
    setSongs(prev => prev.map(s => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)));
  };

  const playSong = (id: string) => {
    setCurrentId(id);
    setIsPlaying(true);
  };

  const current = useMemo(() => songs.find(s => s.id === currentId) ?? null, [songs, currentId]);

  const value: Store = {
    songs, setSongs,
    currentId, setCurrentId,
    isPlaying, setIsPlaying,
    toggleFavorite, playSong,
    current,
    query, setQuery,
    genre, setGenre,
    sortKey, setSortKey,
  };

  // giữ nguyên phần trên
    return React.createElement(SongCtx.Provider, { value }, children);

}

export function useSongStore() {
  const ctx = useContext(SongCtx);
  if (!ctx) throw new Error('useSongStore must be used inside <SongProvider>');
  return ctx;
}

export const GENRES = ['All', 'Pop', 'Synthwave', 'Indie', 'Chill', 'Ambient', 'World', 'Lo-Fi'] as const;
export const SORTS: { key: SortKey; label: string }[] = [
  { key: 'az', label: 'A→Z' },
  { key: 'za', label: 'Z→A' },
  { key: 'dur_asc', label: 'Thời lượng ↑' },
  { key: 'dur_desc', label: 'Thời lượng ↓' },
];

export function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
