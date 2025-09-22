import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MiniPlayer from '../components/MiniPlayer';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Đây là màn hình Explore 🔍</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 20,
    color: 'green',
    fontWeight: 'bold',
  },
});
<MiniPlayer />
