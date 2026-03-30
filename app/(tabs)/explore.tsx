import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, RefreshControl } from 'react-native';

type Score = {
  username: string;
  status: string;
  guesses_taken: number;
};

export default function ExploreScreen() {
  const [scores, setScores] = useState<Score[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScores = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (data.success) setScores(data.scores);
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchScores();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Today's Ranks</Text>
      <FlatList
        data={scores}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchScores} tintColor="#000" />}
        keyExtractor={(item, index) => item.username + index}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{index + 1}</Text>
            <Text style={styles.name}>{item.username}</Text>
            <Text style={styles.score}>
              {item.status === 'WIN' ? `${item.guesses_taken}/6` : 'FAIL'}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No scores yet today. Be the first!</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  header: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, marginTop: 40, letterSpacing: -1 },
  row: { flexDirection: 'row', paddingVertical: 18, borderBottomWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' },
  rank: { fontSize: 18, fontWeight: 'bold', width: 40, color: '#bbb' },
  name: { fontSize: 18, flex: 1, fontWeight: '500' },
  score: { fontSize: 18, fontWeight: '900' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 16 }
});