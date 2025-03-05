import { View, Text, StyleSheet } from 'react-native';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Home screen component - Main landing page of the app
 * Shows personalized welcome message and primary app features
 */
export default function HomeScreen() {
  const { user } = useAuthenticator();
  
  return (
    <LinearGradient
      colors={['#061a1a', '#020e0e']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.5, 1]}
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
    </LinearGradient>
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
  
  // Content container styling
  // Adds padding and positions content appropriately
  content: {
    flex: 1,
    padding: 50,
    paddingTop: 90, // Extra padding at top for status bar
  },
  
  // Greeting text style
  greeting: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  
  // Main heading style - white text
  mainText: {
    fontSize: 45,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 45, // Improved readability
  },
  
  // Secondary heading style - dark text
  darkText: {
    fontSize: 45,
    fontWeight: '800',
    color: '#85c3c0',
    lineHeight: 45,
  },
  
  // Subtext style - smaller, dark text
  // Limited width and increased line height for readability
  subText: {
    fontSize: 14,
    color: '#85c3c0',
    marginTop: 5,
    maxWidth: '90%',
    lineHeight: 22,
  },
});