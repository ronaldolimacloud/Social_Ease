import { useState } from 'react';
import { client } from '../amplify';
import * as FileSystem from 'expo-file-system';
import { ProfileInput, InsightInput, GroupInput, ProfileQueryOptions } from '../types';
import { handleError, clearError } from '../utils';
import { getProfilePhotoUri, setProfilePhotoUri, removeProfilePhoto } from '../services/localImages';

// Import the default profile image
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/logo.png');

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (photoFile: string) => {
    try {
      console.log('Starting local photo save with file:', typeof photoFile === 'string' ? photoFile : 'unknown type');

      // Only support file:// URIs for now (ImagePicker returns file://)
      if (!photoFile.startsWith('file://')) {
        throw new Error('Unsupported image format. Only file:// URIs are supported for local storage.');
      }

      // Ensure destination directory exists
      const photosDir = `${FileSystem.documentDirectory}profile-photos/`;
      try {
        const dirInfo = await FileSystem.getInfoAsync(photosDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
        }
      } catch (dirErr) {
        console.error('Failed ensuring profile-photos directory:', dirErr);
        // Continue; copy will throw if directory truly not available
      }

      // Derive a filename and extension
      const sourceUri = photoFile;
      const extMatch = sourceUri.split('?')[0].split('#')[0].split('.');
      const ext = extMatch.length > 1 ? extMatch[extMatch.length - 1].toLowerCase() : 'jpg';
      const filename = `profile-photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const destUri = `${photosDir}${filename}`;

      // Copy the file into the app sandbox
      await FileSystem.copyAsync({ from: sourceUri, to: destUri });
      console.log('Photo saved locally at:', destUri);

      // Return local URI; no remote key
      return { url: destUri, key: null as unknown as string | null };
    } catch (err) {
      console.error('--- LOCAL PHOTO SAVE ERROR ---');
      if (err instanceof Error) {
        console.error(`Error saving photo locally - Type: ${err.name}, Message: ${err.message}`);
        if (err.stack) console.error(`Stack trace: ${err.stack}`);
      } else {
        console.error('Unknown error type:', err);
      }
      throw err;
    }
  };

  const createProfile = async (
    input: ProfileInput, 
    photoFile?: string,
    insights: InsightInput[] = [],
    groups: GroupInput[] = []
  ) => {
    try {
      setLoading(true);
      setError(null);

      let photoUrl = input.photoUrl;

      if (photoFile) {
        const uploadResult = await handlePhotoUpload(photoFile);
        photoUrl = uploadResult.url;
      }

      // Create the profile first
      const profileResult = await client.models.Profile.create({
        ...input,
        // Persist only model fields without remote photo keys
      });

      const profile = profileResult.data;
      if (!profile) throw new Error('Failed to create profile');

      // Save local mapping after profile creation
      if (photoUrl) {
        try { await setProfilePhotoUri(profile.id, photoUrl); } catch {}
      }

      // Create insights for this profile
      const insightPromises = insights.map(insight =>
        client.models.Insight.create({
          text: insight.text,
          timestamp: insight.timestamp, // Keep as string (already in ISO format)
          profileID: profile.id
        })
      );
      await Promise.all(insightPromises);

      // Create group memberships
      const groupPromises = groups.map(group =>
        client.models.ProfileGroup.create({
          profileID: profile.id,
          groupID: group.id,
          joinedDate: new Date().toISOString()
        })
      );
      await Promise.all(groupPromises);

      return profile;
    } catch (err) {
      // More detailed error logging
      if (err instanceof Error) {
        console.error(`Error in profile operation - Type: ${err.name}, Message: ${err.message}`);
        if (err.stack) console.error(`Stack trace: ${err.stack}`);
      }
      
      handleError(err, setError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProfile = async (id: string, includeRelations = true) => {
    try {
      setLoading(true);
      setError(null);
      
      const profileResult = await client.models.Profile.get({ id });
      let profile = profileResult.data;
      
      // Only process if we have a profile
      if (!profile) {
        return profile;
      }
      
      // Resolve local mapping for photo URI (local-only storage)
      try {
        const localUri = await getProfilePhotoUri(id);
        if (localUri) {
          profile = { ...profile, photoUrl: localUri } as any;
        }
      } catch {}
      
      // For Amplify Gen 2, relationships are functions, not direct arrays
      // We need to return the original profile object with proper relationships
      let extendedData = null;
      
      // Fetch relationships if needed
      if (includeRelations) {
        // Fetch insights
        const insightsResult = await client.models.Insight.list({
          filter: { profileID: { eq: id } }
        });
        
        // Fetch group memberships
        const groupMembershipsResult = await client.models.ProfileGroup.list({
          filter: { profileID: { eq: id } }
        });
        
        // If we have group memberships, fetch the actual group data
        const groups: any[] = [];
        if (groupMembershipsResult.data && groupMembershipsResult.data.length > 0) {
          const groupIds = groupMembershipsResult.data
            .map(membership => membership.groupID)
            .filter((groupId): groupId is string => groupId !== null);
          
          // We need to fetch each group individually as Amplify Gen 2 doesn't support IN filter yet
          const groupPromises = groupIds.map(groupId => 
            client.models.Group.get({ id: groupId })
          );
          
          const groupsResults = await Promise.all(groupPromises);
          groupsResults.forEach(result => {
            if (result.data) {
              groups.push(result.data);
            }
          });
        }
        
        // Create extended data to help components render relations
        // but we don't modify the original profile object's relationship functions
        extendedData = {
          insightsData: insightsResult.data || [],
          groupsData: groups
        };
      }
      
      // Return both the profile and any extended data
      return { profile, extendedData };
    } catch (error) {
      handleError(error, setError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (
    id: string, 
    input: Partial<ProfileInput>, 
    photoFile?: string,
    insightsToAdd: InsightInput[] = [],
    insightsToRemove: string[] = [],
    groupsToAdd: GroupInput[] = [],
    groupsToRemove: string[] = []
  ) => {
    try {
      setLoading(true);
      setError(null);

      // First, get the existing profile
      const existingProfile = await client.models.Profile.get({ id });
      let photoUrl = input.photoUrl;

      if (photoFile) {
        console.log('Update profile: New photo provided, starting upload process');
        try {
          // Save new photo locally
          const uploadResult = await handlePhotoUpload(photoFile);
          photoUrl = uploadResult.url;
          // no remote key
          console.log('Photo saved locally, new URL:', photoUrl);

          // Delete old local photo if it exists and is a file URI
          const oldPhotoUrl = existingProfile.data?.photoUrl;
          if (oldPhotoUrl && oldPhotoUrl.startsWith('file://')) {
            try {
              await FileSystem.deleteAsync(oldPhotoUrl, { idempotent: true });
              console.log('Old local photo deleted successfully');
            } catch (error) {
              console.warn('Failed to delete old local photo:', error);
            }
          }
          // Update local mapping for this profile id
          try { await removeProfilePhoto(id); } catch {}
          if (photoUrl) {
            try { await setProfilePhotoUri(id, photoUrl); } catch {}
          }
        } catch (photoError) {
          console.error('Error during photo update process:', photoError);
          throw photoError; // Re-throw to be caught by the outer try/catch
        }
      }

      // Update the profile without persisting local photoUrl/photoKey
      console.log('Updating profile with data:', {
        id,
        ...input,
        // photoUrl/photoKey intentionally omitted from backend persistence for local-only
      });
      
      const profileResult = await client.models.Profile.update({
        id,
        ...input,
        // No remote photoKey persistence in local-only mode
      });

      const profile = profileResult.data;
      if (!profile) throw new Error('Failed to update profile');

      // Handle insights
      const insightPromises = [
        // Add new insights
        ...insightsToAdd.map(insight =>
          client.models.Insight.create({
            text: insight.text,
            timestamp: insight.timestamp, // Keep as string (ISO format)
            profileID: profile.id
          })
        ),
        // Remove insights
        ...insightsToRemove.map(insightId =>
          client.models.Insight.delete({ id: insightId })
        )
      ];
      await Promise.all(insightPromises);

      // Handle group memberships
      const groupPromises = [
        // Add new group memberships
        ...groupsToAdd.map(group =>
          client.models.ProfileGroup.create({
            profileID: profile.id,
            groupID: group.id,
            joinedDate: new Date().toISOString()
          })
        ),
        // Remove group memberships
        ...groupsToRemove.map(async (groupId) => {
          const membership = await client.models.ProfileGroup.list({
            filter: {
              and: [
                { profileID: { eq: profile.id } },
                { groupID: { eq: groupId } }
              ]
            }
          });
          if (membership.data?.[0]) {
            return client.models.ProfileGroup.delete({ id: membership.data[0].id });
          }
        })
      ];
      await Promise.all(groupPromises);

      return profile;
    } catch (err) {
      // More detailed error logging
      if (err instanceof Error) {
        console.error(`Error in profile operation - Type: ${err.name}, Message: ${err.message}`);
        if (err.stack) console.error(`Stack trace: ${err.stack}`);
      }
      
      handleError(err, setError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get the profile to check for photo and relationships
      const profileResult = await client.models.Profile.get({ id });
      const profile = profileResult.data;
      
      if (profile) {
        // Delete local mapping and file
        try { await removeProfilePhoto(profile.id); } catch {}
 
        // Delete related insights
        const insightsResult = await client.models.Insight.list({
          filter: { profileID: { eq: profile.id } }
        });
        const insightPromises = (insightsResult.data || []).map(insight =>
          client.models.Insight.delete({ id: insight.id })
        );
        await Promise.all(insightPromises);

        // Delete group memberships
        const membershipResult = await client.models.ProfileGroup.list({
          filter: { profileID: { eq: profile.id } }
        });
        const membershipPromises = (membershipResult.data || []).map(membership =>
          client.models.ProfileGroup.delete({ id: membership.id })
        );
        await Promise.all(membershipPromises);

        // Finally delete the profile
        await client.models.Profile.delete({ id });
      }
      
      return true;
    } catch (err) {
      // More detailed error logging
      if (err instanceof Error) {
        console.error(`Error in profile operation - Type: ${err.name}, Message: ${err.message}`);
        if (err.stack) console.error(`Stack trace: ${err.stack}`);
      }
      
      handleError(err, setError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listProfiles = async (options?: ProfileQueryOptions) => {
    try {
      setLoading(true);
      setError(null);
      
      const { limit = 20, nextToken, filter } = options || {};
      
      const result = await client.models.Profile.list({
        limit,
        nextToken,
        filter,
      });

      return result.data;
    } catch (err) {
      // More detailed error logging
      if (err instanceof Error) {
        console.error(`Error in profile operation - Type: ${err.name}, Message: ${err.message}`);
        if (err.stack) console.error(`Stack trace: ${err.stack}`);
      }
      
      handleError(err, setError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile,
    listProfiles,
    loading,
    error,
    clearError: () => clearError(setError),
  };
};

// Add this function to help migrate existing photos
const getFilenameFromPath = (fullPath: string): string => {
  if (!fullPath) return '';
  
  // If it's already just a filename (no slashes), return as is
  if (!fullPath.includes('/')) return fullPath;
  
  // Otherwise extract the filename from the path
  const parts = fullPath.split('/');
  return parts[parts.length - 1];
}; 