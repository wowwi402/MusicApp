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

type Song = {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
};

// storage keys
const PLAYLIST_KEY = 'playlist:default';
const FAVORITES_KEY = 'favorites:list';
const HISTORY_KEY = 'history:list';
const HISTORY_LIMIT = 50;

const SHUFFLE_KEY = 'player:shuffle';
const REPEAT_KEY = 'player:repeat';
const VOLUME_KEY = 'player:volume';
const MUTE_KEY = 'player:mute';

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

  // Queue từ params
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

  // Index hiện tại
  const [current, setCurrent] = useState<number>(() => {
    const i = Number(params.index);
    return Number.isFinite(i) ? i : 0;
  });
  useEffect(() => {
    const i = Number(params.index);
    setCurrent(Number.isFinite(i) ? i : 0);
  }, [params.index, params.queue]);

  const track = list[(current + list.length) % list.length];

  // Audio
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);

  // Player settings
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'one' | 'all'>('off');
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  // Favorite state
  const [isFav, setIsFav] = useState(false);

  // init: load settings
  useEffect(() => {
    (async () => {
      setShuffle(await load<boolean>(SHUFFLE_KEY, false));
      setRepeat(await load<'off' | 'one' | 'all'>(REPEAT_KEY, 'off'));
      setVolume(await load<number>(VOLUME_KEY, 1));
      setMuted(await load<boolean>(MUTE_KEY, false));
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  // cập nhật history + fav mỗi khi đổi bài
  useEffect(() => {
    (async () => {
      // history
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        const arr: Song[] = raw ? JSON.parse(raw) : [];
        const next = [
          track,
          ...arr.filter((s) => s.id !== track.id),
        ].slice(0, HISTORY_LIMIT);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}

      // fav?
      try {
        const rawFav = await AsyncStorage.getItem(FAVORITES_KEY);
        const favArr: Song[] = rawFav ? JSON.parse(rawFav) : [];
        setIsFav(favArr.some((s) => s.id === track.id));
      } catch {
        setIsFav(false);
      }
    })();
  }, [track.id]);

  // load & play khi đổi track
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri: track.url },
          {
            shouldPlay: true,
            volume,
            isMuted: muted,
          },
          onStatus
        );
        if (!mounted) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
      } catch {}
    })();

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [track.url]);

  // apply volume / mute changes
  useEffect(() => {
    soundRef.current?.setVolumeAsync(volume).catch(() => {});
    save(VOLUME_KEY, volume);
  }, [volume]);

  useEffect(() => {
    soundRef.current?.setIsMutedAsync(muted).catch(() => {});
    save(MUTE_KEY, muted);
  }, [muted]);

  // status callback
  function onStatus(status: AVPlaybackStatus) {
    if (!('isLoaded' in status) || !status.isLoaded) return;
    const s = status as AVPlaybackStatusSuccess;
    setIsPlaying(s.isPlaying);
    setPosition(s.positionMillis ?? 0);
    setDuration(s.durationMillis ?? 1);
    if (s.didJustFinish && !s.isLooping) {
      handleSongEnd();
    }
  }

  function handleSongEnd() {
    if (repeat === 'one') {
      soundRef.current?.replayAsync();
    } else if (shuffle) {
      setCurrent(Math.floor(Math.random() * list.length));
    } else {
      if (current < list.length - 1) {
        setCurrent(current + 1);
      } else if (repeat === 'all') {
        setCurrent(0);
      }
    }
  }

  // controls
  async function togglePlayPause() {
    const s = soundRef.current;
    if (!s) return;
    const st = await s.getStatusAsync();
    if ('isLoaded' in st && st.isLoaded) {
      st.isPlaying ? s.pauseAsync() : s.playAsync();
    }
  }

  async function seekTo(ratio: number) {
    const s = soundRef.current;
    if (!s) return;
    const pos = Math.max(0, Math.min(duration, ratio * duration));
    await s.setPositionAsync(pos);
  }

  async function seekBy(seconds: number) {
    const s = soundRef.current;
    if (!s) return;
    const nextPos = Math.max(
      0,
      Math.min(duration, position + seconds * 1000)
    );
    await s.setPositionAsync(nextPos);
  }

  const nextTrack = () => {
    if (shuffle) {
      setCurrent(Math.floor(Math.random() * list.length));
    } else {
      setCurrent((i) => (i + 1) % list.length);
    }
  };
  const prevTrack = () => {
    if (shuffle) {
      setCurrent(Math.floor(Math.random() * list.length));
    } else {
      setCurrent((i) => (i - 1 + list.length) % list.length);
    }
  };

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
        const nextFav = arr.filter((s) => s.id !== track.id);
        await AsyncStorage.setItem(
          FAVORITES_KEY,
          JSON.stringify(nextFav)
        );
        setIsFav(false);
      } else {
        const nextFav = [track, ...arr];
        await AsyncStorage.setItem(
          FAVORITES_KEY,
          JSON.stringify(nextFav)
        );
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

  const fmt = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.bg, borderTopColor: colors.border },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: 24 },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.headerRow,
            { borderBottomColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text },
            ]}
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

        {/* Cover */}
        <View style={styles.coverWrap}>
          <Image source={{ uri: track.cover }} style={styles.cover} />
        </View>

        {/* Title / Artist */}
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

        {/* Progress row */}
        <View
          style={[
            styles.timeRow,
            { width: '90%' },
          ]}
        >
          <Text style={{ color: colors.sub, fontVariant: ['tabular-nums'] }}>
            {fmt(position)}
          </Text>
          <Text style={{ color: colors.sub, fontVariant: ['tabular-nums'] }}>
            {fmt(duration)}
          </Text>
        </View>

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

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[
              styles.ctrlBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
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
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={prevTrack}
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
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={nextTrack}
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
              { backgroundColor: colors.card, borderColor: colors.border },
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

        {/* Shuffle / Repeat / Playlist */}
        <View style={styles.rowPills}>
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
              color={shuffle ? '#fff' : (colors.text as string)}
            />
            <Text
              style={[
                styles.pillText,
                { color: shuffle ? '#fff' : colors.text },
              ]}
            >
              Shuffle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor:
                  repeat !== 'off' ? colors.primary : colors.pillBg,
                borderColor: colors.border,
              },
            ]}
            onPress={async () => {
              const nxt =
                repeat === 'off' ? 'one' : repeat === 'one' ? 'all' : 'off';
              setRepeat(nxt);
              await save(REPEAT_KEY, nxt);
            }}
          >
            <MaterialCommunityIcons
              name={repeat === 'one' ? 'repeat-once' : 'repeat'}
              size={16}
              color={repeat === 'off' ? (colors.text as string) : '#fff'}
            />
            <Text
              style={[
                styles.pillText,
                {
                  color:
                    repeat === 'off' ? colors.text : '#fff',
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
            <Text style={[styles.pillText, { color: '#fff' }]}>
              Playlist
            </Text>
          </TouchableOpacity>
        </View>

        {/* Volume */}
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
            style={{ color: colors.sub, width: 48, textAlign: 'right' }}
          >
            {Math.round(volume * 100)}%
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// styles
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
