import AsyncStorage from '@react-native-async-storage/async-storage';

export type Song = { id: string; title: string; artist: string; url: string; cover: string };

const HISTORY_KEY = 'history:list';

export async function getHistory(): Promise<Song[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Song[]) : [];
  } catch {
    return [];
  }
}

export async function setHistory(list: Song[]) {
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

export async function removeFromHistory(id: string) {
  const arr = await getHistory();
  await setHistory(arr.filter(s => s.id !== id));
}

export async function clearHistory() {
  await setHistory([]);
}
