import { useState } from 'react';
import { client } from '../amplify';
import { uploadData, getUrl, remove as removeStorage } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import { ProfileInput, InsightInput, GroupInput, ProfileQueryOptions } from '../types';
import { handleError, clearError } from '../utils';

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (photoFile: string) => {
    try {
      console.log('Starting photo upload with file:', typeof photoFile === 'string' ? 'string URI' : 'unknown type');
      
      // Get the current user's identity ID for entity-based access control
      let entityId = '';
      try {
        const currentUser = await getCurrentUser();
        entityId = currentUser.userId;
        console.log('Got userId for storage path:', entityId);
      } catch (authErr) {
        console.error('Error getting current user identity:', authErr);
        throw new Error('Failed to get user identity for storage. Are you logged in?');
      }
      
      if (!entityId) {
        console.error('No entity ID found. User may not be authenticated properly.');
        throw new Error('No entity ID found. Please log out and log back in.');
      }
      
      // Use correct path structure that matches the storage configuration
      // profiles/{entity_id}/filename - must exactly match the pattern in storage/resource.ts
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const key = `profiles/${entityId}/${filename}`;
      
      console.log(`Uploading to key: ${key}`);
      
      try {
        // Convert file URI to blob data
        let fileData: Blob;
        
        // If the photoFile is a local URI (starts with file://) we need to fetch it first
        if (photoFile.startsWith('file://') || photoFile.startsWith('content://')) {
          console.log('Converting local file URI to binary data');
          try {
            const response = await fetch(photoFile);
            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
            }
            const blob = await response.blob();
            fileData = blob;
            console.log('Successfully converted file to blob, size:', blob.size);
          } catch (fetchError) {
            console.error('Error fetching local file:', fetchError);
            throw new Error('Failed to read the selected image. Please try again with a different image.');
          }
        } else {
          // Handle base64 data URIs if needed
          throw new Error('Unsupported image format. Only file:// URIs are supported.');
        }
        
        // Upload the file data to S3
        const uploadResult = await uploadData({
          key,
          data: fileData,
          options: {
            contentType: 'image/jpeg',
            accessLevel: 'private'
          }
        }).result;
        
        console.log('Upload successful, getting URL');
        const { url } = await getUrl({ key });
        console.log('Photo uploaded successfully with URL:', url.toString());
        
        return { url: url.toString(), key };
      } catch (uploadErr) {
        console.error('Error during S3 upload:', uploadErr);
        if (uploadErr instanceof Error && uploadErr.message.includes('credentials')) {
          throw new Error('Authentication issue. Please log out and log back in.');
        }
        throw uploadErr;
      }
    } catch (err) {
      // Detailed error logging for photo upload errors
      console.error('--- PHOTO UPLOAD ERROR ---');
      if (err instanceof Error) {
        console.error(`Error uploading photo - Type: ${err.name}, Message: ${err.message}`);
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
      let photoKey;

      if (photoFile) {
        const uploadResult = await handlePhotoUpload(photoFile);
        photoUrl = uploadResult.url;
        photoKey = uploadResult.key;
      }

      // Create the profile first
      const profileResult = await client.models.Profile.create({
        ...input,
        photoUrl,
        ...(photoKey && { photoKey }),
      });

      const profile = profileResult.data;
      if (!profile) throw new Error('Failed to create profile');

      // Create insights for this profile
      const insightPromises = insights.map(insight =>
        client.models.Insight.create({
          text: insight.text,
          timestamp: insight.timestamp,
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

  const migratePhotoToEntityPath = async (oldKey: string) => {
    try {
      if (!oldKey.includes('/')) return null; // Invalid key format
      
      // Check if the key is already in the entity format
      const parts = oldKey.split('/');
      if (parts.length >= 3 && parts[0] === 'profiles') {
        // Already in the right format (profiles/{entity_id}/filename)
        return oldKey;
      }
      
      // This is an old format key, we need to migrate it
      const currentUser = await getCurrentUser();
      const identityId = currentUser.userId;
      
      // Create a new key in the entity format
      const filename = parts[parts.length - 1];
      const newKey = `profiles/${identityId}/${filename}`;
      
      // Download the old file
      const { url: oldUrl } = await getUrl({ key: oldKey });
      const response = await fetch(oldUrl);
      const blob = await response.blob();
      
      // Upload to the new location
      await uploadData({
        key: newKey,
        data: blob,
        options: {
          contentType: blob.type
        }
      });
      
      // Get the URL of the new file
      const { url: newUrl } = await getUrl({ key: newKey });
      
      // Try to delete the old file
      try {
        await removeStorage({ key: oldKey });
      } catch (error) {
        console.warn('Failed to delete old photo during migration:', error);
      }
      
      return { key: newKey, url: newUrl.toString() };
    } catch (error) {
      console.error('Failed to migrate photo:', error);
      return null;
    }
  };

  const getProfile = async (id: string, includeRelations = true) => {
    try {
      setLoading(true);
      setError(null);
      
      const profileResult = await client.models.Profile.get({ id });
      const profile = profileResult.data;
      
      if (profile) {
        // Check if this profile has a photo that needs migration
        if (profile.photoKey && !profile.photoKey.match(/^profiles\/[^/]+\/[^/]+$/)) {
          const migrationResult = await migratePhotoToEntityPath(profile.photoKey);
          if (migrationResult && typeof migrationResult !== 'string') {
            // Update the profile with the new photo key and URL
            await client.models.Profile.update({
              id: profile.id,
              photoKey: migrationResult.key,
              photoUrl: migrationResult.url
            });
            
            // Update local profile object
            profile.photoKey = migrationResult.key;
            profile.photoUrl = migrationResult.url;
          }
        }
        
        if (includeRelations) {
          // Fetch insights
          const insightsResult = await client.models.Insight.list({
            filter: { profileID: { eq: profile.id } }
          });

          // Fetch group memberships
          const groupMembershipsResult = await client.models.ProfileGroup.list({
            filter: { profileID: { eq: profile.id } }
          });

          // If there are group memberships, fetch the actual groups
          const groupIds = groupMembershipsResult.data
            ?.map(pg => pg.groupID)
            .filter((id): id is string => id !== null) || [];
            
          const groupsPromises = groupIds.map(groupId =>
            client.models.Group.get({ id: groupId })
          );
          const groupsResults = await Promise.all(groupsPromises);

          return {
            ...profile,
            insights: insightsResult.data || [],
            groups: groupsResults.map(g => g.data).filter(Boolean) || []
          };
        }
      }

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
      let photoKey = existingProfile.data?.photoKey;

      if (photoFile) {
        console.log('Update profile: New photo provided, starting upload process');
        try {
          // Upload new photo with entity-based path
          const uploadResult = await handlePhotoUpload(photoFile);
          photoUrl = uploadResult.url;
          photoKey = uploadResult.key;
          console.log('Photo uploaded successfully, new URL:', photoUrl);

          // Delete old photo if exists
          if (existingProfile.data?.photoKey) {
            console.log('Attempting to delete old photo:', existingProfile.data.photoKey);
            try {
              await removeStorage({ 
                key: existingProfile.data.photoKey,
                options: { accessLevel: 'private' }
              });
              console.log('Old photo deleted successfully');
            } catch (error) {
              console.warn('Failed to delete old photo:', error);
              // Continue with the update even if old photo deletion fails
            }
          }
        } catch (photoError) {
          console.error('Error during photo update process:', photoError);
          throw photoError; // Re-throw to be caught by the outer try/catch
        }
      }

      // Update the profile with explicitly setting both photoUrl and photoKey
      console.log('Updating profile with data:', {
        id,
        ...input,
        photoUrl,
        photoKey
      });
      
      const profileResult = await client.models.Profile.update({
        id,
        ...input,
        photoUrl,
        photoKey,
      });

      const profile = profileResult.data;
      if (!profile) throw new Error('Failed to update profile');

      // Handle insights
      const insightPromises = [
        // Add new insights
        ...insightsToAdd.map(insight =>
          client.models.Insight.create({
            text: insight.text,
            timestamp: insight.timestamp,
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
        // Delete photo if exists
        if (profile.photoKey) {
          try {
            await removeStorage({ key: profile.photoKey });
          } catch (error) {
            console.warn('Failed to delete profile photo:', error);
          }
        }

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