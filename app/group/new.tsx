import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Stack, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGroup } from '../../lib/hooks/useGroup';

export default function NewGroupScreen() {
  const [name, setName] = useState('');
  const { createGroup, loading, error } = useGroup();
  const navigation = useNavigation();

  const handleGoBack = () => {
    // Use the navigation object directly which is more reliable
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback to tabs if there's nowhere to go back to
      router.push('/(tabs)');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Group name is required");
      return;
    }

    try {
      // Create the group with just a name
      const result = await createGroup({
        name: name.trim()
      });

      if (!result.data) {
        throw new Error('Failed to create group - no data returned');
      }
      
      console.log('Group created successfully:', result.data);
      
      // Navigate back to groups list
      router.push('/(tabs)/groups');
    } catch (err) {
      console.error('Error in handleSave:', err);
      Alert.alert(
        "Error",
        error || "Failed to create group. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Group',
          headerLeft: () => (
            <Pressable 
              onPress={handleGoBack}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <View style={styles.header}>
              <Ionicons name="people" size={48} color="#437C79" />
              <Text style={styles.headerText}>Create New Group</Text>
              <Text style={styles.headerSubtext}>Organize your contacts into meaningful groups</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Group Name<Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter group name"
                placeholderTextColor="#77B8B6"
                autoFocus
              />
            </View>
            
            {/* Button container moved inside the form */}
            <View style={styles.buttonContainer}>
              <Pressable 
                style={styles.cancelButton}
                onPress={handleGoBack}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable 
                style={[styles.saveButton, !name.trim() && styles.disabledButton]}
                onPress={handleSave}
                disabled={!name.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Create Group</Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#90cac7',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 24,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#437C79',
    marginTop: 12,
  },
  headerSubtext: {
    fontSize: 16,
    color: '#437C79',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#437C79',
  },
  required: {
    color: '#E74C3C',
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A6DDDC',
    fontSize: 16,
    color: '#437C79',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A6DDDC',
    marginRight: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#437C79',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#437C79',
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: '#A6DDDC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});