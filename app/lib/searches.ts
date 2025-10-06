// app/lib/searches.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'search:recent';
const LIMIT = 10;

export async function getAll(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function add(term: string) {
  const t = term.trim();
  if (!t) return;
  const list = await getAll();
  const next = [t, ...list.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, LIMIT);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function remove(term: string) {
  const list = await getAll();
  const next = list.filter((x) => x.toLowerCase() !== term.toLowerCase());
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function clear() {
  await AsyncStorage.setItem(KEY, JSON.stringify([]));
}
