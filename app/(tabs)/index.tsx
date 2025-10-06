// app/(tabs)/index.tsx
import { router } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from './theme';

import type { Song } from '../lib/catalog';
import { SONGS } from '../lib/catalog';

// helpers
import * as FAV from '../lib/favorites';
import * as PL from '../lib/playlists';

export default function HomeScreen() {
  const openPlayer = (index: number, data: Song[] = SONGS) => {
    router.push({
      pathname: '/player',
      params: { queue: JSON.stringify(data), index: String(index) },
    });
  };

  const onLongPress = (item: Song, index: number) => {
    Alert.alert(item.title, item.artist, [
      { text: 'Play', onPress: () => openPlayer(index) },
      {
        text: 'Add to Favorites',
        onPress: async () => {
          await FAV.toggleFavorite(item);
          Alert.alert('✅', 'Đã cập nhật Favorites');
        },
      },
      {
        text: 'Add to Playlist',
        onPress: async () => {
          try {
            let target = (await PL.getLastUsed()) || (await PL.getAllNames())[0];
            if (!target) {
              target = 'My Playlist';
              await PL.createPlaylist(target);
            }
            await PL.addSong(target, item);
            await PL.setLastUsed(target);
            Alert.alert('✅', `Đã thêm vào "${target}"`);
          } catch {
            Alert.alert('Lỗi', 'Không thể thêm vào playlist');
          }
        },
      },
      { text: 'Đóng', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={SONGS}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        renderItem={({ item, index }) => (
          <SongItem
            item={item}
            onPress={() => openPlayer(index)}
            onLongPress={() => onLongPress(item, index)}
          />
        )}
      />
    </View>
  );
}

function SongItem({
  item,
  onPress,
  onLongPress,
}: {
  item: Song;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={styles.card}>
      <Image source={{ uri: item.cover }} style={styles.cover} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {item.artist}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#ffffff10',
    borderRadius: 14,
  },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#111' },
  title: { color: colors.text, fontWeight: '700' },
  artist: { color: colors.sub },
});
