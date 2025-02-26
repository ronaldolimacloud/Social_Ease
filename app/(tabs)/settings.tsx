import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * SettingsContent component - Renders the actual settings page content
 * This is shown after successful authentication
 */
function SettingsContent() {
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Ionicons name="person-circle" size={80} color="#90cac7" />
          <Text style={styles.headerText}>Account Settings</Text>
          <Text style={styles.emailText}>{user?.username}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.sectionContent}>
            <Pressable style={styles.menuItem}>
              <Ionicons name="person-outline" size={24} color="#90cac7" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={24} color="#90cac7" style={styles.icon} />
            </Pressable>
            <Pressable style={styles.menuItem}>
              <Ionicons name="notifications-outline" size={24} color="#90cac7" />
              <Text style={styles.menuItemText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={24} color="#90cac7" style={styles.icon} />
            </Pressable>
            <Pressable style={styles.menuItem}>
              <Ionicons name="lock-closed-outline" size={24} color="#90cac7" />
              <Text style={styles.menuItemText}>Privacy</Text>
              <Ionicons name="chevron-forward" size={24} color="#90cac7" style={styles.icon} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.sectionContent}>
            <Pressable style={styles.menuItem}>
              <Ionicons name="help-circle-outline" size={24} color="#90cac7" />
              <Text style={styles.menuItemText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={24} color="#90cac7" style={styles.icon} />
            </Pressable>
            <Pressable style={styles.menuItem}>
              <Ionicons name="information-circle-outline" size={24} color="#90cac7" />
              <Text style={styles.menuItemText}>About</Text>
              <Ionicons name="chevron-forward" size={24} color="#90cac7" style={styles.icon} />
            </Pressable>
          </View>
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
      </ScrollView>
    </View>
  );
}

/**
 * Settings component - Main entry point for the settings tab
 * Wraps content with Amplify's authentication provider and authenticator
 * This ensures users must be logged in to view the content
 */
export default function Settings() {
  return (
    <Authenticator.Provider>
      <Authenticator>
        <SettingsContent />
      </Authenticator>
    </Authenticator.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020e0e',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  emailText: {
    fontSize: 16,
    color: '#90cac7',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  sectionContent: {
    backgroundColor: '#041616',
    borderRadius: 10,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#072727',
  },
  menuItemText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
    flex: 1,
  },
  icon: {
    marginLeft: 'auto',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
}); 