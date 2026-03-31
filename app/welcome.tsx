import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen() {
  const [name, setName] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkExisting();
  }, []);

  const checkExisting = async () => {
    const stored = await AsyncStorage.getItem('wordlers_name');
    if (stored) {
      router.replace('/(tabs)' as any);
    } else {
      setIsChecking(false);
    }
  };

  const saveName = async () => {
    if (!name.trim()) return;
    await AsyncStorage.setItem('wordlers_name', name.trim());
    router.replace('/(tabs)' as any);
  };

  // Prevent UI flash by showing a loader while checking storage
  if (isChecking) {
    return (
      <View style={[styles.container, { alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Text style={styles.title}>Wordlers</Text>
      <Text style={styles.subtitle}>Enter your name for the leaderboard</Text>
      <TextInput 
        style={styles.input} 
        placeholder="Your Name" 
        value={name} 
        onChangeText={setName} 
        autoFocus
      />
      <TouchableOpacity style={styles.button} onPress={saveName}>
        <Text style={styles.buttonText}>Start Playing</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#ffffff' },
  title: { 
    fontSize: 48, 
    fontWeight: '900', 
    marginBottom: 8, 
    textAlign: 'center', 
    letterSpacing: -1.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', // Gives it that classic NYT newspaper vibe
    color: '#121212' 
  },
  subtitle: { fontSize: 16, color: '#6aaa64', fontWeight: '600', marginBottom: 40, textAlign: 'center', letterSpacing: 0.5 },
  input: { 
    borderWidth: 2, 
    borderColor: '#e5e5e5', 
    padding: 18, 
    borderRadius: 16, // Smoother, friendlier curves
    fontSize: 18, 
    fontWeight: '500',
    marginBottom: 20, 
    backgroundColor: '#fafafa',
    color: '#000'
  },
  button: { 
    backgroundColor: '#6aaa64', // Wordle Green 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#6aaa64',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 }
});