import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Image, ScrollView, Modal } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { globalProfiles, updateProfile } from '../(tabs)/profiles';
import { globalGroups } from '../(tabs)/groups';

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

export default function EditProfileScreen() {
  const { id } = useLocalSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [description, setDescription] = useState('');
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState<string>('');
  const [selectedGroups, setSelectedGroups] = useState<Array<{ id: string; type: string; name: string; }>>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    const foundProfile = globalProfiles.find(p => p.id === id);
    if (foundProfile) {
      setProfile(foundProfile);
      setFirstName(foundProfile.firstName);
      setLastName(foundProfile.lastName);
      setDescription(foundProfile.description);
      setBio(foundProfile.bio);
      setPhotoUri(foundProfile.photoUrl);
      setSelectedGroups(foundProfile.groups);
    }
  }, [id]);

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

  const handleSave = () => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      description: description.trim(),
      bio: bio.trim(),
      photoUrl: photoUri,
      groups: selectedGroups,
    };

    updateProfile(updatedProfile);
    router.back();
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
          title: 'Edit Profile',
          headerRight: () => (
            <Pressable onPress={handleSave} style={{ marginRight: 16 }}>
              <Text style={{ color: '#007AFF', fontSize: 17 }}>Save</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        <Pressable onPress={handleSelectPhoto} style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <View style={styles.editPhotoButton}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
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
              style={[styles.input, styles.textArea]}
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
      </ScrollView>

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
              {globalGroups.map(group => {
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 32,
  },
  photoContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    position: 'relative',
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
    right: '50%',
    bottom: 24,
    marginRight: -60,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
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
    fontWeight: '500',
    marginBottom: 8,
    color: '#333333',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  groupSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  groupSelectorText: {
    fontSize: 16,
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