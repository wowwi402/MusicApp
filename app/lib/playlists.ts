// app/lib/playlists.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Song = {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
};

const KEY = 'playlists:data';
const LAST_KEY = 'playlists:last';

type PlaylistsMap = {
  [name: string]: Song[]; // ví dụ { "Huy": [Song1, Song2], "Chill": [Song3] }
};

// đọc toàn bộ danh sách playlists
async function readAll(): Promise<PlaylistsMap> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as PlaylistsMap : {};
  } catch {
    return {};
  }
}

// ghi lại toàn bộ
async function writeAll(map: PlaylistsMap) {
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}

// PUBLIC APIS:

// Lấy danh sách tên playlist (['Huy','Chill',...])
export async function getAllNames(): Promise<string[]> {
  const map = await readAll();
  return Object.keys(map);
}

// Lấy playlist active gần nhất (string | null)
export async function getLastUsed(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_KEY);
    return raw ? raw : null;
  } catch {
    return null;
  }
}

// Lưu playlist active gần nhất
export async function setLastUsed(name: string) {
  await AsyncStorage.setItem(LAST_KEY, name);
}

// Tạo playlist trống nếu chưa có
export async function createPlaylist(name: string) {
  const map = await readAll();
  if (!map[name]) {
    map[name] = [];
    await writeAll(map);
  }
  await setLastUsed(name);
}

// Đổi tên playlist
export async function renamePlaylist(oldName: string, newName: string) {
  if (!newName || newName === oldName) return;
  const map = await readAll();
  if (!map[oldName]) return;
  if (map[newName]) return; // tránh đụng tên cũ khác
  map[newName] = map[oldName];
  delete map[oldName];
  await writeAll(map);

  // nếu playlist đang active là oldName => cập nhật sang newName
  const last = await getLastUsed();
  if (last === oldName) {
    await setLastUsed(newName);
  }
}

// Xoá nguyên playlist
export async function deletePlaylist(name: string) {
  const map = await readAll();
  delete map[name];
  await writeAll(map);

  const last = await getLastUsed();
  if (last === name) {
    // nếu vừa xoá playlist active -> đặt active sang playlist đầu tiên còn lại
    const names = Object.keys(map);
    await setLastUsed(names[0] || '');
  }
}

// Lấy danh sách bài trong playlist
export async function getSongs(name: string): Promise<Song[]> {
  const map = await readAll();
  return map[name] ?? [];
}

// Ghi đè danh sách bài cho 1 playlist
export async function setSongs(name: string, songs: Song[]) {
  const map = await readAll();
  map[name] = songs;
  await writeAll(map);
}

// Thêm 1 bài (không trùng id) vào playlist
export async function addSong(name: string, track: Song) {
  const list = await getSongs(name);
  const withoutDup = list.filter(s => s.id !== track.id);
  const next = [...withoutDup, track];
  await setSongs(name, next);
}

// Xoá 1 bài ra khỏi playlist
export async function removeSong(name: string, id: string) {
  const list = await getSongs(name);
  const next = list.filter(s => s.id !== id);
  await setSongs(name, next);
}

// Xoá hết tất cả playlists
export async function clearAll() {
  await AsyncStorage.setItem(KEY, JSON.stringify({}));
  await AsyncStorage.removeItem(LAST_KEY);
}
