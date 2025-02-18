import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, ScrollView, Modal } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addProfile } from '../(tabs)/index';

type Group = {
  id: string;
  type: string;
  name: string;
  memberCount?: number;
};

type Insight = {
  id: string;
  text: string;
  timestamp: string;
};

const mockGroups: Group[] = [
  { id: '1', type: 'work', name: 'Engineering Team', memberCount: 12 },
  { id: '2', type: 'school', name: 'Computer Science', memberCount: 45 },
  { id: '3', type: 'social', name: 'Book Club', memberCount: 8 },
  { id: '4', type: 'work', name: 'Design Team', memberCount: 15 },
  { id: '5', type: 'school', name: 'Math Club', memberCount: 20 },
];

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop';

export default function NewProfileScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [newInsight, setNewInsight] = useState('');

  const handleSelectPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
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

  const handleSave = () => {
    if (!isFormValid) return;

    const newProfile = addProfile({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      description: '', // Empty description since we removed the field
      bio: bio.trim(),
      photoUrl: photoUri || DEFAULT_PHOTO,
      groups: selectedGroups.map(({ id, type, name }) => ({ id, type, name })),
      insights,
    });

    router.push('/(tabs)');
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

  return (
    <ScrollView style={styles.container}>
      <Pressable onPress={handleSelectPhoto} style={styles.photoContainer}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera" size={32} color="#666666" />
            <Text style={styles.photoPlaceholderText}>Add Photo</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name<Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, !firstName.trim() && styles.inputError]}
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
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
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
              multiline
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

        <Pressable
          style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isFormValid}>
          <Text style={[styles.saveButtonText, !isFormValid && styles.saveButtonTextDisabled]}>
            Create Profile
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={showGroupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGroupModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Groups</Text>
              <Pressable 
                onPress={() => setShowGroupModal(false)}
                style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#666666" />
              </Pressable>
            </View>
            <ScrollView style={styles.groupsList}>
              {mockGroups.map(group => {
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
              })}
            </ScrollView>
            <Pressable 
              style={styles.modalDone}
              onPress={() => setShowGroupModal(false)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  form: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  textArea: {
    height: 80,
    paddingTop: 8,
    paddingBottom: 8,
  },
  insightInput: {
    flexDirection: 'row',
    gap: 8,
  },
  insightTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  addInsightButton: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addInsightButtonDisabled: {
    backgroundColor: '#B4B4B4',
  },
  insightsList: {
    marginTop: 8,
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  removeInsight: {
    padding: 2,
  },
  groupSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  groupSelectorText: {
    fontSize: 15,
    color: '#666666',
  },
  selectedGroups: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  selectedGroupText: {
    fontSize: 14,
    color: '#333333',
    marginRight: 4,
  },
  removeGroup: {
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#B4B4B4',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
    padding: 4,
  },
  groupsList: {
    padding: 16,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
  },
  groupItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  groupIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  groupType: {
    fontSize: 14,
    color: '#666666',
  },
  modalDone: {
    margin: 16,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});