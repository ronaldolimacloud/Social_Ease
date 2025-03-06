import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function StartScreen() {
  return (
    <LinearGradient
      colors={['#061a1a', '#020e0e']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.5, 1]}
    >
      {/* Content container with padding and layout */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Personalized greeting for the logged-in user */}
          
          
          {/* Main heading text - white color for emphasis */}
          <Text style={styles.mainText}>REMEMBER</Text>
          
          {/* Secondary headings - dark color for contrast */}
          <Text style={styles.darkText}>RECALL</Text>
          <Text style={styles.darkText}>RELATE</Text>
          
          {/* Feature highlights section */}
          <View style={styles.featureSection}>
            
            
            
            <Text style={styles.featureDetail}>
            A fresh way to build stronger relationships.
            </Text>
            
            
            
          </View>
          
          {/* Descriptive subtext explaining the app's purpose
              Limited width for better readability */}
          <Text style={styles.subText}>
          Feel confident in any social situation—perfect for networking events, school functions, and community gatherings.
          </Text>
          
          {/* Button to go to auth screen */}
          <Pressable onPress={() => router.push('/auth')} style={styles.buttonContainer}>
            <LinearGradient
              colors={['#092121', '#153434']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.startButton}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

/**
 * Styles for the start screen components
 * Uses a StyleSheet for better performance and type checking
 */
const styles = StyleSheet.create({
  // Root container - takes up full screen
  container: {
    flex: 1,
  },
  
  // ScrollView content container
  scrollContent: {
    flexGrow: 1,
  },
  
  // Content container styling
  // Adds padding and positions content appropriately
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 130, // Extra padding at top for status bar
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
    fontSize: 50,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 70, // Improved readability
  },
  
  // Secondary heading style - dark text
  darkText: {
    fontSize: 50,
    fontWeight: '800',
    color: '#85c3c0',
    lineHeight: 60,
  },
  
  // Feature section container
  featureSection: {
    marginTop: 5,
    marginBottom: 20,
  },
  
  // Feature title style
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 15,
  },
  
  // Feature detail text
  featureDetail: {
    fontSize: 14,
    color: '#FFFF',
    marginTop: 5,
    marginBottom: 10,
    lineHeight: 20,
  },
  
  // Subtext style - smaller, dark text
  // Limited width and increased line height for readability
  subText: {
    fontSize: 14,
    color: '#FFFF',
    marginTop: 5,
    maxWidth: '90%',
    lineHeight: 22,
    marginBottom: 40,
  },
  
  // Button container
  buttonContainer: {
    alignSelf: 'center',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  
  // Start button style
  startButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Button text style
  buttonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
