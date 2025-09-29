import AsyncStorage from '@react-native-async-storage/async-storage';
export type Song = { id: string; title: string; artist: string; url: string; cover: string };

const FAVORITES_KEY = 'favorites:list';

export async function getFavorites(): Promise<Song[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as Song[]) : [];
  } catch {
    return [];
  }
}

export async function setFavorites(list: Song[]) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(list));
}

export async function toggleFavorite(song: Song): Promise<boolean> {
  const favs = await getFavorites();
  const exists = favs.some(s => s.id === song.id);
  const next = exists ? favs.filter(s => s.id !== song.id) : [song, ...favs];
  await setFavorites(next);
  return !exists; // true nếu vừa thêm, false nếu vừa xoá
}

export async function removeFavorite(id: string) {
  const favs = await getFavorites();
  await setFavorites(favs.filter(s => s.id !== id));
}

export async function clearFavorites() {
  await setFavorites([]);
}
