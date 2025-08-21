import { Stack } from 'expo-router';

export default function AppNavigation() {
  return (
    <Stack>
      
      <Stack.Screen name="profiles" options={{ headerShown: false, title: 'Profiles' }} />
      <Stack.Screen name="new_profile" options={{ headerShown: false, title: 'New Profile' }} />
      <Stack.Screen name="groups_mod" options={{ presentation: 'modal', headerShown: false, title: 'Groups' }} />
    </Stack>
  );
}