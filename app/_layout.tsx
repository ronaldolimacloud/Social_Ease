import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { useEffect } from 'react';

// Configure Amplify with the generated AWS resources
Amplify.configure(outputs);

// Authentication protection wrapper
function AuthWrapper() {
  const segments = useSegments();
  const router = useRouter();
  const { authStatus } = useAuthenticator(context => [context.authStatus]);

  useEffect(() => {
    // Check if user is authenticated or not
    if (authStatus === 'configuring') return;

    const isInTabsRoute = segments[0] === '(tabs)';
    const isAuthRoute = segments[0] === 'auth';

    if (authStatus !== 'authenticated' && !isAuthRoute) {
      // Redirect to the auth screen if not authenticated
      router.replace('/start');
    } else if (authStatus === 'authenticated' && isAuthRoute) {
      // Redirect to the main app when authenticated
      router.replace('/(tabs)');
    }
  }, [authStatus, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#90cac7" />
      <Authenticator.Provider>
        <AuthWrapper />
      </Authenticator.Provider>
    </SafeAreaProvider>
  );
}