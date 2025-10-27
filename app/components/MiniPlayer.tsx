// app/components/MiniPlayer.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, usePathname } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAppTheme } from '../(tabs)/theme';

type Song = {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
};

const HISTORY_KEY = 'history:list';

export default function MiniPlayer() {
  const { colors } = useAppTheme();
  const pathname = usePathname();

  const [last, setLast] = useState<Song | null>(null);

  // load bài nghe gần nhất từ history
  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const arr: Song[] = raw ? JSON.parse(raw) : [];
      setLast(arr[0] ?? null); // bài mới nhất
    } catch {
      setLast(null);
    }
  }, []);

  // reload mỗi khi đổi màn (pathname đổi nghĩa là user đang ở tab khác)
  useEffect(() => {
    load();
  }, [load, pathname]);

  // nếu chưa nghe gì hoặc đang đứng ở Player thì ẩn MiniPlayer
  if (!last || (pathname && pathname.includes('/player'))) return null;

  const openPlayer = () => {
    router.push({
      pathname: '/player',
      params: {
        queue: JSON.stringify([last]),
        index: '0',
      },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={openPlayer}
      style={[
        styles.wrap,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Image
        source={{ uri: last.cover }}
        style={[
          styles.cover,
          { backgroundColor: colors.border },
        ]}
      />

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.text }]}
        >
          {last.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.artist, { color: colors.sub }]}
        >
          {last.artist}
        </Text>
      </View>

      <View
        style={[
          styles.playBtn,
          { backgroundColor: colors.primary },
        ]}
      >
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
    bottom: 74, // nằm trên tab bar một chút
    height: 64,
    borderRadius: 16,
    borderWidth: 1,

    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 10,

    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  cover: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },

  title: {
    fontWeight: '700',
    fontSize: 14,
  },

  artist: {
    fontSize: 12,
    marginTop: 2,
  },

  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
