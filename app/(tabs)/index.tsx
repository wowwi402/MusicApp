// app/(tabs)/index.tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Song } from '../lib/catalog';
import { SONGS } from '../lib/catalog';
import { useAppTheme } from './theme';

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useAppTheme();

  const openPlayer = (index: number, data: Song[] = SONGS) => {
    router.push({ pathname: '/player', params: { queue: JSON.stringify(data), index: String(index) } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgFrom }]}>
      {/* Header với nút theme */}
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: colors.text }]}>Home</Text>
        <TouchableOpacity onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.card }]}>
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={SONGS}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ padding: 12, gap: 12 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => openPlayer(index)} style={[styles.card, { backgroundColor: colors.card }]}>
            <Image source={{ uri: item.cover }} style={styles.cover} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
              <Text style={{ color: colors.sub }} numberOfLines={1}>{item.artist}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { padding:12, paddingBottom:8, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  header: { fontSize:18, fontWeight:'800' },
  themeBtn: { width:34, height:34, borderRadius:17, alignItems:'center', justifyContent:'center' },

  card: { flexDirection:'row', alignItems:'center', gap: 12, padding: 12, borderRadius: 14 },
  cover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#111' },
  title: { fontWeight:'700' },
});
