import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  return (
    <PaperProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Mahjong Score Tracker' }} />
      </Stack>
    </PaperProvider>
  );
}
