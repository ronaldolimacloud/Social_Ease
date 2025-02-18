import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { addGroup } from '../(tabs)/groups';

export default function NewGroupScreen() {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;

    addGroup({
      name: name.trim(),
      type: 'other', // Default type
    });

    router.push('/(tabs)/groups');
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Group Name<Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, !name.trim() && styles.inputError]}
            value={name}
            onChangeText={setName}
            placeholder="Enter group name"
            autoFocus
          />
        </View>

        <Pressable
          style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!name.trim()}>
          <Text style={[styles.saveButtonText, !name.trim() && styles.saveButtonTextDisabled]}>
            Create Group
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
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
  required: {
    color: '#FF3B30',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999999',
  },
});