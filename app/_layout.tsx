import { Stack } from 'expo-router';
import { ThemeProvider } from './_ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}