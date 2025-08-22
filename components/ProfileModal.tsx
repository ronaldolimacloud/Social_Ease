import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useProfile } from '../lib/hooks/useProfile';
import ProfileForm from './ProfileForm';

type ProfileModalProps = {
  visible: boolean;
  onClose: () => void;
};
export default function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { createProfile, loading } = useProfile();

  const handleSubmit = async (input: any, photoUri?: string, insights: any[] = [], groups: any[] = []) => {
    try {
      const result = await createProfile(input, photoUri, insights, groups);
      if (result) {
        onClose();
        Alert.alert('Success', 'Profile created successfully!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create profile. Please try again.', [{ text: 'OK' }]);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <BlurView 
        intensity={50} 
        tint="dark" 
        style={styles.blurContainer}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Profile</Text>
              <Pressable 
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#437C79" />
              </Pressable>
            </View>

            <ProfileForm submitting={loading} onSubmit={handleSubmit} onCancel={onClose} />
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Updated styles to match group creation modal
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'rgba(144, 202, 199, 0.1)',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
}); 