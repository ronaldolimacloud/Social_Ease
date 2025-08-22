import React from 'react';
import { router } from 'expo-router';
import ProfileForm from '../../../components/ProfileForm';
import { useProfile } from '../../../lib/hooks/useProfile';

export default function CreateScreen() {
  const { createProfile, loading } = useProfile();

  const handleSubmit = async (input: any, photoUri?: string, insights: any[] = [], groups: any[] = []) => {
    try {
      const result = await createProfile(input, photoUri, insights, groups);
      if (result) {
        router.replace('/(tabs)/profilesao/profiles');
      }
    } catch (err) {
      // no-op; error handled in hook/UI
    }
  };

  return (
    <ProfileForm
      submitting={loading}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}