import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, Modal, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Score = {
  username: string;
  status: string;
  guesses_taken: number;
  words_guessed?: string[];
  evaluations?: string[][]; // Add this line
};

export default function ExploreScreen() {
  const [scores, setScores] = useState<Score[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedScore, setSelectedScore] = useState<Score | null>(null); // Tracks the modal

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
          <TouchableOpacity 
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setSelectedScore(item)}
          >
            <View style={[styles.rankBadge, index === 0 && styles.rankBadgeGold]}>
              <Text style={[styles.rankText, index === 0 && styles.rankTextGold]}>
                {index + 1}
              </Text>
            </View>
            <Text style={styles.name}>{item.username}</Text>
            
            <View style={[styles.scorePill, item.status === 'WIN' ? styles.scorePillWin : styles.scorePillFail]}>
              <Text style={[styles.scoreText, item.status !== 'WIN' && styles.scoreTextFail]}>
                {item.status === 'WIN' ? `${item.guesses_taken}/6` : 'FAIL'}
              </Text>
            </View>
            
            {/* The subtle native chevron hint */}
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" style={{ marginLeft: 12 }} />
            
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No scores yet today. Be the first!</Text>}
      />
      {/* The Wordle Board Modal */}
      <Modal visible={!!selectedScore} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedScore?.username}'s Board</Text>
            
            <View style={styles.gridContainer}>
              {/* Loop through the 6 possible Wordle rows */}
              {[...Array(6)].map((_, rowIndex) => {
                const word = selectedScore?.words_guessed?.[rowIndex] || ''; // Get the word if it exists
                
                return (
                  <View key={rowIndex} style={styles.gridRow}>
                    {/* Loop through the 5 letters of the word */}
                    {[...Array(5)].map((_, colIndex) => {
                      const letter = word[colIndex] || '';
                      const isFilled = letter !== '';
                      const evaluation = selectedScore?.evaluations?.[rowIndex]?.[colIndex] || 'empty';
                      
                      // We use 'any[]' here as a quick fix, or 'StyleProp<ViewStyle>[]' for strictness
                      const boxStyles: any[] = [styles.gridBox];
                      const textStyles: any[] = [styles.gridLetter];
                      
                      if (evaluation === 'correct') {
                        boxStyles.push(styles.gridBoxCorrect);
                        textStyles.push(styles.gridLetterWhite);
                      } else if (evaluation === 'present') {
                        boxStyles.push(styles.gridBoxPresent);
                        textStyles.push(styles.gridLetterWhite);
                      } else if (evaluation === 'absent') {
                        boxStyles.push(styles.gridBoxAbsent);
                        textStyles.push(styles.gridLetterWhite);
                      } else if (isFilled) {
                        boxStyles.push(styles.gridBoxFilled);
                      }
                      
                      return (
                        <View key={colIndex} style={boxStyles}>
                          <Text style={textStyles}>{letter.toUpperCase()}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedScore(null)}>
              <Text style={styles.closeButtonText}>Close Board</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 20 },
  header: { fontSize: 36, fontWeight: '900', marginBottom: 24, marginTop: 40, letterSpacing: -1.5, color: '#121212' },
  row: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f0f2f5', alignItems: 'center' },
  
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f4f4f5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rankBadgeGold: { backgroundColor: '#c9b458' }, // Wordle Yellow for 1st Place
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#888' },
  rankTextGold: { color: '#fff' },
  
  name: { fontSize: 18, flex: 1, fontWeight: '600', color: '#121212' },
  
  scorePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scorePillWin: { backgroundColor: '#e8f5e9' },
  scorePillFail: { backgroundColor: '#ffeeee' },
  scoreText: { fontSize: 16, fontWeight: 'bold', color: '#6aaa64' },
  scoreTextFail: { color: '#e57373' }, 
    
  empty: { textAlign: 'center', color: '#a1a1aa', marginTop: 40, fontSize: 16, fontWeight: '500' },
  // Modal & Grid Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#121212',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  gridContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 6, // Space between rows
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6, // Space between boxes
  },
  gridBox: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#d3d6da', // Standard Wordle empty box border
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },

  gridLetter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#121212',
  },
  closeButton: {
    backgroundColor: '#121212',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridBoxFilled: { borderColor: '#878a8c' },
  gridBoxCorrect: { backgroundColor: '#6aaa64', borderColor: '#6aaa64' },
  gridBoxPresent: { backgroundColor: '#c9b458', borderColor: '#c9b458' },
  gridBoxAbsent: { backgroundColor: '#787c7e', borderColor: '#787c7e' },
  gridLetterWhite: { color: '#ffffff' },
});