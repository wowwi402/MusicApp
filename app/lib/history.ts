// app/lib/history.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Song = {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
};

const HISTORY_KEY = 'history:list';
const HISTORY_LIMIT = 50;

export async function getAll(): Promise<Song[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Song[]) : [];
  } catch {
    return [];
  }
}

export async function addTop(song: Song) {
  try {
    const arr = await getAll();
    const next = [song, ...arr.filter(s => s.id !== song.id)].slice(0, HISTORY_LIMIT);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {}
}

export async function remove(id: string) {
  try {
    const arr = await getAll();
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(arr.filter(s => s.id !== id)));
  } catch {}
}

export async function clear() {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
  } catch {}
}
