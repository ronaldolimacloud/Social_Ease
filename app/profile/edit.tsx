import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Modal, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../../lib/hooks/useProfile';
import { client } from '../../lib/amplify';
import { LinearGradient } from 'expo-linear-gradient';

// Import the logo directly
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/logo.png');

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  description: string;
  bio: string;
  photoUrl: string;
  insights: Array<{
    id: string;
    text: string;
    timestamp: string;
  }>;
  groups: Array<{
    id: string;
    type: string;
    name: string;
  }>;
};

// Define Group type to match what comes from the database
type Group = {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  _version?: number;
};

export default function EditProfileScreen() {
  const { id } = useLocalSearchParams();
  const { getProfile, updateProfile } = useProfile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [description, setDescription] = useState('');
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState<string>('');
  const [selectedGroups, setSelectedGroups] = useState<Array<{ id: string; type: string; name: string; }>>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch groups from the database
  useEffect(() => {
    // Load groups when modal is opened (match new.tsx behavior)
    if (showGroupModal) {
      (async () => {
        try {
          setLoadingGroups(true);
          const result = await client.models.Group.list({ limit: 1000 });
          if (result.data) {
            const validGroups = result.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              type: item.type || 'general',
              description: item.description || undefined,
              _version: (item as any)._version,
            }));
            setAvailableGroups(validGroups);
          }
        } catch (error) {
          console.error('Error fetching groups:', error);
        } finally {
          setLoadingGroups(false);
        }
      })();
    }
  }, [showGroupModal]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (typeof id === 'string') {
          const result = await getProfile(id, true);
          
          // Make sure result has the expected shape
          if (result && result.profile) {
            const profile = result.profile;
            const extendedData = result.extendedData || { insightsData: [], groupsData: [] };
            
            // Format the profile data with the extended data
            const formattedProfile: Profile = {
              id: profile.id || '',
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              description: profile.description || '',
              bio: profile.bio || '',
              photoUrl: profile.photoUrl || '',
              insights: extendedData.insightsData || [],
              groups: extendedData.groupsData || []
            };
            
            setProfile(formattedProfile);
            setFirstName(formattedProfile.firstName);
            setLastName(formattedProfile.lastName);
            setDescription(formattedProfile.description);
            setBio(formattedProfile.bio);
            setPhotoUri(formattedProfile.photoUrl);
            setSelectedGroups(formattedProfile.groups);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        // Optionally handle error state here
      }
    };
    fetchProfile();
  }, [id]);

  const handleSelectPhoto = async () => {
    try {
      // Request permissions first if needed
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'You need to allow access to your photos to change your profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Slightly reduced quality for better upload performance
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        console.log("Selected image URI:", selectedImageUri);
        setPhotoUri(selectedImageUri);
        setUploadingPhoto(true);
        
        try {
          // Simulate upload progress - this is just UI feedback, not actual upload
          setTimeout(() => {
            setUploadingPhoto(false);
          }, 1500);
        } catch (error) {
          setUploadingPhoto(false);
          console.error('Error processing selected photo:', error);
        }
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert(
        'Error',
        'There was a problem selecting the photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

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

  const handleSave = async () => {
    if (!profile) return;

    // Validate required fields
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(
        'Missing Information',
        'Please provide your first and last name.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Prepare profile data for update
    const profileData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      description: description.trim(),
      bio: bio.trim(),
    };

    try {
      // Show saving indicator
      setSavingProfile(true);
      
      // Determine if we have a new photo to upload
      const hasNewPhoto = photoUri !== profile.photoUrl;
      const photoToUpload = hasNewPhoto ? photoUri : undefined;

      // Calculate groups to add and remove
      const currentGroupIds = profile.groups.map(g => g.id);
      const selectedGroupIds = selectedGroups.map(g => g.id);
      
      const groupsToAdd = selectedGroups.filter(g => !currentGroupIds.includes(g.id));
      const groupsToRemove = profile.groups
        .filter(g => !selectedGroupIds.includes(g.id))
        .map(g => g.id);
        
      console.log("Updating profile with photo:", hasNewPhoto ? "new photo" : "no new photo");
      if (hasNewPhoto) {
        console.log("Photo URI to upload:", photoToUpload);
      }

      const updatedProfile = await updateProfile(
        profile.id,       // ID of the profile to update
        profileData,      // Basic profile data
        photoToUpload,    // New photo if any
        [],               // No insights to add
        [],               // No insights to remove
        groupsToAdd,      // Groups to add
        groupsToRemove    // Groups to remove
      );
      
      console.log("Profile updated successfully:", updatedProfile.id);
      if (updatedProfile.photoUrl) {
        console.log("New photo URL:", updatedProfile.photoUrl);
      }
      
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message to the user
      Alert.alert(
        'Update Failed',
        'There was a problem updating your profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSavingProfile(false);
    }
  };

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
          <Text style={styles.containerLoadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerRight: () => (
            <Pressable 
              onPress={handleSave} 
              style={{ marginRight: 16 }}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 17 }}>Save</Text>
              )}
            </Pressable>
          ),
        }}
      />
      <LinearGradient
        colors={['#061a1a', '#020e0e']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0.5, 1]}
      >
        <ScrollView style={styles.container}>
          <Pressable 
            onPress={handleSelectPhoto} 
            style={styles.photoContainer}
            disabled={uploadingPhoto || savingProfile}
          >
            <Image 
              source={
                photoUri && photoUri.trim() !== '' 
                  ? { uri: photoUri }
                  : profile.photoUrl && profile.photoUrl.trim() !== '' 
                    ? { uri: profile.photoUrl }
                    : DEFAULT_PROFILE_IMAGE
              } 
              style={styles.photo}
              contentFit="cover"
              transition={{
                duration: 400,
                effect: 'cross-dissolve'
              }}
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

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Enter bio"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Groups</Text>
              <Pressable 
                style={styles.groupSelector}
                onPress={() => setShowGroupModal(true)}>
                <Text style={styles.selectedGroupsText}>
                  {selectedGroups.length > 0 
                    ? `${selectedGroups.length} group${selectedGroups.length === 1 ? '' : 's'} selected`
                    : 'No groups selected'}
                </Text>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
              {selectedGroups.length > 0 && (
                <View style={styles.selectedGroups}>
                  {selectedGroups.map(group => (
                    <View key={group.id} style={styles.selectedGroupBadge}>
                      <Text style={styles.selectedGroupBadgeText}>{group.name}</Text>
                      <Pressable
                        onPress={() => toggleGroup(group)}
                        style={styles.removeButtonContainer}>
                        <Ionicons name="close-circle" size={20} color="#85c3c0" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={showGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGroupModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Groups</Text>
            </View>
            
            {loadingGroups ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#85c3c0" />
                <Text style={styles.loadingText}>Loading groups...</Text>
              </View>
            ) : (
              <ScrollView style={styles.groupList}>
                {availableGroups.length === 0 ? (
                  <View style={styles.emptyGroupsContainer}>
                    <Text style={styles.emptyGroupsText}>No groups available</Text>
                  </View>
                ) : (
                  availableGroups.map(group => {
                    const isSelected = selectedGroups.some(g => g.id === group.id);
                    return (
                      <Pressable
                        key={group.id}
                        style={[styles.groupItem, isSelected && styles.groupItemSelected]}
                        onPress={() => toggleGroup(group)}>
                        <View style={[
                          styles.groupIcon,
                          { backgroundColor: 
                            group.type === 'work' ? '#E3F2FD' : 
                            group.type === 'school' ? '#E8F5E9' : 
                            group.type === 'social' ? '#FFF3E0' : '#F5F5F5' 
                          }
                        ]}>
                          <Ionicons 
                            name={
                              group.type === 'work' ? 'business' : 
                              group.type === 'school' ? 'school' : 
                              group.type === 'social' ? 'people' : 'grid'
                            } 
                            size={24} 
                            color={
                              group.type === 'work' ? '#1976D2' : 
                              group.type === 'school' ? '#388E3C' : 
                              group.type === 'social' ? '#F57C00' : '#757575'
                            }
                          />
                        </View>
                        <View style={styles.groupInfo}>
                          <Text style={styles.groupName}>{group.name}</Text>
                          <Text style={styles.groupType}>
                            {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                        )}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>
            )}
            
            <Pressable 
              style={styles.modalDone}
              onPress={() => setShowGroupModal(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  containerLoadingText: {
    fontSize: 16,
    color: '#85c3c0',
    textAlign: 'center',
    marginTop: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',

    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 0.4,
    borderColor: '#FFFFFF',
  },
  editPhotoButton: {
    position: 'absolute',
    right: '50%',
    bottom: 20,
    marginRight: -20,
    backgroundColor: '#437C79',
    width: 30,
    height: 30,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(144, 202, 199, 0.1)', 
    borderRadius: 8,
    padding: 7,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 0.1,
    borderColor: 'rgba(229, 229, 229, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 2,
  },
  bioInput: {
    backgroundColor: 'rgba(144, 202, 199, 0.1)', 
    borderRadius: 8,
    padding: 7,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 0.1,
    borderColor: 'rgba(229, 229, 229, 0.3)',
  },
  groupSelector: {
    backgroundColor: 'rgba(144, 202, 199, 0.1)', 
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 229, 0.3)',
  },
  selectedGroupsText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  addButtonText: {
    color: '#85c3c0',
    fontSize: 15,
    fontWeight: '400',
  },
  selectedGroups: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  selectedGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(67, 124, 121, 0.5)', // Semi-transparent background that matches theme
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectedGroupBadgeText: {
    color: '#FFFFFF', // White text for better visibility
    marginRight: 4,
  },
  removeButtonContainer: {
    marginLeft: 4,
  },
  removeButton: {
    color: '#85c3c0', // Updated to match the color scheme
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#061a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 229, 229, 0.2)',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  groupList: {
    paddingHorizontal: 16,
    maxHeight: 400,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 229, 229, 0.2)',
  },
  groupItemSelected: {
    backgroundColor: 'rgba(67, 124, 121, 0.3)', // Semi-transparent highlight
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#437C79',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  groupType: {
    fontSize: 14,
    color: '#85c3c0',
  },
  modalDone: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 229, 229, 0.2)',
    alignItems: 'center',
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#85c3c0',
  },
  loadingText: {
    fontSize: 16,
    color: '#85c3c0',
    textAlign: 'center',
  },
  emptyGroupsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyGroupsText: {
    fontSize: 16,
    color: '#85c3c0', // Updated to match the color scheme
    textAlign: 'center',
  },
  emptyGroupsSubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});