import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAuthenticator } from '@aws-amplify/ui-react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Settings screen component - Simplified to just show sign out functionality
 */
export default function SettingsScreen() {
  const { user, signOut } = useAuthenticator();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#061a1a', '#020e0e']}
      style={styles.gradientContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.5, 1]}
    >
      <View style={styles.container}>
        <View style={styles.userInfo}>
          <Text style={styles.emailText}>{user?.username}</Text>
        </View>
        
        <Pressable 
          style={styles.signOutButton} 
          onPress={handleSignOut}
          disabled={loading}
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.signOutText}>
            {loading ? 'Signing Out...' : 'Sign Out'}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  userInfo: {
    marginBottom: 30,
    alignItems: 'center',
  },
  emailText: {
    fontSize: 16,
    color: '#85c3c0',
    marginTop: 5,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    maxWidth: 300,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
}); 