import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, ActivityIndicator, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../../lib/hooks/useProfile';
import { useGroup } from '../../lib/hooks/useGroup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// Import the logo directly
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/logo.png');
const WINDOW_HEIGHT = Dimensions.get('window').height;

export default function NewProfileScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { createProfile, loading, error } = useProfile();
  const { listGroups } = useGroup();

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
        'Failed to select image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddInsight = () => {
    if (newInsight.trim()) {
      const insight: Insight = {
        id: Date.now().toString(),
        text: newInsight.trim(),
        timestamp: new Date().toISOString(),
      };
      setInsights([...insights, insight]);
      setNewInsight('');
    }
  };

  const handleRemoveInsight = (id: string) => {
    setInsights(insights.filter(insight => insight.id !== id));
  };

  const isFormValid = firstName.trim();

  const handleSave = async () => {
    if (!isFormValid) return;

    try {
      const newProfile = await createProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        description: description.trim(),
        bio: bio.trim(),
      }, photoUri || undefined, 
      insights.map(insight => ({
        text: insight.text,
        timestamp: insight.timestamp
      })),
      selectedGroups.map(group => ({
        id: group.id,
        name: group.name,
        type: group.type || 'general' // Provide a default value for type
      })));

      if (newProfile) {
        router.replace('/(tabs)/profiles');
      }
    } catch (err) {
      Alert.alert(
        'Error',
        'Failed to create profile. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleGroup = (group: Group) => {
    setSelectedGroups(current => {
      const isSelected = current.some(g => g.id === group.id);
      if (isSelected) {
        return current.filter(g => g.id !== group.id);
      } else {
        return [...current, group];
      }
    });
  };

  // Improved input focus handler with smoother scrolling
  const handleInputFocus = (inputHeight: number, yPosition: number) => {
    // Add a small delay to ensure the keyboard is visible when scrolling
    setTimeout(() => {
      // Calculate a better position that accounts for the keyboard and keeps the input in view
      const scrollToY = Math.max(0, yPosition - 120);
      
      scrollViewRef.current?.scrollTo({
        y: scrollToY,
        animated: true,
      });
    }, 50);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Profile',
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
        }}
      />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: keyboardVisible ? 200 : 100 }
          ]}
        >
          <View style={styles.photoWrapper}>
            <View style={styles.photoContainer}>
              <Image 
                source={photoUri ? { uri: photoUri } : DEFAULT_PROFILE_IMAGE} 
                style={styles.photo}
                contentFit="cover"
                transition={{
                  duration: 400,
                  effect: 'cross-dissolve'
                }}
                placeholder={DEFAULT_PROFILE_IMAGE}
                cachePolicy="memory-disk"
              />
              <Pressable
                style={styles.editPhotoButton}
                onPress={handleSelectPhoto}>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name<Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, !firstName.trim() && styles.inputError]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                onFocus={() => handleInputFocus(40, 180)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name <Text style={styles.optional}>(Optional)</Text></Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                onFocus={() => handleInputFocus(40, 240)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title/Role</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Software Engineer, Student, Artist"
                onFocus={() => handleInputFocus(40, 300)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
                onFocus={() => handleInputFocus(80, 360)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Insights</Text>
              <View style={styles.insightInput}>
                <TextInput
                  style={styles.insightTextInput}
                  value={newInsight}
                  onChangeText={setNewInsight}
                  placeholder="Add a quick note about this person..."
                  multiline
                  onFocus={() => handleInputFocus(40, 480)}
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
              {insights.length > 0 && (
                <View style={styles.insightsList}>
                  {insights.map(insight => (
                    <View key={insight.id} style={styles.insightItem}>
                      <Text style={styles.insightText}>{insight.text}</Text>
                      <Pressable
                        onPress={() => handleRemoveInsight(insight.id)}
                        style={styles.removeInsight}>
                        <Ionicons name="close-circle" size={20} color="#666666" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Groups</Text>
              <Pressable 
                style={styles.groupSelector}
                onPress={() => setShowGroupModal(true)}>
                <Text style={styles.groupSelectorText}>
                  {selectedGroups.length > 0 
                    ? `${selectedGroups.length} group${selectedGroups.length === 1 ? '' : 's'} selected`
                    : 'Select groups'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666666" />
              </Pressable>
              {selectedGroups.length > 0 && (
                <View style={styles.selectedGroups}>
                  {selectedGroups.map(group => (
                    <View key={group.id} style={styles.selectedGroup}>
                      <Text style={styles.selectedGroupText}>{group.name}</Text>
                      <Pressable
                        onPress={() => toggleGroup(group)}
                        style={styles.removeGroup}>
                        <Ionicons name="close-circle" size={20} color="#666666" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={[styles.buttonContainer, { marginBottom: insets.bottom + 20 }]}>
            <Pressable
              style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isFormValid}>
              <Text style={[styles.saveButtonText, !isFormValid && styles.saveButtonTextDisabled]}>
                Create Profile
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        <Modal
          visible={showGroupModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowGroupModal(false)}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Groups</Text>
                <Pressable 
                  onPress={() => setShowGroupModal(false)}
                  style={styles.modalClose}>
                  <Ionicons name="close" size={24} color="#666666" />
                </Pressable>
              </View>

              {loadingGroups ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading groups...</Text>
                </View>
              ) : availableGroups.length === 0 ? (
                <View style={styles.emptyGroupsContainer}>
                  <Ionicons name="people" size={48} color="#CCCCCC" />
                  <Text style={styles.emptyGroupsText}>No groups available</Text>
                  <Text style={styles.emptyGroupsSubText}>Create groups in the Groups tab</Text>
                </View>
              ) : (
                <ScrollView style={styles.groupsList}>
                  {availableGroups.map(group => {
                    const isSelected = selectedGroups.some(g => g.id === group.id);
                    return (
                      <Pressable
                        key={group.id}
                        style={[styles.groupItem, isSelected && styles.groupItemSelected]}
                        onPress={() => toggleGroup(group)}>
                        <View style={styles.groupIcon}>
                          <Ionicons name="people" size={24} color="#007AFF" />
                        </View>
                        <View style={styles.groupInfo}>
                          <Text style={styles.groupName}>{group.name}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                        )}
                      </Pressable>
                    );
                  })}
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
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  form: {
    padding: 16,
    gap: 20, // Increased spacing between form elements
  },
  inputGroup: {
    gap: 8, // Increased spacing between label and input
  },
  label: {
    fontSize: 16, // Increased font size
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4, // Added extra spacing below label
  },
  required: {
    color: '#FF3B30',
  },
  optional: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '400',
  },
  input: {
    height: 48, // Increased input height for better touch targets
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16, // Increased font size for better readability
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 100, // Taller text area
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  insightInput: {
    flexDirection: 'row',
    gap: 8,
  },
  insightTextInput: {
    flex: 1,
    height: 48, // Increased height
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  addInsightButton: {
    width: 48, // Increased size
    height: 48, // Increased size
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addInsightButtonDisabled: {
    backgroundColor: '#B4B4B4',
  },
  insightsList: {
    marginTop: 12,
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    marginRight: 8,
  },
  removeInsight: {
    padding: 4, // Increased touch target
  },
  groupSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 14, // Increased padding
    borderWidth: 1,
    borderColor: '#E5E5E5',
    height: 48, // Fixed height for consistency
  },
  groupSelectorText: {
    fontSize: 16,
    color: '#666666',
  },
  selectedGroups: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectedGroupText: {
    fontSize: 14,
    color: '#333333',
    marginRight: 4,
  },
  removeGroup: {
    marginLeft: 4,
    padding: 2, // Increased touch target
  },
  buttonContainer: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    height: 56, // Fixed height
  },
  saveButtonDisabled: {
    backgroundColor: '#B4B4B4',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18, // Increased size
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalClose: {
    padding: 8, // Increased touch target
  },
  groupsList: {
    padding: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14, // Increased padding
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
  },
  groupItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  groupIcon: {
    width: 40, // Increased size
    height: 40, // Increased size
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  emptyGroupsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyGroupsText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  emptyGroupsSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  modalDone: {
    margin: 16,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    height: 56, // Fixed height
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 18, // Increased size
    fontWeight: '600',
  },
  photoWrapper: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 120, // Increased size
    height: 120, // Increased size
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#F0F8FF',
  },
  editPhotoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#437C79',
    width: 36, // Increased size
    height: 36, // Increased size
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});