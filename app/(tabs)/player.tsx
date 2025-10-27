// app/(tabs)/player.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import {
  Audio,
  AVPlaybackStatus,
  AVPlaybackStatusSuccess,
} from 'expo-av';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from './theme';

// ---- types ----
type Song = {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
};

// ---- storage keys ----
const PLAYLIST_KEY = 'playlist:default';
const FAVORITES_KEY = 'favorites:list';
const HISTORY_KEY = 'history:list';
const HISTORY_LIMIT = 50;

const SHUFFLE_KEY = 'player:shuffle';
const REPEAT_KEY = 'player:repeat';
const VOLUME_KEY = 'player:volume';
const MUTE_KEY = 'player:mute';

// helpers lưu/đọc
async function save(key: string, val: any) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(val));
  } catch {}
}
async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function PlayerScreen() {
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ queue?: string; index?: string }>();

  // 1. lấy queue (danh sách bài truyền vào bằng router)
  const list: Song[] = useMemo(() => {
    try {
      return params.queue
        ? (JSON.parse(String(params.queue)) as Song[])
        : [
            {
              id: 'demo',
              title: 'Demo Track',
              artist: 'Unknown',
              url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
              cover: 'https://picsum.photos/seed/3/800',
            },
          ];
    } catch {
      return [
        {
          id: 'demo',
          title: 'Demo Track',
          artist: 'Unknown',
          url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
          cover: 'https://picsum.photos/seed/3/800',
        },
      ];
    }
  }, [params.queue]);

  // 2. chỉ số bài đang phát
  const [current, setCurrent] = useState<number>(() => {
    const i = Number(params.index);
    return Number.isFinite(i) ? i : 0;
  });

  // nếu điều hướng tới Player với index mới -> cập nhật current
  useEffect(() => {
    const i = Number(params.index);
    setCurrent(Number.isFinite(i) ? i : 0);
  }, [params.index, params.queue]);

  // bài hiện tại
  const track = list[(current + list.length) % list.length];

  // 3. audio state
  const soundRef = useRef<Audio.Sound | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);   // ms
  const [duration, setDuration] = useState(1);   // ms (tránh chia 0)

  // 4. player settings
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // 5. favorite flag cho bài hiện tại
  const [isFav, setIsFav] = useState(false);

  // khởi tạo ban đầu: lấy setting đã lưu (shuffle/repeat/volume/mute)
  useEffect(() => {
    (async () => {
      const s = await load<boolean>(SHUFFLE_KEY, false);
      const r = await load<'off' | 'one' | 'all'>(REPEAT_KEY, 'off');
      const v = await load<number>(VOLUME_KEY, 1);
      const m = await load<boolean>(MUTE_KEY, false);
      setShuffle(s);
      setRepeat(r);
      setVolume(v);
      setMuted(m);

      // cài audio mode cho iOS / background
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  // mỗi khi đổi bài:
  //  - cập nhật history
  //  - kiểm tra có trong favorites hay không
  useEffect(() => {
    (async () => {
      // history mới nhất lên đầu, bỏ trùng
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        const arr: Song[] = raw ? JSON.parse(raw) : [];
        const nextList = [track, ...arr.filter((s) => s.id !== track.id)].slice(
          0,
          HISTORY_LIMIT
        );
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(nextList));
      } catch {}

      // fav check
      try {
        const rawFav = await AsyncStorage.getItem(FAVORITES_KEY);
        const favs: Song[] = rawFav ? JSON.parse(rawFav) : [];
        setIsFav(favs.some((s) => s.id === track.id));
      } catch {
        setIsFav(false);
      }
    })();
  }, [track.id]);

  // helper: cập nhật state UI mỗi khi player có status mới
  const handleStatus = (status: AVPlaybackStatus) => {
    if (!('isLoaded' in status) || !status.isLoaded) return;
    const s = status as AVPlaybackStatusSuccess;

    // cập nhật UI
    setIsPlaying(s.isPlaying ?? false);
    setPosition(s.positionMillis ?? 0);
    setDuration(s.durationMillis ?? 1);

    // nếu bài kết thúc tự nhiên
    if (s.didJustFinish && !s.isLooping) {
      // gọi logic chuyển bài
      handleSongEnd();
    }
  };

  // load & play bài mới mỗi khi track.url đổi
  useEffect(() => {
    let stopped = false;

    (async () => {
      try {
        // dọn sound cũ
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current.setOnPlaybackStatusUpdate(null);
          soundRef.current = null;
        }

        // tạo sound mới cho bài hiện tại
        const { sound } = await Audio.Sound.createAsync(
          { uri: track.url },
          {
            shouldPlay: true,       // tự play ngay
            volume: volume,
            isMuted: muted,
          }
        );

        if (stopped) {
          await sound.unloadAsync();
          return;
        }

        // gắn listener status
        sound.setOnPlaybackStatusUpdate(handleStatus);

        // lưu ref
        soundRef.current = sound;
      } catch {
        // nếu load bài lỗi (url die) thì không crash app
      }
    })();

    // cleanup khi component unmount HOẶC trước khi tạo sound mới
    return () => {
      stopped = true;
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.url]); // track thay đổi => load bài mới

  // khi thay volume / mute -> apply vào player hiện tại + lưu
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setVolumeAsync(volume).catch(() => {});
    }
    save(VOLUME_KEY, volume);
  }, [volume]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setIsMutedAsync(muted).catch(() => {});
    }
    save(MUTE_KEY, muted);
  }, [muted]);

  // ---- điều khiển phát lại ----
  function handleSongEnd() {
    // repeat one
    if (repeat === 'one') {
      soundRef.current?.replayAsync().catch(() => {});
      return;
    }

    // shuffle
    if (shuffle) {
      setCurrent(Math.floor(Math.random() * list.length));
      return;
    }

    // mặc định next
    if (current < list.length - 1) {
      setCurrent(current + 1);
    } else if (repeat === 'all') {
      setCurrent(0);
    } else {
      // repeat off + hết list -> ngừng phát
      // tắt isPlaying trong UI
      setIsPlaying(false);
    }
  }

  async function togglePlayPause() {
    const s = soundRef.current;
    if (!s) return;
    const st = await s.getStatusAsync();
    if ('isLoaded' in st && st.isLoaded) {
      if (st.isPlaying) {
        await s.pauseAsync();
      } else {
        await s.playAsync();
      }
    }
  }

  async function seekTo(ratio: number) {
    const s = soundRef.current;
    if (!s) return;
    const targetMs = Math.max(0, Math.min(duration, ratio * duration));
    await s.setPositionAsync(targetMs);
  }

  async function seekBy(deltaSeconds: number) {
    const s = soundRef.current;
    if (!s) return;
    const targetMs = Math.max(
      0,
      Math.min(duration, position + deltaSeconds * 1000)
    );
    await s.setPositionAsync(targetMs);
  }

  function goNext() {
    if (shuffle) {
      setCurrent(Math.floor(Math.random() * list.length));
    } else {
      setCurrent((i) => (i + 1) % list.length);
    }
  }

  function goPrev() {
    if (shuffle) {
      setCurrent(Math.floor(Math.random() * list.length));
    } else {
      setCurrent((i) => (i - 1 + list.length) % list.length);
    }
  }

  // ---- playlist / favorite / share ----
  async function addToPlaylist() {
    try {
      const raw = await AsyncStorage.getItem(PLAYLIST_KEY);
      const arr: Song[] = raw ? JSON.parse(raw) : [];
      const next = [...arr.filter((s) => s.id !== track.id), track];
      await AsyncStorage.setItem(PLAYLIST_KEY, JSON.stringify(next));
      Alert.alert('Added to Playlist');
    } catch {}
  }

  async function toggleFavorite() {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      const arr: Song[] = raw ? JSON.parse(raw) : [];
      if (arr.some((s) => s.id === track.id)) {
        // đã có -> remove
        const next = arr.filter((s) => s.id !== track.id);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        setIsFav(false);
      } else {
        // chưa có -> add
        const next = [track, ...arr];
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        setIsFav(true);
      }
    } catch {}
  }

  async function shareSong() {
    try {
      await Share.share({
        message: `🎵 ${track.title} - ${track.artist}\n${track.url}`,
      });
    } catch {}
  }

  // format mm:ss
  const fmt = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    return `${mm}:${String(ss).padStart(2, '0')}`;
  };

  // ---- UI ----
  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.bg, borderTopColor: colors.border },
      ]}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollBody, { paddingBottom: 24 }]}
      >
        {/* HEADER */}
        <View
          style={[
            styles.headerRow,
            { borderBottomColor: colors.border },
          ]}
        >
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            Now Playing
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={toggleFavorite}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={18}
                color={isFav ? '#e0245e' : (colors.text as string)}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={shareSong}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="share-social-outline"
                size={18}
                color={colors.text as string}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* COVER */}
        <View style={styles.coverWrap}>
          <Image
            source={{ uri: track.cover }}
            style={styles.cover}
          />
        </View>

        {/* TITLE / ARTIST */}
        <View style={styles.titleBlock}>
          <Text
            style={[styles.trackTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <Text
            style={[styles.trackArtist, { color: colors.sub }]}
            numberOfLines={1}
          >
            {track.artist}
          </Text>
        </View>

        {/* PROGRESS TIME */}
        <View
          style={[
            styles.timeRow,
            { width: '90%' },
          ]}
        >
          <Text
            style={{
              color: colors.sub,
              fontVariant: ['tabular-nums'],
            }}
          >
            {fmt(position)}
          </Text>
          <Text
            style={{
              color: colors.sub,
              fontVariant: ['tabular-nums'],
            }}
          >
            {fmt(duration)}
          </Text>
        </View>

        {/* PROGRESS SLIDER */}
        <Slider
          style={{ width: '90%', height: 40 }}
          value={duration ? position / duration : 0}
          onSlidingComplete={seekTo}
          minimumValue={0}
          maximumValue={1}
          step={0.001}
          minimumTrackTintColor={colors.sliderTrack as string}
          maximumTrackTintColor={colors.border as string}
          thumbTintColor={colors.sliderThumb as string}
        />

        {/* CONTROLS */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[
              styles.ctrlBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => seekBy(-10)}
          >
            <Ionicons
              name="play-back"
              size={20}
              color={colors.text as string}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ctrlBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={goPrev}
          >
            <Ionicons
              name="play-skip-back"
              size={22}
              color={colors.text as string}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.playBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={togglePlayPause}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ctrlBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={goNext}
          >
            <Ionicons
              name="play-skip-forward"
              size={22}
              color={colors.text as string}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ctrlBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => seekBy(10)}
          >
            <Ionicons
              name="play-forward"
              size={20}
              color={colors.text as string}
            />
          </TouchableOpacity>
        </View>

        {/* PILLS: SHUFFLE / REPEAT / PLAYLIST */}
        <View style={styles.rowPills}>
          {/* Shuffle */}
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: shuffle
                  ? colors.primary
                  : colors.pillBg,
                borderColor: colors.border,
              },
            ]}
            onPress={async () => {
              const v = !shuffle;
              setShuffle(v);
              await save(SHUFFLE_KEY, v);
            }}
          >
            <MaterialCommunityIcons
              name="shuffle-variant"
              size={16}
              color={
                shuffle ? '#fff' : (colors.text as string)
              }
            />
            <Text
              style={[
                styles.pillText,
                {
                  color: shuffle ? '#fff' : colors.text,
                },
              ]}
            >
              Shuffle
            </Text>
          </TouchableOpacity>

          {/* Repeat */}
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor:
                  repeat !== 'off'
                    ? colors.primary
                    : colors.pillBg,
                borderColor: colors.border,
              },
            ]}
            onPress={async () => {
              const nxt =
                repeat === 'off'
                  ? 'one'
                  : repeat === 'one'
                  ? 'all'
                  : 'off';
              setRepeat(nxt);
              await save(REPEAT_KEY, nxt);
            }}
          >
            <MaterialCommunityIcons
              name={
                repeat === 'one'
                  ? 'repeat-once'
                  : 'repeat'
              }
              size={16}
              color={
                repeat === 'off'
                  ? (colors.text as string)
                  : '#fff'
              }
            />
            <Text
              style={[
                styles.pillText,
                {
                  color:
                    repeat === 'off'
                      ? colors.text
                      : '#fff',
                },
              ]}
            >
              {repeat === 'off'
                ? 'Repeat Off'
                : repeat === 'one'
                ? 'Repeat One'
                : 'Repeat All'}
            </Text>
          </TouchableOpacity>

          {/* Add to Playlist */}
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: colors.primary,
                borderColor: colors.border,
              },
            ]}
            onPress={addToPlaylist}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text
              style={[
                styles.pillText,
                { color: '#fff' },
              ]}
            >
              Playlist
            </Text>
          </TouchableOpacity>
        </View>

        {/* VOLUME */}
        <View style={[styles.volumeRow, { width: '90%' }]}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setMuted((m) => !m)}
          >
            <Ionicons
              name={muted ? 'volume-mute' : 'volume-high'}
              size={18}
              color={colors.text as string}
            />
          </TouchableOpacity>

          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Slider
              style={{ width: '100%', height: 36 }}
              value={volume}
              onValueChange={setVolume}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              minimumTrackTintColor={colors.sliderTrack as string}
              maximumTrackTintColor={colors.border as string}
              thumbTintColor={colors.sliderThumb as string}
            />
          </View>

          <Text
            style={{
              color: colors.sub,
              width: 48,
              textAlign: 'right',
            }}
          >
            {Math.round(volume * 100)}%
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ---- styles ----
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollBody: {
    alignItems: 'center',
    paddingTop: 16,
  },

  headerRow: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconBtn: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 8,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  coverWrap: {
    width: '90%',
    aspectRatio: 1,
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    backgroundColor: '#ccc',
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  titleBlock: {
    marginTop: 16,
    alignItems: 'center',
    width: '90%',
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  trackArtist: {
    fontSize: 14,
    textAlign: 'center',
  },

  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  ctrlBtn: {
    borderRadius: 24,
    borderWidth: 1,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowPills: {
    flexDirection: 'row',
    marginTop: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    width: '90%',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
});
