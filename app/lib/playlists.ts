// app/lib/playlists.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Song = { id: string; title: string; artist: string; url: string; cover: string };

const INDEX_KEY = 'playlists:index';                  // ["My Playlist", "Workout", ...]
const PL_KEY = (name: string) => `playlist:${name}`;  // danh sách bài của 1 playlist
const LAST_USED_KEY = 'playlists:lastUsed';           // nhớ playlist gần nhất

export async function getAllNames(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function createPlaylist(name: string) {
  const names = await getAllNames();
  if (!names.includes(name)) {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify([...names, name]));
    await AsyncStorage.setItem(PL_KEY(name), JSON.stringify([]));
  }
}

export async function renamePlaylist(oldName: string, newName: string) {
  const names = await getAllNames();
  if (!names.includes(oldName)) return;
  const without = names.filter(n => n !== oldName);
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify([...without, newName]));
  const raw = await AsyncStorage.getItem(PL_KEY(oldName));
  await AsyncStorage.setItem(PL_KEY(newName), raw ?? '[]');
  await AsyncStorage.removeItem(PL_KEY(oldName));
}

export async function deletePlaylist(name: string) {
  const names = await getAllNames();
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(names.filter(n => n !== name)));
  await AsyncStorage.removeItem(PL_KEY(name));
}

export async function getSongs(name: string): Promise<Song[]> {
  const raw = await AsyncStorage.getItem(PL_KEY(name));
  return raw ? JSON.parse(raw) : [];
}

export async function addSong(name: string, song: Song) {
  const arr = await getSongs(name);
  const next = arr.filter(s => s.id !== song.id).concat(song);
  await AsyncStorage.setItem(PL_KEY(name), JSON.stringify(next));
  await AsyncStorage.setItem(LAST_USED_KEY, name);
}

export async function removeSong(name: string, id: string) {
  const arr = await getSongs(name);
  await AsyncStorage.setItem(PL_KEY(name), JSON.stringify(arr.filter(s => s.id !== id)));
}

export async function getLastUsed(): Promise<string | null> {
  return (await AsyncStorage.getItem(LAST_USED_KEY)) as string | null;
}

export async function setLastUsed(name: string) {
  await AsyncStorage.setItem(LAST_USED_KEY, name);
}
