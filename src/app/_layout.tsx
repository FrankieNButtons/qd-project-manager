import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NotificationProvider } from '../components/common/NotificationProvider';
import { AppInitializer } from '../components/common/AppInitializer';

export default function RootLayout() {
  return (
    <NotificationProvider>
      <StatusBar style="dark" />
      <AppInitializer />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </NotificationProvider>
  );
}
