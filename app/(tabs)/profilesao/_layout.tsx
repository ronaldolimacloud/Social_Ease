import { Stack } from 'expo-router';

export default function AppNavigation() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profiles" options={{ headerShown: true, title: 'Profiles' }} />
      <Stack.Screen name="new_profile" options={{ headerShown: true, title: 'New Profile' }} />
    </Stack>
  );
}