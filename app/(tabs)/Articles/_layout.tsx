import { Stack } from 'expo-router';

export default function AppNavigation() {
  return (
    <Stack>
      
      
      <Stack.Screen name="test4" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="test3" options={{ presentation: 'modal', headerShown: true }} />
    </Stack>
  );
}