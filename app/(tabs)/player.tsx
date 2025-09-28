// app/(tabs)/player.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as PL from '../lib/playlists';
import { colors } from './theme';

type Song = { id: string; title: string; artist: string; url: string; cover: string };

const PLAYLIST_KEY  = 'playlist:default';
const FAVORITES_KEY = 'favorites:list';
const HISTORY_KEY   = 'history:list';
const HISTORY_LIMIT = 50;

export default function PlayerScreen() {
  const params = useLocalSearchParams<{ queue?: string; index?: string }>();

  const list: Song[] = useMemo(() => {
    try {
      return params.queue ? (JSON.parse(String(params.queue)) as Song[]) : [
        { id: 'demo', title: 'Demo Track', artist: 'Unknown', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://picsum.photos/seed/1/800' },
      ];
    } catch {
      return [
        { id: 'demo', title: 'Demo Track', artist: 'Unknown', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://picsum.photos/seed/1/800' },
      ];
    }
  }, [params.queue]);

  const [current, setCurrent] = useState<number>(() => {
    const i = Number(params.index);
    return Number.isFinite(i) ? i : 0;
  });
  const track = list[(current + list.length) % list.length];

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition]   = useState(0);
  const [duration, setDuration]   = useState(1);

  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat]   = useState<'off' | 'one' | 'all'>('off');
  const [volume, setVolume]   = useState(1);

  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        const arr: Song[] = raw ? JSON.parse(raw) : [];
        const withoutDup = arr.filter((s) => s.id !== track.id);
        const next = [track, ...withoutDup].slice(0, HISTORY_LIMIT);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
    })();

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        const arr: Song[] = raw ? JSON.parse(raw) : [];
        setIsFav(arr.some(s => s.id === track.id));
      } catch { setIsFav(false); }
    })();
  }, [track.id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await Audio.setAudioModeAsync({ staysActiveInBackground: true, playsInSilentModeIOS: true });
      if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
      const { sound } = await Audio.Sound.createAsync({ uri: track.url }, { shouldPlay: true, volume }, onStatus);
      if (!mounted) return;
      soundRef.current = sound;
    })();
    return () => { mounted = false; soundRef.current?.unloadAsync(); soundRef.current = null; };
  }, [track.url]);

  useEffect(() => { soundRef.current?.setVolumeAsync(volume).catch(()=>{}); }, [volume]);

  function onStatus(status: AVPlaybackStatus) {
    if (!('isLoaded' in status) || !status.isLoaded) return;
    const s = status as AVPlaybackStatusSuccess;
    setIsPlaying(s.isPlaying);
    setPosition(s.positionMillis ?? 0);
    setDuration(s.durationMillis ?? 1);
    if (s.didJustFinish && !s.isLooping) handleSongEnd();
  }

  function handleSongEnd() {
    if (repeat === 'one') {
      soundRef.current?.replayAsync();
    } else if (shuffle) {
      setCurrent(Math.floor(Math.random() * list.length));
    } else {
      if (current < list.length - 1) setCurrent(current + 1);
      else if (repeat === 'all') setCurrent(0);
    }
  }

  async function togglePlayPause() {
    const s = soundRef.current; if (!s) return;
    const st = await s.getStatusAsync();
    if ('isLoaded' in st && st.isLoaded) st.isPlaying ? s.pauseAsync() : s.playAsync();
  }
  async function seekTo(ratio: number) {
    const s = soundRef.current; if (!s) return;
    await s.setPositionAsync(ratio * duration);
  }
  const next = () => shuffle ? setCurrent(Math.floor(Math.random()*list.length)) : setCurrent((i)=> (i+1)%list.length);
  const prev = () => shuffle ? setCurrent(Math.floor(Math.random()*list.length)) : setCurrent((i)=> (i-1+list.length)%list.length);

  async function addToPlaylist() {
  try {
    // ưu tiên playlist vừa chọn ở tab
    let target = (await PL.getLastUsed()) || (await PL.getAllNames())[0];

    // nếu chưa có playlist nào -> tạo "My Playlist"
    if (!target) {
      target = 'My Playlist';
      await PL.createPlaylist(target);
      await PL.setLastUsed(target);
    }

    await PL.addSong(target, track);
    Alert.alert(`Đã thêm vào "${target}"`);
  } catch (e) {
    Alert.alert('Lỗi', 'Không thể thêm vào playlist.');
  }
  }

  async function toggleFavorite() {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_KEY);
      const arr: Song[] = raw ? JSON.parse(raw) : [];
      if (arr.some(s => s.id === track.id)) {
        const next = arr.filter(s => s.id !== track.id);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        setIsFav(false);
      } else {
        const next = [track, ...arr];
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        setIsFav(true);
      }
    } catch {}
  }

  async function shareSong() {
    try {
      await Share.share({ message: `🎵 ${track.title} - ${track.artist}\n${track.url}` });
    } catch {}
  }

  const fmt = (ms: number) => {
    const t = Math.floor(ms/1000), m = Math.floor(t/60), s = t%60;
    return `${m}:${String(s).padStart(2,'0')}`;
  };

  return (
    <LinearGradient colors={[colors.bgFrom, colors.bgTo]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle} numberOfLines={1}>Now Playing</Text>
          <View style={{ flexDirection:'row', gap:8 }}>
            <TouchableOpacity onPress={toggleFavorite} style={styles.iconBtn}>
              <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? '#ff6b81' : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={shareSong} style={styles.iconBtn}>
              <Ionicons name="share-social" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cover */}
        <View style={styles.coverWrap}>
          <Image source={{ uri: track.cover }} style={styles.cover} />
        </View>

        {/* Title */}
        <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={styles.title} numberOfLines={1}>{track.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{track.artist}</Text>
        </View>

        {/* Progress */}
        <View style={styles.timeRow}>
          <Text style={styles.time}>{fmt(position)}</Text>
          <Text style={styles.time}>{fmt(duration)}</Text>
        </View>
        <Slider
          style={{ width: '92%', height: 40 }}
          value={duration ? position / duration : 0}
          onSlidingComplete={seekTo}
          minimumValue={0} maximumValue={1} step={0.001}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor="#374151"
          thumbTintColor={colors.primary}
        />

        {/* Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.roundBtn} onPress={prev}><Ionicons name="play-skip-back" size={22} color={colors.text} /></TouchableOpacity>
          <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundBtn} onPress={next}><Ionicons name="play-skip-forward" size={22} color={colors.text} /></TouchableOpacity>
        </View>

        {/* Extras */}
        <View style={styles.extrasRow}>
          <TouchableOpacity
            style={[styles.pill, shuffle && { backgroundColor: colors.accent }]}
            onPress={() => setShuffle((v) => !v)}
          >
            <MaterialCommunityIcons name="shuffle-variant" size={16} color="#fff" />
            <Text style={styles.pillText}>Shuffle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, repeat!=='off' && { backgroundColor: colors.warn }]}
            onPress={() => setRepeat(r => r==='off' ? 'one' : r==='one' ? 'all' : 'off')}
          >
            <MaterialCommunityIcons name={repeat==='one' ? 'repeat-once' : 'repeat'} size={16} color="#fff" />
            <Text style={styles.pillText}>{repeat==='off'?'Off': repeat==='one'?'One':'All'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.pill, { backgroundColor: colors.primary }]} onPress={addToPlaylist}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.pillText}>Playlist</Text>
          </TouchableOpacity>
        </View>

        {/* Volume */}
        <View style={styles.volumeRow}>
          <Ionicons name="volume-low" size={18} color={colors.sub} />
          <Slider
            style={{ flex: 1, height: 36, marginHorizontal: 8 }}
            value={volume}
            onValueChange={setVolume}
            minimumValue={0} maximumValue={1} step={0.01}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor="#374151"
            thumbTintColor={colors.primary}
          />
          <Ionicons name="volume-high" size={18} color={colors.sub} />
        </View>
      </ScrollView>
      {/* ❌ KHÔNG render MiniPlayer ở đây */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingTop: 20, paddingBottom: 20, alignItems: 'center' },
  headerRow: { width: '92%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { color: colors.sub, fontSize: 14, letterSpacing: 0.5 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff10' },
  coverWrap: { width: '85%', maxWidth: 420, aspectRatio: 1, borderRadius: 24, overflow: 'hidden', marginTop: 12, backgroundColor: '#111' },
  cover: { width: '100%', height: '100%', resizeMode: 'cover' },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: 12 },
  artist: { color: colors.sub, marginTop: 2 },
  timeRow: { width: '92%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  time: { color: colors.sub, fontVariant: ['tabular-nums'] },
  controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 14 },
  roundBtn: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff10' },
  playBtn: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  extrasRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#ffffff10' },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  volumeRow: { width: '92%', flexDirection: 'row', alignItems: 'center', marginTop: 12 },
});
