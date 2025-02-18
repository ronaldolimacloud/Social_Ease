import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.heroSection}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Your Personal Companion for Confident Conversations</Text>
          <Text style={styles.heroSubtitle}>Navigate social interactions with ease and confidence</Text>
          <Link href="/profile/new" asChild>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Create Your First Profile</Text>
            </Pressable>
          </Link>
        </View>
      </LinearGradient>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        
        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="people" size={24} color="#1976D2" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Remember Every Detail</Text>
            <Text style={styles.featureDescription}>
              Create personalized profiles for everyone you meet. Never forget a name or important detail again.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="analytics" size={24} color="#388E3C" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Enhance Social Skills</Text>
            <Text style={styles.featureDescription}>
              Get tailored tips to improve conversations and transform small talk into meaningful connections.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="heart" size={24} color="#F57C00" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Track Your Progress</Text>
            <Text style={styles.featureDescription}>
              Monitor your social comfort levels and celebrate your improvements over time.
            </Text>
          </View>
        </View>
      </View>

      {/* How It Works Section */}
      <View style={[styles.section, styles.sectionAlt]}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        
        <View style={styles.stepContainer}>
          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.stepNumber, { color: '#1976D2' }]}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Create Profiles</Text>
            <Text style={styles.stepDescription}>Add details about people you meet</Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.stepNumber, { color: '#388E3C' }]}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Add Insights</Text>
            <Text style={styles.stepDescription}>Record conversation topics and interests</Text>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, { backgroundColor: '#FFF3E0' }]}>
              <Text style={[styles.stepNumber, { color: '#F57C00' }]}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Stay Connected</Text>
            <Text style={styles.stepDescription}>Build stronger relationships effortlessly</Text>
          </View>
        </View>
      </View>

      {/* Get Started Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ready to Get Started?</Text>
        <Text style={styles.getStartedText}>
          Take control of your social experiences and build confidence with every interaction.
        </Text>
        <Link href="/profile/new" asChild>
          <Pressable style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Create Your First Profile</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroSection: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  section: {
    padding: 24,
  },
  sectionAlt: {
    backgroundColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  getStartedText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});