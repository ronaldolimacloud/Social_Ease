import { View, StyleSheet, ImageBackground, Text, Image } from 'react-native';
import { Authenticator, useAuthenticator, ThemeProvider } from '@aws-amplify/ui-react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';

// Define a custom theme that matches your app's colors
const theme = {
  tokens: {
    colors: {
      background: {
        primary: 'transparent',
      },
      font: {
        interactive: '#FFFFFF',
        primary: '#FFFFFF',
      },
      brand: {
        primary: {
          80: '#345f58',
          90: '#78b9b7',
          100: '#2b504a',
        },
      },
      border: {
        primary: '#FFFFFF',
      },
    },
    components: {
      authenticator: {
        label: {
          color: '#FFFFFF',
        },
        input: {
          color: '#FFFFFF',
        },
      },
    },
  },
};

export default function AuthScreen() {
  const { authStatus } = useAuthenticator(context => [context.authStatus]);
  
  // Redirect to the main app if already authenticated
  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.replace('/(tabs)');
    }
  }, [authStatus]);

  // Custom header components for each authentication screen
  const CustomSignInHeader = () => (
    <View style={styles.headerContainer}>
      <Image 
        source={require('../assets/images/logo.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      <Text style={styles.headerText}></Text>
    </View>
  );

  const CustomSignUpHeader = () => (
    <View style={styles.headerContainer}>
      <Image 
        source={require('../assets/images/logo.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      <Text style={styles.headerText}>Create an Account</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/images/bg-blur-light.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <ThemeProvider theme={theme}>
          <Authenticator.Provider>
            <Authenticator
              components={{
                SignIn: (props) => (
                  <Authenticator.SignIn 
                    {...props}
                    Header={CustomSignInHeader}
                  />
                ),
                SignUp: (props) => (
                  <Authenticator.SignUp 
                    {...props}
                    Header={CustomSignUpHeader}
                  />
                ),
              }}
            />
          </Authenticator.Provider>
        </ThemeProvider>
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
  headerContainer: {
    alignItems: 'center',
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#345f58',
    marginTop: 10,
  },
  logo: {
    width: 150,
    height: 150,
  },
}); 