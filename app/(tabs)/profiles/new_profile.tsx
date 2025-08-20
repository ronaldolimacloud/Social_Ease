import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../../../lib/hooks/useProfile';
import { useGroup } from '../../../lib/hooks/useGroup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ... existing code ...

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
const DEFAULT_PROFILE_IMAGE = require('../../../assets/images/logo.png');
const WINDOW_HEIGHT = Dimensions.get('window').height;

export default function CreateScreen() {
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
        mediaTypes: ['images'],
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
        type: group.type || 'general'
      })));

      if (newProfile) {
        router.replace('/(tabs)/profiles/profiles');
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

  const handleInputFocus = (inputHeight: number, yPosition: number) => {
    setTimeout(() => {
      const scrollToY = Math.max(0, yPosition - 120);
      scrollViewRef.current?.scrollTo({
        y: scrollToY,
        animated: true,
      });
    }, 50);
  };

  return (
    <LinearGradient
      colors={['#061a1a', '#020e0e']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      locations={[0.5, 1]}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
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
                <Ionicons name="camera" size={14} color="#FFFFFF" />
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
                placeholderTextColor="#6a8a8a"
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
                placeholderTextColor="#6a8a8a"
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
                placeholderTextColor="#6a8a8a"
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
                placeholderTextColor="#6a8a8a"
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
                  placeholderTextColor="#6a8a8a"
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
                        <Ionicons name="close-circle" size={20} color="#c8e8e8" />
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
                <Ionicons name="chevron-down" size={20} color="#c8e8e8" />
              </Pressable>
              {selectedGroups.length > 0 && (
                <View style={styles.selectedGroups}>
                  {selectedGroups.map(group => (
                    <View key={group.id} style={styles.selectedGroup}>
                      <Text style={styles.selectedGroupText}>{group.name}</Text>
                      <Pressable
                        onPress={() => toggleGroup(group)}
                        style={styles.removeGroup}>
                        <Ionicons name="close-circle" size={20} color="#c8e8e8" />
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
                  <ActivityIndicator size="large" color="#1f9b98" />
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
                          <Ionicons name="people" size={24} color="#1f9b98" />
                        </View>
                        <View style={styles.groupInfo}>
                          <Text style={styles.groupName}>{group.name}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={24} color="#1f9b98" />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingTop: 16,
  },
  form: {
    padding: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  required: {
    color: '#ff6b6b',
  },
  optional: {
    fontSize: 14,
    color: '#6a8a8a',
    fontWeight: '400',
  },
  input: {
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  textArea: {
    height: 100,
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
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
  },
  addInsightButton: {
    width: 50,
    height: 50,
    backgroundColor: '#1f9b98',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addInsightButtonDisabled: {
    backgroundColor: 'rgba(31, 155, 152, 0.5)',
  },
  insightsList: {
    marginTop: 12,
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 155, 152, 0.2)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(31, 155, 152, 0.3)',
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    marginRight: 8,
    color: '#FFFFFF',
  },
  removeInsight: {
    padding: 4,
  },
  groupSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    height: 50,
  },
  groupSelectorText: {
    fontSize: 16,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(31, 155, 152, 0.2)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(31, 155, 152, 0.3)',
  },
  selectedGroupText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 4,
  },
  removeGroup: {
    marginLeft: 4,
    padding: 2,
  },
  buttonContainer: {
    padding: 16,
  },
  saveButton: {
    backgroundColor: '#1f9b98',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    height: 56,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(31, 155, 152, 0.5)',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    color: '#333333',
  },
  modalClose: {
    padding: 8,
  },
  groupsList: {
    padding: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
  },
  groupItemSelected: {
    backgroundColor: 'rgba(31, 155, 152, 0.1)',
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 155, 152, 0.1)',
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
    color: '#333333',
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
    backgroundColor: '#1f9b98',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 18,
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
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(31, 155, 152, 0.5)',
  },
  editPhotoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#1f9b98',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#061a1a',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  link: {
    paddingTop: 20,
    fontSize: 14,
    color: '#FFFFFF',
  },
  options: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    padding: 16,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});