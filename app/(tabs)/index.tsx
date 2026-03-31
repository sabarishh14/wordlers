import { useState, useEffect, useRef } from 'react';
import { StyleSheet, StatusBar, View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const injectWordleHeist = `
  setTimeout(() => {
    const style = document.createElement('style');
    style.innerHTML = 'div[class*="StatsRegiwall"], div[class*="fides-banner"], #fides-overlay, .purr-blocker { display: none !important; }';
    if (document.head) document.head.appendChild(style);

    setTimeout(() => {
      const playButton = document.querySelector('[data-testid="Play"]');
      if (playButton) playButton.click();
    }, 400);
  }, 500);

  let lastReportedStatus = 'INITIALIZING';
  setInterval(() => {
    try {
      const storageKey = Object.keys(window.localStorage).find(k => k.startsWith('games-state-wordleV2/'));
      const stateStr = storageKey ? window.localStorage.getItem(storageKey) : null;
      
      if (stateStr) {
        const parsed = JSON.parse(stateStr);
        const state = parsed.states[0].data;
        const currentStatus = state.status;
        
        // Bulletproof color extraction directly from the DOM tiles
        const extractedEvals = Array.from(document.querySelectorAll('[data-testid="Row"]')).map(row => 
          Array.from(row.querySelectorAll('[data-testid="tile"]')).map(t => t.getAttribute('data-state'))
        ).filter(row => row.length > 0 && row[0] && row[0] !== 'empty' && row[0] !== 'tbd');
        
        const payload = {
          status: currentStatus,
          guessesTaken: state.currentRowIndex,
          wordsGuessed: state.boardState.filter(word => word !== ''),
          evaluations: state.evaluations || extractedEvals
        };

        if (lastReportedStatus === 'INITIALIZING') {
          lastReportedStatus = currentStatus;
          if (currentStatus === 'WIN' || currentStatus === 'FAIL') {
            window.ReactNativeWebView.postMessage(JSON.stringify({ ...payload, silent: true }));
          }
        } else if (currentStatus && currentStatus !== 'IN_PROGRESS' && currentStatus !== lastReportedStatus) {
          lastReportedStatus = currentStatus;
          window.ReactNativeWebView.postMessage(JSON.stringify({ ...payload, silent: false }));
        }
      }
    } catch (e) {}
  }, 2000);
  
  true;
`;

export default function HomeScreen() {
  const [username, setUsername] = useState('Player');
  const [showModal, setShowModal] = useState(false);
  const [gameStats, setGameStats] = useState<any>(null);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    AsyncStorage.getItem('wordlers_name').then(name => {
      if (name) setUsername(name);
    });
  }, []);
  const handleMessage = (event: any) => {
    try {
      const stats = JSON.parse(event.nativeEvent.data);
      console.log("Clean Wordlers Data:", stats);

      // ONLY trigger the save and popup if it's an active gameplay transition
      if ((stats.status === 'WIN' || stats.status === 'FAIL') && !stats.silent) {
        setGameStats(stats);
        setShowModal(true);
        
        fetch('/api/save-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            ...stats
          })
        })
        .then(res => res.json())
        .then(data => console.log("DB Save Result:", data))
        .catch(err => console.error("DB Save Error:", err));
      }
        
    } catch (error) {
      console.error("Error parsing Wordle data:", error);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f5" />
      
      {/* Escape Hatch Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Wordlers</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => {
            // Forcefully teleport the WebView back to the Wordle game board
            webviewRef.current?.injectJavaScript(`window.location.href = 'https://www.nytimes.com/games/wordle/index.html'; true;`);
          }}
        >
          <Ionicons name="refresh" size={16} color="#666" />
          <Text style={styles.refreshText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.webviewWrapper}>
        <WebView
          ref={webviewRef}
          source={{ uri: 'https://www.nytimes.com/games/wordle/index.html' }}
          injectedJavaScript={injectWordleHeist}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          style={styles.webview}
          onShouldStartLoadWithRequest={(request) => {
            // Only allow standard web URLs. This blocks custom app intents 
            // like 'nytimes://' that kick you out to the official NYT app.
            if (request.url.startsWith('http://') || request.url.startsWith('https://')) {
              return true; // Keep it inside our WebView
            }
            return false; // Block the OS from opening external apps
          }}
        />
      </View>

      {/* The Success / Game Over Popup */}
      <Modal visible={showModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {gameStats?.status === 'WIN' ? '🎉 You got it!' : 'Better luck tomorrow!'}
            </Text>
            <Text style={styles.modalText}>
              {gameStats?.status === 'WIN' 
                ? `You solved today's Wordle in ${gameStats?.guessesTaken} ${gameStats?.guessesTaken === 1 ? 'guess' : 'guesses'}.` 
                : 'The streak ends, but the leaderboard awaits.'}
            </Text>
            <Text style={styles.modalSubText}>Your score is locked in on Wordlers.</Text>
            
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => {
                setShowModal(false);
                router.push('/(tabs)/explore');
              }}
            >
              <Text style={styles.modalButtonText}>View Leaderboard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5', 
    padding: 16, // Restores the perfect even spacing on all sides (especially the bottom gap!)
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16, // Gives the Wordle box enough breathing room
    paddingHorizontal: 4, // Keeps the text aligned perfectly with the curved card
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    color: '#000',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e5e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  refreshText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  webviewWrapper: {
    flex: 1,
    borderRadius: 24, // Cute curved edges
    overflow: 'hidden', // Crucial: clips the square WebView corners
    backgroundColor: '#ffffff',
    // Adds a soft, modern shadow underneath the card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5, // Shadow for Android
    marginBottom: 8, // Little extra space above the tab bar
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  modalSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    color: '#888',
  },
  modalButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});