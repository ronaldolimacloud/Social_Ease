import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GroupPicker from './GroupPicker';
import type { GroupInput, InsightInput, ProfileInput } from '../lib/types';

type Group = {
  id: string;
  name: string;
  type?: string;
  description?: string;
};

type ProfileFormInitial = {
  firstName?: string;
  lastName?: string;
  description?: string;
  bio?: string;
  photoUrl?: string;
  groups?: Group[];
  insights?: { id: string; text: string; timestamp: string }[];
};

type ProfileFormProps = {
  initial?: ProfileFormInitial;
  submitting?: boolean;
  onSubmit: (
    input: ProfileInput,
    photoUri: string | undefined,
    insights: InsightInput[],
    groups: GroupInput[]
  ) => Promise<void> | void;
  onCancel?: () => void;
};

const DEFAULT_PROFILE_IMAGE = require('../assets/images/logo.png');

export default function ProfileForm({ initial, submitting = false, onSubmit, onCancel }: ProfileFormProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>(initial?.groups ?? []);
  const [insights, setInsights] = useState(initial?.insights ?? []);
  const [newInsight, setNewInsight] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const [showGroupModal, setShowGroupModal] = useState(false);

  const isFormValid = useMemo(() => firstName.trim().length > 0, [firstName]);

  // Defer permission request until user taps Select Photo

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // GroupPicker handles its own data fetching

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
      Alert.alert('Error', 'Failed to select image. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleAddInsight = () => {
    const trimmed = newInsight.trim();
    if (!trimmed) return;
    setInsights(prev => [
      ...prev,
      { id: Date.now().toString(), text: trimmed, timestamp: new Date().toISOString() },
    ]);
    setNewInsight('');
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const handleRemoveInsight = (id: string) => {
    setInsights(prev => prev.filter(i => i.id !== id));
  };

  const toggleGroup = (group: Group) => {
    setSelectedGroups(current => {
      const isSelected = current.some(g => g.id === group.id);
      return isSelected ? current.filter(g => g.id !== group.id) : [...current, group];
    });
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    const input: ProfileInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      description: description.trim(),
      bio: bio.trim(),
    };
    const insightsInput: InsightInput[] = insights.map(i => ({ text: i.text, timestamp: i.timestamp }));
    const groupsInput: GroupInput[] = selectedGroups.map(g => ({ id: g.id, name: g.name, type: g.type || 'general' }));

    await onSubmit(input, photoUri, insightsInput, groupsInput);
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
          contentContainerStyle={[styles.scrollViewContent, { paddingBottom: isKeyboardVisible ? 200 : 100 }]}
        >
          <View style={styles.photoWrapper}>
            <View style={styles.photoContainer}>
              <Image
                source={photoUri ? { uri: photoUri } : initial?.photoUrl ? { uri: initial.photoUrl } : DEFAULT_PROFILE_IMAGE}
                style={styles.photo}
                contentFit="cover"
                transition={{ duration: 400, effect: 'cross-dissolve' }}
                placeholder={DEFAULT_PROFILE_IMAGE}
                cachePolicy="memory-disk"
              />
              <Pressable style={styles.editPhotoButton} onPress={handleSelectPhoto}>
                <Ionicons name="camera" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name<Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, !isFormValid && styles.inputError]}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                placeholderTextColor="#6a8a8a"
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
                />
                <Pressable onPress={handleAddInsight} style={[styles.addInsightButton, !newInsight.trim() && styles.addInsightButtonDisabled]}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </Pressable>
              </View>
              {insights.length > 0 && (
                <View style={styles.insightsList}>
                  {insights.map(insight => (
                    <View key={insight.id} style={styles.insightItem}>
                      <Text style={styles.insightText}>{insight.text}</Text>
                      <Pressable onPress={() => handleRemoveInsight(insight.id)} style={styles.removeInsight}>
                        <Ionicons name="close-circle" size={20} color="#c8e8e8" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Groups</Text>
              <Pressable style={styles.groupSelector} onPress={() => setShowGroupModal(true)}>
                <Text style={styles.groupSelectorText}>
                  {selectedGroups.length > 0 ? `${selectedGroups.length} group${selectedGroups.length === 1 ? '' : 's'} selected` : 'Select groups'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#c8e8e8" />
              </Pressable>
              {selectedGroups.length > 0 && (
                <View style={styles.selectedGroups}>
                  {selectedGroups.map(group => (
                    <View key={group.id} style={styles.selectedGroup}>
                      <Text style={styles.selectedGroupText}>{group.name}</Text>
                      <Pressable onPress={() => toggleGroup(group)} style={styles.removeGroup}>
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
              style={[styles.saveButton, (!isFormValid || submitting) && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Profile</Text>
              )}
            </Pressable>

            {onCancel && (
              <Pressable style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        <GroupPicker
          visible={showGroupModal}
          selectedGroups={selectedGroups}
          onToggle={toggleGroup}
          onClose={() => setShowGroupModal(false)}
        />
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
  inputGroup: { gap: 8 },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  required: { color: '#ff6b6b' },
  optional: { fontSize: 14, color: '#6a8a8a', fontWeight: '400' },
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
  inputError: { borderWidth: 1, borderColor: '#ff6b6b' },
  textArea: { height: 100, paddingTop: 12, paddingBottom: 12, textAlignVertical: 'top' },
  insightInput: { flexDirection: 'row', gap: 8 },
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
  addInsightButtonDisabled: { backgroundColor: 'rgba(31, 155, 152, 0.5)' },
  insightsList: { marginTop: 12, gap: 8 },
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
  insightText: { flex: 1, fontSize: 15, marginRight: 8, color: '#FFFFFF' },
  removeInsight: { padding: 4 },
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
  groupSelectorText: { fontSize: 16, color: '#FFFFFF' },
  selectedGroups: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
  selectedGroupText: { fontSize: 14, color: '#FFFFFF', marginRight: 4 },
  removeGroup: { marginLeft: 4, padding: 2 },
  buttonContainer: { padding: 16, gap: 10 },
  saveButton: { backgroundColor: '#1f9b98', borderRadius: 12, padding: 16, alignItems: 'center', height: 56 },
  saveButtonDisabled: { backgroundColor: 'rgba(31, 155, 152, 0.5)' },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  cancelButton: { backgroundColor: 'transparent', borderRadius: 12, padding: 12, alignItems: 'center' },
  cancelButtonText: { color: '#FFFFFF', fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#333333' },
  modalClose: { padding: 8 },
  groupsList: { padding: 16 },
  groupItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 10, marginBottom: 8, backgroundColor: '#F8F8F8' },
  groupItemSelected: { backgroundColor: 'rgba(31, 155, 152, 0.1)' },
  groupIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(31, 155, 152, 0.1)' },
  groupInfo: { flex: 1, marginLeft: 12 },
  groupName: { fontSize: 16, fontWeight: '500', marginBottom: 2, color: '#333333' },
  loadingContainer: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#666666' },
  emptyGroupsContainer: { padding: 40, alignItems: 'center' },
  emptyGroupsText: { marginTop: 16, fontSize: 18, fontWeight: '600', color: '#333333' },
  emptyGroupsSubText: { marginTop: 8, fontSize: 14, color: '#666666', textAlign: 'center' },
  modalDone: { margin: 16, backgroundColor: '#1f9b98', padding: 16, borderRadius: 12, alignItems: 'center', height: 56 },
  modalDoneText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});


