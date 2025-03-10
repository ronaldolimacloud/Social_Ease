import { useState } from 'react';
import { client } from '../amplify';
import { uploadData, getUrl, remove as removeStorage } from 'aws-amplify/storage';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { ProfileInput, InsightInput, GroupInput, ProfileQueryOptions } from '../types';
import { handleError, clearError } from '../utils';
import { CLOUDFRONT_URL, getCloudFrontUrl, createCloudFrontKey } from '../utils/cloudfront';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '@/amplify/data/resource';
import { Alert } from 'react-native';
import { Dispatch, SetStateAction } from 'react';

// Import the default profile image
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/logo.png');

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (photoFile: string) => {
    try {
      console.log('Starting photo upload with file:', typeof photoFile === 'string' ? 'string URI' : 'unknown type');
      
      // Get the current user's identity ID for entity-based access control
      let entityId = '';
      try {
        const { identityId } = await fetchAuthSession();
        if (!identityId) {
          throw new Error('No identity ID returned from authentication session');
        }
        entityId = identityId;
        console.log('Got identityId for storage path:', entityId);
      } catch (authErr) {
        console.error('Error getting identity ID:', authErr);
        throw new Error('Failed to get identity ID for storage. Are you logged in?');
      }
      
      if (!entityId) {
        console.error('No identity ID found. User may not be authenticated properly.');
        throw new Error('No identity ID found. Please log out and log back in.');
      }
      
      // Generate a unique filename without any path information
      const filename = `profile-photo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      console.log(`Uploading to private storage with key: ${filename}`);
      
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
        
        // Upload the file data to S3 using private access level
        const uploadResult = await uploadData({
          key: filename,  // Just the filename, no path
          data: fileData,
          options: {
            contentType: 'image/jpeg',
            accessLevel: 'private',  // This tells Amplify to use private/{identityId}/ prefix
            metadata: {
              'x-amz-server-side-encryption': 'AES256'
            },
            contentDisposition: 'attachment; filename="profile-photo.jpg"'
          }
        }).result;
        
        console.log('Upload successful, getting URL');
        // Get the URL with private access level to match
        const { url } = await getUrl({ 
          key: filename,  // Just the filename
          options: { 
            accessLevel: 'private',
            expiresIn: 3600 // 1 hour expiration for signed URLs
          }
        });
        console.log('Photo uploaded successfully with URL:', url.toString());
        
        // Create the full S3 key path that includes the private/{identityId}/ prefix for CloudFront compatibility
        const fullS3Key = createCloudFrontKey(filename, entityId);
        
        // Generate CloudFront URL for display
        const cloudFrontUrl = getCloudFrontUrl(fullS3Key);
        
        // Return both the CloudFront URL for display and the full S3 key for storage
        return { url: cloudFrontUrl, key: fullS3Key };
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
      
      // If the profile has a photo key, ensure it has a CloudFront URL
      if (profile.photoKey) {
        profile = {
          ...profile,
          photoUrl: getCloudFrontUrl(profile.photoKey)
        };
      }
      
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
            // Use just the filename with accessLevel: 'private'
            await removeStorage({ 
              key: profile.photoKey,
              options: { accessLevel: 'private' }
            });
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

// Add this function to help migrate existing photos
const getFilenameFromPath = (fullPath: string): string => {
  if (!fullPath) return '';
  
  // If it's already just a filename (no slashes), return as is
  if (!fullPath.includes('/')) return fullPath;
  
  // Otherwise extract the filename from the path
  const parts = fullPath.split('/');
  return parts[parts.length - 1];
}; 