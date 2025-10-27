// app/(tabs)/favorites.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';

import * as FAV from '../lib/favorites';
import type { Song } from '../lib/favorites';
import { useAppTheme } from './theme';

export default function FavoritesScreen() {
  const { colors } = useAppTheme();

  const [items, setItems] = useState<Song[]>([]);
  const [q, setQ] = useState('');

  const load = async () => {
    const list = await FAV.getFavorites();
    setItems(list);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const data = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return items;
    return items.filter(
      (s) =>
        s.title.toLowerCase().includes(k) ||
        s.artist.toLowerCase().includes(k)
    );
  }, [items, q]);

  const playFromFav = (index: number) => {
    router.replace({
      pathname: '/player',
      params: {
        queue: JSON.stringify(data),
        index: String(index),
      },
    });
  };

  const removeOne = async (id: string) => {
    await FAV.removeFavorite(id);
    await load();
  };

  const clearAll = () => {
    Alert.alert('Xoá Favorites', 'Bạn chắc chắn muốn xoá tất cả?', [
      { text: 'Hủy' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await FAV.clearFavorites();
          await load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { backgroundColor: colors.bg },
      ]}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.bg },
        ]}
      >
        {/* Header + nút Clear */}
        <View style={styles.headerRow}>
          <Text style={[styles.header, { color: colors.text }]}>
            Favorites ({items.length})
          </Text>

          {items.length > 0 && (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: '#e0245e' }]}
              onPress={clearAll}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Ô Search */}
        <View
          style={[
            styles.searchRow,
            {
              backgroundColor: colors.inputBg,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="search" size={16} color={colors.sub as string} />

          <TextInput
            placeholder="Tìm trong favorites..."
            placeholderTextColor={colors.sub as string}
            value={q}
            onChangeText={setQ}
            style={[styles.searchInput, { color: colors.text as string }]}
          />

          {q ? (
            <TouchableOpacity onPress={() => setQ('')}>
              <Ionicons name="close-circle" size={18} color={colors.sub as string} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Danh sách bài hát */}
        {data.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: colors.sub as string, textAlign: 'center' }}>
              {items.length === 0
                ? 'Chưa có bài nào ❤️.'
                : 'Không tìm thấy bài phù hợp.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{ padding: 12, gap: 12 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                {/* Phần bên trái: ảnh + text, bấm để phát */}
                <TouchableOpacity
                  style={styles.left}
                  onPress={() => playFromFav(index)}
                >
                  <Image source={{ uri: item.cover }} style={styles.cover} />

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.title, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.artist, { color: colors.sub }]}
                      numberOfLines={1}
                    >
                      {item.artist}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Phần bên phải: nút play + nút xoá */}
                <View style={styles.rightBtns}>
                  <TouchableOpacity
                    onPress={() => playFromFav(index)}
                    style={[
                      styles.playBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="play" size={16} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => removeOne(item.id)}
                    style={[styles.removeBtn, { backgroundColor: '#ef4444' }]}
                  >
                    <Ionicons name="trash" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  headerRow: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  header: {
    fontSize: 18,
    fontWeight: '800',
  },

  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  searchRow: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,

    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 6,
  },

  empty: {
    flex: 1,
    paddingTop: 40,
    alignItems: 'center',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },

  cover: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#111',
  },

  title: {
    fontWeight: '700',
    fontSize: 15,
  },

  artist: {
    fontSize: 13,
  },

  rightBtns: {
    flexDirection: 'row',
    gap: 6,
  },

  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

