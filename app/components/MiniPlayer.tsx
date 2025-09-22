// app/components/MiniPlayer.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// theme đang nằm trong app/(tabs)/theme.ts theo setup của bạn
import { colors } from '../(tabs)/theme';

type Song = { id: string; title: string; artist: string; url: string; cover: string };
const HISTORY_KEY = 'history:list';

export default function MiniPlayer() {
  const [last, setLast] = useState<Song | null>(null);
  const navigation = useNavigation<any>();

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const arr: Song[] = raw ? JSON.parse(raw) : [];
      setLast(arr[0] ?? null); // phần tử mới nhất
    } catch {
      setLast(null);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (!last) return null;

  const openPlayer = () => {
    navigation.navigate('(tabs)/player' as never, {
      queue: JSON.stringify([last]),
      index: '0',
    } as never);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={openPlayer} style={styles.wrap}>
      <Image source={{ uri: last.cover }} style={styles.cover} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={styles.title}>{last.title}</Text>
        <Text numberOfLines={1} style={styles.artist}>{last.artist}</Text>
      </View>
      <View style={styles.playBtn}>
        <Ionicons name="play" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 74, // nằm trên thanh tab (tùy máy có thể chỉnh 64-90)
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ffffff14',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,
    // bóng nhẹ
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  cover: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#111' },
  title: { color: colors.text, fontWeight: '700', fontSize: 14 },
  artist: { color: colors.sub, fontSize: 12, marginTop: 2 },
  playBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
