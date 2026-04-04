import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/_ThemeContext';

export default function FriendProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Theme Variables
  const { isDark } = useTheme();
  const themeBg = isDark ? '#121212' : '#f4f4f5';
  const cardBg = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#121212';
  const graphBg = isDark ? '#333333' : '#f4f4f5';

  useEffect(() => {
    const fetchFriendStats = async () => {
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/profile?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFriendStats();
  }, [username]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: themeBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#6aaa64" />
      </View>
    );
  }

  // Quick Math for Fails and Max Chart Bar
  let totalGuesses = 0;
  let totalWins = 0;
  if (stats) {
    Object.entries(stats.distribution).forEach(([guess, count]: any) => {
      totalGuesses += (parseInt(guess) * count);
      totalWins += count;
    });
  }
  const fails = stats ? stats.totalPlayed - totalWins : 0;
  const maxDistribution = stats ? Math.max(...Object.values(stats.distribution as Record<string, number>), fails) : 1;
  const averageGuesses = totalWins > 0 ? (totalGuesses / totalWins).toFixed(2) : '0.00';

  // Format Average Time
  const formatTime = (seconds?: number) => {
    if (!seconds || seconds === 0) return '--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: themeBg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header with Back Button */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: textColor }]}>{username}'s Stats</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Most Used Word Badge */}
        {!!stats?.favoriteWord && (
          <View style={[styles.favWordContainer, { backgroundColor: cardBg }]}>
             <View style={[styles.favWordIconBox, { backgroundColor: isDark ? '#333' : '#f4f4f5' }]}>
              <Ionicons name="star" size={24} color="#c9b458" />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.favWordLabel}>Most Used Word</Text>
              <Text style={[styles.favWordValue, { color: textColor }]}>
                {stats.favoriteWord.toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Core Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{stats?.totalPlayed || 0}</Text>
            <Text style={styles.statLabel}>Played</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{stats?.winPercentage || 0}</Text>
            <Text style={styles.statLabel}>Win %</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{stats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{stats?.maxStreak || 0}</Text>
            <Text style={styles.statLabel}>Max Streak</Text>
          </View>

          {/* NEW: Avg Guesses and Avg Time */}
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{averageGuesses}</Text>
            <Text style={styles.statLabel}>Avg Guesses</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: cardBg }]}>
            <Text style={[styles.statNumber, { color: textColor }]}>{formatTime(stats?.averageTime)}</Text>
            <Text style={styles.statLabel}>Avg Time</Text>
          </View>

        </View>

        {/* Guess Distribution Chart */}
        <View style={[styles.chartContainer, { backgroundColor: cardBg }]}>
          <Text style={[styles.chartTitle, { color: textColor }]}>Guess Distribution</Text>
          
          {[1, 2, 3, 4, 5, 6].map((guess) => {
            const count = stats?.distribution[guess] || 0;
            const barWidth = maxDistribution > 0 && (count / maxDistribution) * 100 > 7 ? `${(count / maxDistribution) * 100}%` : '7%'; 

            return (
              <View key={guess} style={styles.graphRow}>
                <Text style={[styles.graphNumber, { color: textColor }]}>{String(guess)}</Text>
                <View style={styles.graphBarWrapper}>
                  <View style={[styles.graphBar, { width: barWidth as any, backgroundColor: graphBg }, count > 0 && styles.graphBarFilled]}>
                    <Text style={[styles.graphBarText, { color: count > 0 ? '#ffffff' : textColor }]}>{String(count)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
          
          {/* Fails Row */}
          <View style={styles.graphRow}>
            <Text style={[styles.graphNumber, { color: textColor }]}>X</Text>
            <View style={styles.graphBarWrapper}>
              <View style={[styles.graphBar, { width: maxDistribution > 0 && (fails / maxDistribution) * 100 > 7 ? `${(fails / maxDistribution) * 100}%` : '7%', backgroundColor: graphBg }, fails > 0 && { backgroundColor: '#e57373' }]}>
                <Text style={[styles.graphBarText, { color: fails > 0 ? '#ffffff' : textColor }]}>{String(fails)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 16, marginBottom: 24 },
  header: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  backButton: { padding: 8, marginLeft: -8 },
  scrollContent: { paddingBottom: 40 },
  
  favWordContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 16, borderRadius: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  favWordIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  favWordLabel: { fontSize: 13, fontWeight: '700', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  favWordValue: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },

  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, justifyContent: 'space-between', marginBottom: 12 },
  statBox: { width: '47%', padding: 16, borderRadius: 20, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  statNumber: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase' },
  
  chartContainer: { marginHorizontal: 20, padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  chartTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  graphRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  graphNumber: { width: 16, fontSize: 16, fontWeight: 'bold' },
  graphBarWrapper: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  graphBar: { paddingVertical: 6, paddingRight: 8, justifyContent: 'center', alignItems: 'flex-end', borderRadius: 6 },
  graphBarFilled: { backgroundColor: '#6aaa64' },
  graphBarText: { fontSize: 12, fontWeight: 'bold' },
});