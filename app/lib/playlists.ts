// app/lib/playlists.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Song = { id: string; title: string; artist: string; url: string; cover: string };

// NƠI LƯU TOÀN BỘ PLAYLISTS (dạng map: { [name]: Song[] })
const KEY = 'playlists:map';
// Ghi nhớ playlist đang dùng gần nhất (để nút +Playlist trong Player thêm vào đúng nơi)
const LAST_USED_KEY = 'playlists:lastUsed';

// ----- Utils đọc/ghi -----
async function read(): Promise<Record<string, Song[]>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, Song[]>) : {};
  } catch {
    return {};
  }
}
async function write(map: Record<string, Song[]>) {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

// ----- APIs public dùng ở Playlists / Player -----
export async function getAllNames(): Promise<string[]> {
  const map = await read();
  return Object.keys(map).sort((a, b) => a.localeCompare(b));
}

export async function getSongs(name: string): Promise<Song[]> {
  const map = await read();
  return map[name] || [];
}

export async function createPlaylist(name: string) {
  const n = name.trim();
  if (!n) return;
  const map = await read();
  if (!map[n]) map[n] = [];
  await write(map);
}

export async function deletePlaylist(name: string) {
  const map = await read();
  delete map[name];
  await write(map);

  // cập nhật last used nếu đang trỏ tới playlist vừa xoá
  const last = await getLastUsed();
  if (last === name) {
    const rest = Object.keys(map);
    if (rest.length) {
      await setLastUsed(rest[0]);
    } else {
      await AsyncStorage.removeItem(LAST_USED_KEY);
    }
  }
}

export async function renamePlaylist(oldName: string, newName: string) {
  const o = oldName.trim();
  const n = newName.trim();
  if (!o || !n || o === n) return;

  const map = await read();
  if (!map[o]) return;

  // nếu trùng tên mới thì gộp bài, loại trùng id
  const merged = [...(map[n] || []), ...map[o]];
  const dedup = merged.filter((s, idx, arr) => arr.findIndex(x => x.id === s.id) === idx);

  delete map[o];
  map[n] = dedup;
  await write(map);

  const last = await getLastUsed();
  if (last === o) await setLastUsed(n);
}

export async function addSong(name: string, song: Song) {
  const map = await read();
  const list = map[name] || [];
  // cho bài lên đầu + loại trùng
  map[name] = [song, ...list.filter(s => s.id !== song.id)];
  await write(map);
}

export async function removeSong(name: string, id: string) {
  const map = await read();
  const list = map[name] || [];
  map[name] = list.filter(s => s.id !== id);
  await write(map);
}

export async function setLastUsed(name: string) {
  await AsyncStorage.setItem(LAST_USED_KEY, name);
}

export async function getLastUsed(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(LAST_USED_KEY);
    return v ?? null;
  } catch {
    return null;
  }
}

export async function clearAll() {  
  await AsyncStorage.setItem(KEY, JSON.stringify({})); 
  await AsyncStorage.removeItem(LAST_USED_KEY);
}
