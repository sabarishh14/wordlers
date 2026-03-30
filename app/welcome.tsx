import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#000', headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Play' }} />
      <Tabs.Screen name="explore" options={{ title: 'Leaderboard' }} />
    </Tabs>
  );
}