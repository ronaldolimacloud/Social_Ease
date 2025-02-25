import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../../lib/hooks/useProfile';

type Insight = {
  id: string;
  text: string;
  timestamp: string;
};

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  description: string;
  bio: string;
  photoUrl: string;
  insights: Insight[];
  groups: Array<{
    id: string;
    type: string;
    name: string;
  }>;
};

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [newInsight, setNewInsight] = useState('');
  const { getProfile, updateProfile } = useProfile();

  // Function to fetch profile data
  const fetchProfile = async () => {
    try {
      if (typeof id === 'string') {
        console.log("Fetching profile data for ID:", id);
        const profileData = await getProfile(id, true);
        setProfile(profileData as unknown as Profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchProfile();
  }, [id]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Profile screen is focused, refreshing data");
      fetchProfile();
      return () => {}; // cleanup function
    }, [id])
  );

  const handleEditPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Handle photo update
      console.log('New photo selected:', result.assets[0].uri);
    }
  };

  const handleAddInsight = async () => {
    if (!profile || !newInsight.trim()) return;

    const insight: Insight = {
      id: Date.now().toString(),
      text: newInsight.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      // Create updated profile object with the new insight
      const updatedProfile = {
        ...profile,
        insights: [...profile.insights, insight],
      };
      
      // Call updateProfile with correct parameters
      await updateProfile(
        profile.id,
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          description: profile.description,
          bio: profile.bio,
          photoUrl: profile.photoUrl
        },
        undefined, // No new photo
        [{ text: insight.text, timestamp: insight.timestamp }], // Insights to add
        [], // No insights to remove
        [], // No groups to add
        [] // No groups to remove
      );
      
      setProfile(updatedProfile);
      setNewInsight('');
    } catch (error) {
      console.error('Error adding insight:', error);
    }
  };

  const handleRemoveInsight = async (insightId: string) => {
    if (!profile) return;

    try {
      // Create updated profile object without the removed insight
      const updatedProfile = {
        ...profile,
        insights: profile.insights.filter(insight => insight.id !== insightId),
      };
      
      // Call updateProfile with correct parameters
      await updateProfile(
        profile.id,
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          description: profile.description,
          bio: profile.bio,
          photoUrl: profile.photoUrl
        },
        undefined, // No new photo
        [], // No insights to add
        [insightId], // Insights to remove
        [], // No groups to add
        [] // No groups to remove
      );
      
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error removing insight:', error);
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerRight: () => (
            <Pressable onPress={() => router.push(`/profile/edit?id=${profile.id}`)} style={{ marginRight: 16 }}>
              <Ionicons name="create-outline" size={24} color="#437C79" />
            </Pressable>
          ),
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTransparent: true,
        }}
      />
      <ScrollView style={styles.container} bounces={false}>
        <View style={styles.header}>
          <View style={styles.headerBackground} />
          <Pressable onPress={handleEditPhoto} style={styles.photoContainer}>
            <Image 
              source={{ 
                uri: profile.photoUrl && profile.photoUrl.trim() !== '' 
                  ? profile.photoUrl 
                  : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop'
              }} 
              style={styles.photo} 
            />
            <View style={styles.editPhotoButton}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text style={styles.name}>{`${profile.firstName} ${profile.lastName}`}</Text>
          <Text style={styles.description}>{profile.description}</Text>
          <View style={styles.groupTags}>
            {profile.groups.map((group, index) => (
              <Text key={group.id} style={styles.groupTag}>
                {group.name}
                {index < profile.groups.length - 1 ? ' · ' : ''}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={24} color="#437C79" />
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.insightInput}>
              <TextInput
                style={styles.insightTextInput}
                value={newInsight}
                onChangeText={setNewInsight}
                placeholder="Add a quick note about this person..."
                multiline
                placeholderTextColor="#77B8B6"
              />
              <Pressable
                onPress={handleAddInsight}
                style={[
                  styles.addInsightButton,
                  !newInsight.trim() && styles.addInsightButtonDisabled
                ]}>
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
            {profile.insights.length > 0 ? (
              <View style={styles.insightsList}>
                {profile.insights.map(insight => (
                  <View key={insight.id} style={styles.insightItem}>
                    <Text style={styles.insightText}>{insight.text}</Text>
                    <Pressable
                      onPress={() => handleRemoveInsight(insight.id)}
                      style={styles.removeInsight}>
                      <Ionicons name="close-circle" size={20} color="#437C79" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noInsights}>No notes added yet</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#90cac7',
  },
  loadingText: {
    fontSize: 16,
    color: '#437C79',
    textAlign: 'center',
    marginTop: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: '#437C79',
    opacity: 0.1,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  editPhotoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#437C79',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  description: {
    fontSize: 16,
    color: '#C5EEED',
    marginBottom: 8,
  },
  groupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  groupTag: {
    fontSize: 14,
    color: '#A6DDDC',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#C5EEED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#437C79',
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    color: '#437C79',
  },
  insightInput: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  insightTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#A6DDDC',
    minHeight: 44,
    color: '#437C79',
  },
  addInsightButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#437C79',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addInsightButtonDisabled: {
    backgroundColor: '#A6DDDC',
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#437C79',
  },
  removeInsight: {
    marginLeft: 8,
  },
  noInsights: {
    fontSize: 14,
    color: '#437C79',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});