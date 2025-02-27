import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useAuthenticator } from '@aws-amplify/ui-react-native';

/**
 * Home screen component - Main landing page of the app
 * Shows personalized welcome message and primary app features
 */
export default function HomeScreen() {
  const { user } = useAuthenticator();
  
  return (
    <View style={styles.container}>
      {/* Background image wrapper
          Uses local image from assets/images/bg.png
          Covers the entire screen while maintaining aspect ratio */}
      <ImageBackground
        source={require('../../assets/images/bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Content container with padding and layout */}
        <View style={styles.content}>
          {/* Personalized greeting for the logged-in user */}
          <Text style={styles.greeting}>
            Hello, {user?.username ? user.username.split('@')[0] : 'there'}!
          </Text>
          
          {/* Main heading text - white color for emphasis */}
          <Text style={styles.mainText}>CONNECT</Text>
          
          {/* Secondary headings - dark color for contrast */}
          <Text style={styles.darkText}>TALK</Text>
          <Text style={styles.darkText}>THRIVE</Text>
          
          {/* Descriptive subtext explaining the app's purpose
              Limited width for better readability */}
          <Text style={styles.subText}>
            AI-powered personalized insights to help you feel confident in any social situation.
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
}

/**
 * Styles for the home screen components
 * Uses a StyleSheet for better performance and type checking
 */
const styles = StyleSheet.create({
  // Root container - takes up full screen
  container: {
    flex: 1,
  },
  
  // Background image styling
  // Ensures image covers the entire screen
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  // Content container styling
  // Adds padding and positions content appropriately
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60, // Extra padding at top for status bar
  },
  
  // Greeting text style
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  
  // Main heading style - white text
  mainText: {
    fontSize: 45,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 52, // Improved readability
  },
  
  // Secondary heading style - dark text
  darkText: {
    fontSize: 45,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 52,
  },
  
  // Subtext style - smaller, dark text
  // Limited width and increased line height for readability
  subText: {
    fontSize: 17,
    color: '#1A1A1A',
    marginTop: 20,
    maxWidth: '80%',
    lineHeight: 22,
  },
});