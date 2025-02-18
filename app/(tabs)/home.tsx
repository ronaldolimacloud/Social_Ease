import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

const features = [
  {
    id: '1',
    title: 'Remember Details',
    description: 'Keep track of names, interests, and past conversations',
    icon: 'people',
    color: '#1976D2',
    bgColor: '#E3F2FD',
    link: '/(tabs)/index',
  },
  {
    id: '2',
    title: 'Track Progress',
    description: 'Monitor your social interactions and growth',
    icon: 'analytics',
    color: '#388E3C',
    bgColor: '#E8F5E9',
    link: '/(tabs)/groups',
  },
  {
    id: '3',
    title: 'Get Insights',
    description: 'Receive personalized tips for better conversations',
    icon: 'bulb',
    color: '#F57C00',
    bgColor: '#FFF3E0',
    link: '/(tabs)/create',
  },
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.welcome}>Your Personal Companion for Confident Conversations</Text>
          <Text style={styles.subtitle}>
            Transform small talk into meaningful connections with SocialEase
          </Text>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=400&fit=crop' }}
            style={styles.heroImage}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remember Every Detail</Text>
          <Text style={styles.sectionDescription}>
            Effortlessly create personalized profiles for everyone you meet. Record names, discussion topics, and key details, ensuring you're always prepared for your next interaction.
          </Text>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop' }}
            style={styles.sectionImage}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enhance Your Social Skills</Text>
          <Text style={styles.sectionDescription}>
            Our intelligent system analyzes your notes and offers tailored tips to improve future conversations, transforming small talk into meaningful connections.
          </Text>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop' }}
            style={styles.sectionImage}
          />
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.features}>
            {features.map(feature => (
              <Link key={feature.id} href={feature.link} asChild>
                <Pressable style={styles.feature}>
                  <View style={[styles.featureIcon, { backgroundColor: feature.bgColor }]}>
                    <Ionicons name={feature.icon} size={32} color={feature.color} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Join the SocialEase Community Today</Text>
          <Text style={styles.ctaDescription}>
            Take control of your social experiences and build confidence with every interaction.
          </Text>
          <Link href="/(tabs)/create" asChild>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Get Started</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 40,
  },
  hero: {
    padding: 24,
    backgroundColor: '#F8F8F8',
  },
  welcome: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 24,
  },
  heroImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 20,
  },
  sectionImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  featuresSection: {
    padding: 24,
    backgroundColor: '#F8F8F8',
  },
  features: {
    gap: 16,
  },
  feature: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: 16,
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
  ctaSection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
});