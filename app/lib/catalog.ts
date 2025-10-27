// app/lib/catalog.ts
export type Song = {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
};

// Danh sách nhạc demo
export const SONGS: Song[] = [
  {
    id: '1',
    title: 'SoundHelix Song 1',
    artist: 'T. Schürger',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://picsum.photos/seed/1/800',
  },
  {
    id: '2',
    title: 'SoundHelix Song 2',
    artist: 'T. Schürger',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://picsum.photos/seed/2/800',
  },
  {
    id: '3',
    title: 'SoundHelix Song 3',
    artist: 'T. Schürger',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://picsum.photos/seed/3/800',
  },
  {
    id: '4',
    title: 'SoundHelix Song 4',
    artist: 'T. Schürger',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    cover: 'https://picsum.photos/seed/4/800',
  },
  {
    id: '5',
    title: 'SoundHelix Song 5',
    artist: 'T. Schürger',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    cover: 'https://picsum.photos/seed/5/800',
  },
];

export default SONGS;
