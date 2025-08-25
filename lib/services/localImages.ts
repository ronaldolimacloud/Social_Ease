import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const KEY_PREFIX = 'profile_photo_uri:';

export const getProfilePhotoUri = async (profileId: string): Promise<string | null> => {
  try {
    const value = await AsyncStorage.getItem(KEY_PREFIX + profileId);
    return value || null;
  } catch (e) {
    return null;
  }
};

export const setProfilePhotoUri = async (profileId: string, uri: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEY_PREFIX + profileId, uri);
  } catch (e) {
    // no-op
  }
};

export const removeProfilePhoto = async (profileId: string): Promise<void> => {
  try {
    const key = KEY_PREFIX + profileId;
    const existing = await AsyncStorage.getItem(key);
    if (existing && existing.startsWith('file://')) {
      try {
        await FileSystem.deleteAsync(existing, { idempotent: true });
      } catch {
        // ignore
      }
    }
    await AsyncStorage.removeItem(key);
  } catch {
    // no-op
  }
};

export const savePhotoLocally = async (sourceUri: string): Promise<string> => {
  if (!sourceUri.startsWith('file://')) {
    throw new Error('Unsupported image format. Only file:// URIs are supported.');
  }

  const photosDir = `${FileSystem.documentDirectory}profile-photos/`;
  try {
    const dirInfo = await FileSystem.getInfoAsync(photosDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
    }
  } catch {
    // best effort
  }

  const clean = sourceUri.split('?')[0].split('#')[0];
  const extParts = clean.split('.');
  const ext = extParts.length > 1 ? extParts[extParts.length - 1].toLowerCase() : 'jpg';
  const filename = `profile-photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const destUri = `${photosDir}${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
};


