import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Dimensions } from 'react-native';

// Max height for the scrollable groups list inside the modal (50% of screen height)
const MODAL_GROUP_LIST_MAX_HEIGHT = Math.floor(Dimensions.get('window').height * 0.5);
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../../lib/hooks/useProfile';
import { useGroup } from '../../lib/hooks/useGroup';
import { LinearGradient } from 'expo-linear-gradient';
// Local-only images: no CloudFront/S3 utilities
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
 * Interface defining the structure of a profile
 */
type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  description: string;
  bio: string;
  photoUrl: string | null;
  photoKey?: string | null;
  insights?: any;
  groups?: any;
};

// Add a type for our extended data
type ExtendedProfileData = {
  insightsData: Array<{
    id: string;
    text: string;
    timestamp: string;
  }>;
  groupsData: Array<{
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [extendedData, setExtendedData] = useState<ExtendedProfileData | null>(null);
  const [newInsight, setNewInsight] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { getProfile, updateProfile, deleteProfile } = useProfile();
  const { listGroups } = useGroup();
  const [refreshedPhotoUrl, setRefreshedPhotoUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  // Add new state for group management
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<Array<{ id: string; type: string; name: string; }>>([]);
  const [selectedGroups, setSelectedGroups] = useState<Array<{ id: string; type: string; name: string; }>>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Inline edit mode state
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [description, setDescription] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  

  /**
   * Fetches profile data from the backend
   */
  const fetchProfile = async () => {
    try {
      if (typeof id === 'string') {
        console.log("Fetching profile data for ID:", id);
        const result = await getProfile(id, true);
        
        // Output debug info about the result structure
        console.log("Profile result:", {
          hasProfile: !!result?.profile,
          hasExtendedData: !!result?.extendedData,
          photoUrl: result?.profile?.photoUrl,
          photoKey: result?.profile?.photoKey,
          // Use a safer approach to log function properties
          functionProps: result?.profile ? 
            Object.entries(result.profile as any)
              .filter(([_, value]) => typeof value === 'function')
              .map(([key]) => key) 
            : []
        });
        
        if (result && result.profile) {
          // Set the profile from the nested profile property
          setProfile(result.profile as Profile);
          // Prefill edit fields
          setFirstName((result.profile as Profile).firstName || '');
          setLastName((result.profile as Profile).lastName || '');
          setDescription((result.profile as Profile).description || '');
          setBio((result.profile as Profile).bio || '');
          
          // If we have extended data, store it separately
          if (result.extendedData) {
            setExtendedData(result.extendedData);
            console.log("Loaded insights:", result.extendedData.insightsData?.length || 0);
            console.log("Loaded groups:", result.extendedData.groupsData?.length || 0);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Fetching is handled by focus effect with freshness guard

  // Refresh profile data when screen comes into focus, but only if it's been more than 30 seconds
  // since the last fetch or if no profile data exists
  const lastFetchTimeRef = useRef<number>(0);
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const shouldRefetch = !profile || (now - lastFetchTimeRef.current > 30000);
      
      if (shouldRefetch) {
        console.log("Profile screen is focused, refreshing data");
        fetchProfile();
        lastFetchTimeRef.current = now;
      } else {
        console.log("Profile screen is focused, using cached data");
      }
      
      return () => {}; // cleanup function
    }, [id, profile])
  );

  // Optimize image URL resolution with a simplified approach
  useEffect(() => {
    // Local-only: use the stored local URI or clear
    if (profile?.photoUrl && profile.photoUrl.trim() !== '') {
      setRefreshedPhotoUrl(profile.photoUrl);
    } else {
      setRefreshedPhotoUrl(null);
    }
  }, [profile?.photoUrl]);

  /**
   * Handles profile photo selection and update
   */
  const handleEditPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
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
                description: profile.description || '',
                bio: profile.bio || '',
                photoUrl: profile.photoUrl !== null ? profile.photoUrl : undefined // Convert null to undefined
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

    const insight = {
      id: Date.now().toString(),
      text: newInsight.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      // Call updateProfile with the new insight
      await updateProfile(
        profile.id,
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          description: profile.description || '',
          bio: profile.bio || '',
          photoUrl: profile.photoUrl !== null ? profile.photoUrl : undefined // Convert null to undefined
        },
        undefined, // No new photo
        [{ text: insight.text, timestamp: insight.timestamp }], // Insights to add
        [], // No insights to remove
        [], // No groups to add
        [] // No groups to remove
      );
      
      // Update local state
      setNewInsight('');
      
      // Refresh the profile to show the new insight
      fetchProfile();
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
      // Call updateProfile with correct parameters
      await updateProfile(
        profile.id,
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          description: profile.description || '',
          bio: profile.bio || '',
          photoUrl: profile.photoUrl !== null ? profile.photoUrl : undefined // Convert null to undefined
        },
        undefined, // No new photo
        [], // No insights to add
        [insightId], // Insights to remove
        [], // No groups to add
        [] // No groups to remove
      );
      
      // Update local extendedData state
      if (extendedData) {
        setExtendedData({
          ...extendedData,
          insightsData: extendedData.insightsData.filter(insight => insight.id !== insightId)
        });
      }
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
      router.replace('/(tabs)/profilesao/profiles');
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

  /**
   * Fetches all available groups for selection
   */
  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const result = await listGroups({ limit: 1000 });
      if (result && result.data) {
        // Format the groups to match our expected structure
        const formattedGroups = result.data.map(group => ({
          id: group.id,
          type: group.type || 'general',
          name: group.name
        }));
        setAvailableGroups(formattedGroups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  /**
   * Toggle edit mode
   */
  const toggleEditMode = () => {
    if (!editMode && profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setDescription(profile.description || '');
      setBio(profile.bio || '');
    }
    setEditMode(prev => !prev);
  };

  /**
   * Save inline text edits
   */
  const handleSaveProfile = async () => {
    if (!profile) return;
    try {
      setSavingProfile(true);
      await updateProfile(
        profile.id,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          description: description.trim(),
          bio: bio.trim(),
          photoUrl: profile.photoUrl !== null ? profile.photoUrl : undefined
        },
        undefined,
        [],
        [],
        [],
        []
      );
      await fetchProfile();
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile edits:', error);
      Alert.alert('Update Failed', 'There was a problem updating the profile. Please try again.', [{ text: 'OK' }]);
    } finally {
      setSavingProfile(false);
    }
  };
  
  /**
   * Toggles a group selection (add/remove)
   */
  const toggleGroup = (group: { id: string; type: string; name: string; }) => {
    setSelectedGroups(current => {
      const isSelected = current.some(g => g.id === group.id);
      if (isSelected) {
        return current.filter(g => g.id !== group.id);
      } else {
        return [...current, group];
      }
    });
  };
  
  /**
   * Handles saving group changes
   */
  const handleSaveGroups = async () => {
    if (!profile) return;
    
    try {
      // Calculate groups to add and remove
      const currentGroupIds = extendedData?.groupsData?.map(g => g.id) || [];
      const selectedGroupIds = selectedGroups.map(g => g.id);
      
      const groupsToAdd = selectedGroups.filter(g => !currentGroupIds.includes(g.id));
      const groupsToRemove = (extendedData?.groupsData || [])
        .filter(g => !selectedGroupIds.includes(g.id))
        .map(g => g.id);
      
      // Call updateProfile with the correct parameters
      await updateProfile(
        profile.id,
        {
          firstName: profile.firstName,
          lastName: profile.lastName,
          description: profile.description || '',
          bio: profile.bio || '',
          photoUrl: profile.photoUrl !== null ? profile.photoUrl : undefined
        },
        undefined, // No new photo
        [], // No insights to add
        [], // No insights to remove
        groupsToAdd, // Groups to add
        groupsToRemove // Groups to remove
      );
      
      // Close modal and refresh profile
      setShowGroupModal(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating groups:', error);
    }
  };
  
  // Update useEffect to set selected groups when profile data changes
  useEffect(() => {
    if (extendedData && extendedData.groupsData) {
      setSelectedGroups(extendedData.groupsData);
    }
  }, [extendedData]);
  
  // Load groups when modal opens (same pattern as new.tsx)
  useEffect(() => {
    if (showGroupModal) {
      fetchGroups();
    }
  }, [showGroupModal]);

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
        message="Are you sure you want to permanently delete this profile? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
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
              onPress={() => router.replace('/(tabs)/profilesao/profiles')}
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
              {editMode ? (
                <Pressable 
                  onPress={handleSaveProfile}
                  style={{ marginRight: 16 }}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  )}
                </Pressable>
              ) : (
                <Pressable 
                  onPress={toggleEditMode} 
                  style={{ marginRight: 16 }}
                >
                  <Ionicons name="create-outline" size={24} color="#FFFFFF" />
                </Pressable>
              )}
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
                    : profile?.photoUrl && profile.photoUrl.trim() !== '' 
                      ? { uri: profile.photoUrl }
                      : DEFAULT_PROFILE_IMAGE 
                }
                style={styles.photo}
                contentFit="cover"
                transition={300}
                placeholder={DEFAULT_PROFILE_IMAGE}
                cachePolicy="memory-disk"
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
            {editMode ? (
              <View style={{ width: '100%', paddingHorizontal: 16 }}>
                <View style={styles.inlineRow}>
                  <TextInput
                    style={[styles.nameInput, { flex: 1, marginRight: 8 }]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First name"
                    placeholderTextColor="#77B8B6"
                  />
                  <TextInput
                    style={[styles.nameInput, { flex: 1, marginLeft: 8 }]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last name"
                    placeholderTextColor="#77B8B6"
                  />
                </View>
                <TextInput
                  style={styles.descriptionInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description"
                  placeholderTextColor="#77B8B6"
                />
              </View>
            ) : (
              <>
                <Text style={styles.name}>{`${profile.firstName} ${profile.lastName}`}</Text>
                <Text style={styles.description}>{profile.description}</Text>
              </>
            )}
            {/* Group membership tags */}
            <View style={styles.groupTags}>
              {profile.groups && Array.isArray(profile.groups) ? (
                profile.groups.map((group, index) => (
                  <Text key={group.id} style={styles.groupTag}>
                    {group.name}
                    {index < profile.groups.length - 1 ? ' · ' : ''}
                  </Text>
                ))
              ) : extendedData && extendedData.groupsData ? (
                extendedData.groupsData.map((group, index) => (
                  <Text key={group.id} style={styles.groupTag}>
                    {group.name}
                    {index < extendedData.groupsData.length - 1 ? ' · ' : ''}
                  </Text>
                ))
              ) : (
                <Text style={styles.emptyGroupTag}>No groups</Text>
              )}
            </View>
          </View>

          {/* Main Content Section */}
          <View style={styles.content}>
            {/* About/Bio Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>About</Text>
              </View>
              {editMode ? (
                <TextInput
                  style={styles.bioEdit}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Write a short bio..."
                  placeholderTextColor="#77B8B6"
                  multiline
                />
              ) : (
                <Text style={styles.bio}>{profile.bio}</Text>
              )}
            </View>

            {/* Insights/Notes Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Notes & Insights</Text>
              </View>
              
              {/* Replace the add button and conditional form with direct input like in working example */}
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
              
              {/* List of existing insights */}
              {extendedData?.insightsData && extendedData.insightsData.length > 0 ? (
                <View style={styles.insightsList}>
                  {extendedData.insightsData.map(insight => (
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
            </View>
            
            {/* Groups section removed (group tags already shown under name) */}
          </View>
        </ScrollView>
      </LinearGradient>
      
      {/* Group selection modal removed */}
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
    width: 200,
    height: 200,
    borderRadius: 10,
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
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  descriptionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 8,
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
  bioEdit: {
    fontSize: 15,
    lineHeight: 22,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  // Insight input styles
  insightInput: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 12,
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
  cancelInsightButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    borderRadius: 8,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
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
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: 16,
    backgroundColor: 'rgba(144, 202, 199, 0.1)', // Light teal background at 50% opacity
    borderRadius: 10,
    padding: 12,
  },
  addButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightDate: {
    fontSize: 12,
    color: '#85c3c0',
    marginLeft: 8,
  },
  deleteInsightButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#85c3c0',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupIcon: {
    marginRight: 8,
  },
  groupName: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyGroupTag: {
    fontSize: 14,
    color: '#85c3c0',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  groupsList: {
    marginTop: 8,
  },
  noGroups: {
    fontSize: 14,
    color: '#85c3c0',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#061a1a',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 4,
  },
  groupListContainer: {
    maxHeight: MODAL_GROUP_LIST_MAX_HEIGHT,
  },
  emptyGroupsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalGroupItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#437C79',
    borderRadius: 8,
    padding: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});