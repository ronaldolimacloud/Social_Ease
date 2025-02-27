import { View, StyleSheet, ImageBackground } from 'react-native';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function AuthScreen() {
  const { authStatus } = useAuthenticator(context => [context.authStatus]);
  
  // Redirect to the main app if already authenticated
  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.replace('/(tabs)');
    }
  }, [authStatus]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/bg-blur-light.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <Authenticator></Authenticator>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 