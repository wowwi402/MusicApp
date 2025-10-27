// app/(tabs)/history.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
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

import type { Song } from '../lib/history';
import * as History from '../lib/history';
import { useAppTheme } from './theme';

export default function HistoryScreen() {
  const { colors } = useAppTheme();

  const [items, setItems] = useState<Song[]>([]);
  const [q, setQ] = useState('');

  // load lịch sử nghe từ AsyncStorage (History.getAll() bạn đã viết trong lib/history)
  const load = useCallback(async () => {
    const list = await History.getAll();
    setItems(list);
  }, []);

  // mỗi lần focus tab History -> reload
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // lọc theo ô tìm kiếm
  const data = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (s) =>
        s.title.toLowerCase().includes(keyword) ||
        s.artist.toLowerCase().includes(keyword)
    );
  }, [items, q]);

  // phát bài từ lịch sử
  const playFrom = (index: number) => {
    router.push({
      pathname: '/player',
      params: {
        queue: JSON.stringify(data),
        index: String(index),
      },
    });
  };

  // xoá một bài khỏi lịch sử
  const removeOne = async (id: string) => {
    await History.remove(id);
    await load();
  };

  // xoá toàn bộ lịch sử
  const clearAll = () => {
    Alert.alert('Xoá lịch sử', 'Bạn muốn xoá toàn bộ lịch sử nghe?', [
      { text: 'Hủy' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          await History.clear();
          await load();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.header, { color: colors.text }]}>
            History ({items.length})
          </Text>

          {!!items.length && (
            <TouchableOpacity
              style={[styles.clearBtn, { backgroundColor: '#e11d48' }]}
              onPress={clearAll}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search box */}
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
            placeholder="Tìm trong lịch sử…"
            placeholderTextColor={colors.sub as string}
            value={q}
            onChangeText={setQ}
            style={[
              styles.input,
              { color: colors.text },
            ]}
          />

          {q ? (
            <TouchableOpacity onPress={() => setQ('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.sub as string}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Danh sách bài đã nghe */}
        {data.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: colors.sub, textAlign: 'center' }}>
              {items.length === 0
                ? 'Chưa có lịch sử.'
                : 'Không thấy kết quả phù hợp.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(it, idx) => it.id + '-' + idx}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 12, gap: 12 }}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                {/* bên trái: cover + info, có thể bấm để play */}
                <TouchableOpacity
                  onPress={() => playFrom(index)}
                  style={styles.left}
                >
                  <Image
                    source={{ uri: item.cover }}
                    style={[
                      styles.cover,
                      { backgroundColor: colors.border },
                    ]}
                  />
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

                {/* bên phải: nút Play & nút Xoá */}
                <View style={styles.rightBtns}>
                  <TouchableOpacity
                    onPress={() => playFrom(index)}
                    style={[
                      styles.playBtn,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="play" size={16} color="#fff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => removeOne(item.id)}
                    style={[
                      styles.removeBtn,
                      { backgroundColor: '#ef4444' },
                    ]}
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
    alignItems: 'center',
    justifyContent: 'space-between',
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

  input: {
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
    justifyContent: 'space-between',
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  cover: {
    width: 56,
    height: 56,
    borderRadius: 8,
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
