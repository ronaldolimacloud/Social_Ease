import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../lib/hooks/useProfile';
import { useGroup } from '../lib/hooks/useGroup';

type Group = {
  id: string;
  name: string;
  type?: string;
  description?: string;
};

type Insight = {
  id: string;
  text: string;
  timestamp: string;
};

type ProfileModalProps = {
  visible: boolean;
  onClose: () => void;
};

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop';

export default function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [description, setDescription] = useState('');
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [newInsight, setNewInsight] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);
  const { createProfile, loading, error } = useProfile();
  const { listGroups } = useGroup();

  // Fetch available groups when the component mounts or when the modal is opened
  useEffect(() => {
    if (showGroupModal) {
      fetchGroups();
    }
  }, [showGroupModal]);

  // Fetch groups from the database
  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const result = await listGroups();
      if (result.data) {
        // Map the data to our Group type
        const groups = result.data.map(group => ({
          id: group.id,
          name: group.name,
          type: group.type,
          description: group.description || undefined
        }));
        setAvailableGroups(groups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      Alert.alert(
        'Error',
        'Failed to load groups. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Sorry, we need camera roll permissions to make this work!',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  const handleSelectPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to select photo. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddInsight = () => {
    if (newInsight.trim() === '') return;
    
    const insight = {
      id: Date.now().toString(),
      text: newInsight,
      timestamp: new Date().toISOString(),
    };
    
    setInsights([...insights, insight]);
    setNewInsight('');
    
    // Scroll to the bottom of the insights list
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleRemoveInsight = (id: string) => {
    setInsights(insights.filter(insight => insight.id !== id));
  };

  const handleToggleGroup = (group: Group) => {
    const isSelected = selectedGroups.some(g => g.id === group.id);
    
    if (isSelected) {
      // Remove the group
      setSelectedGroups(selectedGroups.filter(g => g.id !== group.id));
    } else {
      // Add the group
      setSelectedGroups([...selectedGroups, group]);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDescription('');
    setBio('');
    setPhotoUri(null);
    setSelectedGroups([]);
    setInsights([]);
    setNewInsight('');
  };

  const handleSave = async () => {
    // Validate required fields
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required.');
      return;
    }

    try {
      // Create the profile with the correct parameter structure
      // Based on the createProfile signature from useProfile:
      // createProfile(input: ProfileInput, photoFile?: string, insights: InsightInput[] = [], groups: GroupInput[] = [])
      const profileInput = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        description: description.trim(),
        bio: bio.trim(),
        photoUrl: photoUri || DEFAULT_PHOTO,
      };

      // Convert insights to the format expected by the API
      const insightsInput = insights.map(insight => ({
        text: insight.text,
        timestamp: insight.timestamp,
      }));

      // Convert groups to the format expected by the API
      const groupsInput = selectedGroups.map(group => ({
        id: group.id,
        name: group.name,
        type: group.type || '',
      }));

      console.log('Creating new profile...');
      const result = await createProfile(
        profileInput,         // ProfileInput
        undefined,            // photoFile (we're using photoUrl directly)
        insightsInput,        // insights
        groupsInput           // groups
      );

      if (result) {
        console.log('Profile created successfully:', result);
        
        // First reset form before showing alert to ensure clean state
        resetForm();
        
        // Close modal first, then show alert
        // This is important: closing the modal before showing the alert
        // allows the parent component to start refreshing data
        onClose();
        
        // Show success message after modal is closed
        Alert.alert(
          "Success",
          "Profile created successfully!"
        );
      } else {
        throw new Error('Failed to create profile - no data returned');
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      Alert.alert(
        'Error',
        error || 'Failed to create profile. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Profile</Text>
              <Pressable 
                onPress={handleCancel}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Photo Selection */}
                <View style={styles.photoContainer}>
                  <Image 
                    source={{ uri: photoUri || DEFAULT_PHOTO }} 
                    style={styles.photo}
                  />
                  <Pressable
                    onPress={handleSelectPhoto}
                    style={styles.photoButton}
                  >
                    <Text style={styles.photoButtonText}>
                      {photoUri ? 'Change Photo' : 'Select Photo'}
                    </Text>
                  </Pressable>
                </View>

                {/* Basic Information */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter first name"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter last name"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.input}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Brief description (e.g., role, profession)"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about this person..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Groups Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Groups</Text>
                  <Pressable
                    style={styles.groupButton}
                    onPress={() => setShowGroupModal(true)}
                  >
                    <Text style={styles.groupButtonText}>
                      {selectedGroups.length > 0
                        ? `${selectedGroups.length} Group${selectedGroups.length > 1 ? 's' : ''} Selected`
                        : 'Select Groups'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#437C79" />
                  </Pressable>
                  {selectedGroups.length > 0 && (
                    <View style={styles.selectedGroupsList}>
                      {selectedGroups.map(group => (
                        <View key={group.id} style={styles.selectedGroupItem}>
                          <Text style={styles.selectedGroupText}>{group.name}</Text>
                          <Pressable
                            onPress={() => handleToggleGroup(group)}
                            style={styles.removeGroupButton}
                          >
                            <Ionicons name="close-circle" size={16} color="#666" />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Insights Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Insights & Notes</Text>
                  <View style={styles.insightsContainer}>
                    {insights.map(insight => (
                      <View key={insight.id} style={styles.insightItem}>
                        <Text style={styles.insightText}>{insight.text}</Text>
                        <Pressable
                          onPress={() => handleRemoveInsight(insight.id)}
                          style={styles.removeInsightButton}
                        >
                          <Ionicons name="close-circle" size={16} color="#666" />
                        </Pressable>
                      </View>
                    ))}
                    <View style={styles.addInsightContainer}>
                      <TextInput
                        style={styles.insightInput}
                        value={newInsight}
                        onChangeText={setNewInsight}
                        placeholder="Add a note or insight..."
                        placeholderTextColor="#999"
                        multiline
                      />
                      <Pressable
                        onPress={handleAddInsight}
                        style={styles.addInsightButton}
                        disabled={newInsight.trim() === ''}
                      >
                        <Ionicons
                          name="add-circle"
                          size={24}
                          color={newInsight.trim() === '' ? '#CCC' : '#437C79'}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* Save Button */}
                <Pressable
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Profile</Text>
                  )}
                </Pressable>
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Group Selection Modal */}
            <Modal
              visible={showGroupModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowGroupModal(false)}
            >
              <View style={styles.groupModalContainer}>
                <View style={styles.groupModalContent}>
                  <View style={styles.groupModalHeader}>
                    <Text style={styles.groupModalTitle}>Select Groups</Text>
                    <Pressable 
                      onPress={() => setShowGroupModal(false)}
                      style={styles.groupModalClose}
                    >
                      <Ionicons name="close" size={24} color="#666666" />
                    </Pressable>
                  </View>

                  {loadingGroups ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#007AFF" />
                      <Text style={styles.loadingText}>Loading groups...</Text>
                    </View>
                  ) : (
                    <ScrollView style={styles.groupList}>
                      {availableGroups.length === 0 ? (
                        <Text style={styles.noGroupsText}>No groups available. Create groups first.</Text>
                      ) : (
                        availableGroups.map(group => {
                          const isSelected = selectedGroups.some(g => g.id === group.id);
                          return (
                            <Pressable
                              key={group.id}
                              style={[styles.groupItem, isSelected && styles.groupItemSelected]}
                              onPress={() => handleToggleGroup(group)}
                            >
                              <Text style={[styles.groupItemText, isSelected && styles.groupItemTextSelected]}>
                                {group.name}
                              </Text>
                              {isSelected && (
                                <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                              )}
                            </Pressable>
                          );
                        })
                      )}
                    </ScrollView>
                  )}

                  <Pressable
                    style={styles.groupModalDoneButton}
                    onPress={() => setShowGroupModal(false)}
                  >
                    <Text style={styles.groupModalDoneButtonText}>Done</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    height: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#437C79',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
  },
  photoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#437C79',
    borderRadius: 20,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 4,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  groupButtonText: {
    color: '#437C79',
    fontWeight: '500',
  },
  selectedGroupsList: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedGroupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4F4',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  selectedGroupText: {
    color: '#437C79',
    fontSize: 14,
    marginRight: 4,
  },
  removeGroupButton: {
    padding: 2,
  },
  insightsContainer: {
    marginTop: 4,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  insightText: {
    flex: 1,
    color: '#333',
  },
  removeInsightButton: {
    padding: 4,
  },
  addInsightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  insightInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  addInsightButton: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#437C79',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#A0CCC9',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  groupModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  groupModalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  groupModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  groupModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  groupModalClose: {
    padding: 4,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  groupList: {
    maxHeight: 300,
  },
  noGroupsText: {
    padding: 16,
    textAlign: 'center',
    color: '#666',
  },
  groupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  groupItemSelected: {
    backgroundColor: '#E8F4F4',
  },
  groupItemText: {
    fontSize: 16,
    color: '#333',
  },
  groupItemTextSelected: {
    color: '#437C79',
    fontWeight: '500',
  },
  groupModalDoneButton: {
    backgroundColor: '#437C79',
    padding: 12,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  groupModalDoneButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
}); 