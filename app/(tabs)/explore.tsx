// app/(tabs)/explore.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SONGS, type Song } from '../lib/catalog';
import { useAppTheme } from './theme';

export default function ExploreScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return SONGS;
    return SONGS.filter(
      (s) =>
        s.title.toLowerCase().includes(k) ||
        s.artist.toLowerCase().includes(k)
    );
  }, [q]);

  const openPlayer = (index: number, data: Song[] = filtered) => {
    router.push({
      pathname: '/player',
      params: { queue: JSON.stringify(data), index: String(index) },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Explore</Text>

        <TouchableOpacity
          onPress={toggleTheme}
          style={[
            styles.themeBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name={isDark ? 'sunny' : 'moon'}
            size={18}
            color={colors.text as string}
          />
        </TouchableOpacity>
      </View>

      {/* Ô search */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="search" size={16} color={colors.sub as string} />
        <TextInput
          placeholder="Tìm bài hát, ca sĩ…"
          placeholderTextColor={colors.sub as string}
          value={q}
          onChangeText={setQ}
          style={[styles.searchInput, { color: colors.text }]}
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

      {/* Kết quả */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={{ color: colors.sub }}>Không tìm thấy kết quả.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => openPlayer(index)}
              style={[
                styles.songCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Image source={{ uri: item.cover }} style={styles.cover} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.title, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text style={{ color: colors.sub }} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
              <Ionicons
                name="play-circle"
                size={24}
                color={colors.primary as string}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },

  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },

  cover: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },

  title: {
    fontWeight: '600',
    fontSize: 15,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
