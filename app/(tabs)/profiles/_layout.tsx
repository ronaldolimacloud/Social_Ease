import { Stack } from 'expo-router';

export default function AppNavigation() {
  return (
    <Stack>
      
      <Stack.Screen name="profiles" options={{ presentation: 'modal', headerShown: true }} />
      <Stack.Screen name="[id]" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="new_profile" options={{ presentation: 'modal', headerShown: true }} />
      
    </Stack>
  );
}