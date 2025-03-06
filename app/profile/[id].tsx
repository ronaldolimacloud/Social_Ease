import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../../lib/hooks/useProfile';
import { LinearGradient } from 'expo-linear-gradient';
import { refreshImageUrl } from '../../lib/utils';
import CustomAlert from '../../components/CustomAlert';

// Import the logo directly
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/logo.png');

/**
 * Interface defining the structure of an insight/note about a person
 */
type Insight = {
  id: string;
  text: string;
  timestamp: string;
};

/**
 * Interface defining the structure of a user profile
 */
type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  description: string;
  bio: string;
  photoUrl: string;
  photoKey?: string;
  insights: Insight[];
  groups: Array<{
    id: string;
    type: string;
    name: string;
  }>;
};

/**
 * ProfileScreen component - displays a user's profile information
 * and allows interaction with that profile (adding insights, etc.)
 */
export default function ProfileScreen() {
  // Extract the profile ID from the route parameters
  const { id } = useLocalSearchParams();
  // State for storing the profile data
  const [profile, setProfile] = useState<Profile | null>(null);
  // State for managing the new insight input field
  const [newInsight, setNewInsight] = useState('');
  // Loading state for photo uploads
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // Custom hook for profile data operations
  const { getProfile, updateProfile, deleteProfile } = useProfile();
  const [refreshedPhotoUrl, setRefreshedPhotoUrl] = useState<string>('');
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  /**
   * Fetches profile data from the backend
   */
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

  // Fetch profile data when component mounts or ID changes
  useEffect(() => {
    fetchProfile();
  }, [id]);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Profile screen is focused, refreshing data");
      fetchProfile();
      return () => {}; // cleanup function
    }, [id])
  );

  // Add a function to refresh the image URL
  useEffect(() => {
    if (profile?.photoUrl && profile.photoKey) {
      refreshImageUrl(profile.photoKey, profile.photoUrl)
        .then(url => {
          setRefreshedPhotoUrl(url);
        })
        .catch(error => {
          console.error('Error refreshing profile image URL:', error);
          setRefreshedPhotoUrl(profile.photoUrl); // Fallback to stored URL
        });
    }
  }, [profile?.photoUrl, profile?.photoKey]);

  /**
   * Handles profile photo selection and update
   */
  const handleEditPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Get the selected photo URI
        const selectedPhotoUri = result.assets[0].uri;
        console.log('New photo selected:', selectedPhotoUri);
        
        if (profile) {
          try {
            // Show loading indicator
            setUploadingPhoto(true);
            
            // Call updateProfile with the new photo
            await updateProfile(
              profile.id,
              {
                firstName: profile.firstName,
                lastName: profile.lastName,
                description: profile.description,
                bio: profile.bio,
                photoUrl: profile.photoUrl // Keep the old URL reference until the new one is created
              },
              selectedPhotoUri, // Pass the photo URI to be uploaded
              [], // No insights to add
              [], // No insights to remove
              [], // No groups to add
              []  // No groups to remove
            );
            
            // Refresh the profile data to show the new photo
            await fetchProfile();
            
            // Success message could be shown here
          } catch (uploadError) {
            console.error('Failed to upload photo:', uploadError);
            // Show error message to user
            Alert.alert(
              'Upload Failed',
              'Failed to upload profile photo. Please try again later.',
              [{ text: 'OK' }]
            );
          } finally {
            // Hide loading indicator
            setUploadingPhoto(false);
          }
        }
      }
    } catch (error) {
      console.error('Error updating profile photo:', error);
      setUploadingPhoto(false);
      // Show error alert to the user
      Alert.alert(
        'Error',
        'There was a problem selecting the photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handles adding a new insight/note about the person
   */
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
      
      // Update local state
      setProfile(updatedProfile);
      setNewInsight('');
    } catch (error) {
      console.error('Error adding insight:', error);
    }
  };

  /**
   * Handles removing an insight/note
   * @param insightId - ID of the insight to remove
   */
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
      
      // Update local state
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error removing insight:', error);
    }
  };

  // Handler for deleting the profile
  const handleDeleteProfile = () => {
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await deleteProfile(id as string);
      // Navigate back after successful deletion
      router.replace('/(tabs)/profiles');
    } catch (error) {
      console.error('Error deleting profile:', error);
      Alert.alert(
        "Error",
        "Failed to delete profile. Please try again.",
        [{ text: "OK" }]
      );
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteAlert(false);
  };

  // Show loading indicator while fetching profile data
  if (!profile) {
    return (
      <LinearGradient
        colors={['#061a1a', '#020e0e']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0.5, 1]}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <>
      {/* Custom Delete Alert */}
      <CustomAlert
        visible={showDeleteAlert}
        title="Delete Profile"
        message="Are you sure you want to delete this profile? This action cannot be undone."
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleting}
        icon="trash-outline"
      />

      <Stack.Screen
        options={{
          title: '', // Empty title
          headerLeft: () => (
            <Pressable 
              onPress={() => router.back()}
              style={{ 
                marginLeft: 16,
                padding: 8,
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable 
                onPress={handleDeleteProfile}
                style={{ marginRight: 16 }}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                )}
              </Pressable>
              <Pressable 
                onPress={() => router.push(`/profile/edit?id=${profile.id}`)} 
                style={{ marginRight: 16 }}
              >
                <Ionicons name="create-outline" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          ),
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTransparent: true,
          headerTitle: () => null, // Remove header title completely
          headerShadowVisible: false,
        }}
      />
      <LinearGradient
        colors={['#061a1a', '#020e0e']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0.5, 1]}
      >
        <ScrollView style={styles.container} bounces={false}>
          {/* Profile Header Section */}
          <View style={styles.header}>
            {/* Profile Photo with Edit Button */}
            <Pressable 
              onPress={handleEditPhoto} 
              style={styles.photoContainer}
              disabled={uploadingPhoto} // Disable when uploading
            >
              <Image 
                source={
                  refreshedPhotoUrl && refreshedPhotoUrl.trim() !== '' 
                    ? { uri: refreshedPhotoUrl }
                    : profile.photoUrl && profile.photoUrl.trim() !== '' 
                      ? { uri: profile.photoUrl }
                      : DEFAULT_PROFILE_IMAGE 
                }
                style={styles.photo} 
              />
              <View style={styles.editPhotoButton}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                )}
              </View>
            </Pressable>
            {/* Profile Name and Description */}
            <Text style={styles.name}>{`${profile.firstName} ${profile.lastName}`}</Text>
            <Text style={styles.description}>{profile.description}</Text>
            {/* Group membership tags */}
            <View style={styles.groupTags}>
              {profile.groups.map((group, index) => (
                <Text key={group.id} style={styles.groupTag}>
                  {group.name}
                  {index < profile.groups.length - 1 ? ' · ' : ''}
                </Text>
              ))}
            </View>
          </View>

          {/* Main Content Section */}
          <View style={styles.content}>
            {/* About/Bio Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>

                <Text style={styles.sectionTitle}>About</Text>
              </View>
              <Text style={styles.bio}>{profile.bio}</Text>
            </View>

            {/* Insights/Notes Section */}
            <View style={styles.section}>
              {/* List of existing insights */}
              {profile.insights.length > 0 ? (
                <View style={styles.insightsList}>
                  {profile.insights.map(insight => (
                    <View key={insight.id} style={styles.insightItem}>
                      <Text style={styles.insightText}>{insight.text}</Text>
                      <Pressable
                        onPress={() => handleRemoveInsight(insight.id)}
                        style={styles.removeInsight}>
                        <Ionicons name="close-circle" size={20} color="#85c3c0" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noInsights}>No notes added yet</Text>
              )}
              
              {/* Input for adding new insights */}
              <View style={styles.insightInput}>
                <TextInput
                  style={styles.insightTextInput}
                  value={newInsight}
                  onChangeText={setNewInsight}
                  placeholder="Add a quick note..."
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
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </>
  );
}

/**
 * StyleSheet for the ProfileScreen component
 * Uses a teal/turquoise color scheme with white accents
 */
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingText: {
    fontSize: 16,
    color: '#85c3c0',
    textAlign: 'center',
    marginTop: 32,
  },
  // Header styles
  header: {
    alignItems: 'center',
    paddingTop: 100,
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
    opacity: 1,
  },
  // Profile photo styles
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  editPhotoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#437C79',
    width: 30,
    height: 30,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: '#FFFFFF',
  },
  // Profile text styles
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: '#85c3c0',
    marginBottom: 5,
  },
  // Group tag styles
  groupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 2,
  },
  groupTag: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  // Content section styles
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
    backgroundColor: 'rgba(144, 202, 199, 0.1)', // Light teal background at 50% opacity
    borderRadius: 10,
    padding: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '200',
    color: '#FFFFFF',
    marginLeft: 1,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    color: '#85c3c0',
  },
  // Insight input styles
  insightInput: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  insightTextInput: {
    flex: 1,
    padding: 12,
    fontSize: 15,
    color: '#FFFFFF',
  },
  addInsightButton: {
    backgroundColor: '#437C79',
    borderRadius: 8,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addInsightButtonDisabled: {
    backgroundColor: 'rgba(67, 124, 121, 0.5)',
  },
  // Insight list styles
  insightsList: {
    marginTop: 8,
  },
  insightItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  removeInsight: {
    padding: 4,
  },
  noInsights: {
    fontSize: 14,
    color: '#85c3c0',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});