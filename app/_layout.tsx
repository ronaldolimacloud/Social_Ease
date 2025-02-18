import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ 
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShadowVisible: false,
        headerTintColor: '#007AFF',
      }}>
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="profile/new" 
        options={{
          title: 'New Profile',
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="profile/[id]" 
        options={{
          title: 'Profile',
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen 
        name="group/new" 
        options={{
          title: 'New Group',
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '600',
          },
        }}
      />
    </Stack>
    </SafeAreaProvider>
  );
}