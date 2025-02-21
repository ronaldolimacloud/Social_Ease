import { useState } from 'react';
import { client } from '../amplify';
import { uploadData, getUrl, remove as removeStorage } from 'aws-amplify/storage';

interface ProfileInput {
  firstName: string;
  lastName: string;
  description?: string;
  bio?: string;
  photoUrl?: string;
  photoKey?: string;
}

interface InsightInput {
  text: string;
  timestamp: string;
}

interface GroupInput {
  id: string;
  name: string;
  type: string;
  description?: string;
  memberCount?: number;
}

interface ProfileQueryOptions {
  limit?: number;
  nextToken?: string;
  filter?: Record<string, any>;
}

export const useProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (photoFile: string) => {
    const key = `profiles/${Date.now()}-${Math.random().toString(36).substring(7)}`;
    await uploadData({
      key,
      data: photoFile,
      options: {
        contentType: 'image/jpeg',
        accessLevel: 'private'
      }
    });
    const { url } = await getUrl({ key });
    return { url: url.toString(), key };
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
      setError(err instanceof Error ? err.message : 'An error occurred while creating profile');
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
      const profile = profileResult.data;
      
      if (profile && includeRelations) {
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

      return profile;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching profile');
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
      let photoKey;

      if (photoFile) {
        // Upload new photo
        const uploadResult = await handlePhotoUpload(photoFile);
        photoUrl = uploadResult.url;
        photoKey = uploadResult.key;

        // Delete old photo if exists
        if (existingProfile.data?.photoKey) {
          try {
            await removeStorage({ key: existingProfile.data.photoKey });
          } catch (error) {
            console.warn('Failed to delete old photo:', error);
          }
        }
      }

      // Update the profile
      const profileResult = await client.models.Profile.update({
        id,
        ...input,
        ...(photoUrl && { photoUrl }),
        ...(photoKey && { photoKey }),
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
      setError(err instanceof Error ? err.message : 'An error occurred while updating profile');
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
      setError(err instanceof Error ? err.message : 'An error occurred while deleting profile');
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
      setError(err instanceof Error ? err.message : 'An error occurred while listing profiles');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile,
    listProfiles,
    loading,
    error,
    clearError,
  };
}; 