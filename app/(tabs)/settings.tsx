import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('wordlers_name');
    router.replace('/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f5" />
      <Text style={styles.header}>Settings</Text>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ff4444" />
          <Text style={styles.logoutText}>Log Out of Wordlers</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    paddingHorizontal: 20,
    letterSpacing: -1,
    color: '#000',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logoutText: {
    fontSize: 18,
    color: '#ff4444',
    fontWeight: '600',
    marginLeft: 12,
  },
});