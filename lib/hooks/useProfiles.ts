import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Schema } from '@/amplify/data/resource';
import { Hub } from 'aws-amplify/utils';
import { Nullable } from '@aws-amplify/data-schema';
import { getCurrentUser } from 'aws-amplify/auth';

// Type definitions
export type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  description: Nullable<string>;
  bio: Nullable<string>;
  photoUrl: Nullable<string>;
  photoKey: Nullable<string>;
  insights?: Array<{
    id: string;
    text: string;
    timestamp: string;
  }>;
  groups?: Array<{
    id: string;
    type: string;
    name: string;
  }>;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UseProfilesReturn = {
  profiles: Profile[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

const client = generateClient<Schema>();

export function useProfiles(): UseProfilesReturn {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchKey, setFetchKey] = useState(0); // Add a key to force refetch

  // Modify fetchProfiles to be more resilient
  const fetchProfiles = useCallback(async () => {
    try {
      console.log('Starting profile fetch operation with key:', fetchKey);
      setLoading(true);
      setError(null);
      
      // Get the current authenticated user
      const { userId } = await getCurrentUser();
      console.log(`Fetching profiles for user ID: ${userId}`);
      
      // Use a more direct approach with no filtering initially
      const response = await client.models.Profile.list({
        limit: 1000, // Use a high limit to ensure we get all profiles
      });

      console.log(`Profile list response received: ${response.data?.length || 0} profiles found`);

      if (response.data) {
        // Filter client-side for the current user's profiles
        const userProfiles = response.data.filter(profile => 
          profile.owner === userId && !(profile as any)._deleted
        );
        
        console.log(`After filtering for current user: ${userProfiles.length} profiles found`);
        
        // Process profiles to add group associations
        const profilesWithGroups = await Promise.all(
          userProfiles.map(async (profile) => {
            // Fetch group memberships for this profile
            const groupMembershipsResult = await client.models.ProfileGroup.list({
              filter: { profileID: { eq: profile.id } }
            });

            // Get the group IDs from the memberships
            const groupIds = groupMembershipsResult.data
              ?.map(pg => pg.groupID)
              .filter((id): id is string => id !== null) || [];
              
            // If there are groups, fetch them
            if (groupIds.length > 0) {
              const groupsPromises = groupIds.map(groupId =>
                client.models.Group.get({ id: groupId })
              );
              const groupsResults = await Promise.all(groupsPromises);
              
              // Add the groups to the profile
              return {
                ...profile,
                groups: groupsResults
                  .map(g => g.data)
                  .filter(Boolean)
                  .map(g => ({
                    id: g!.id,
                    name: g!.name,
                    type: g!.type || 'general'
                  }))
              } as unknown as Profile;
            }
            
            // If no groups, return the profile as is
            return {
              ...profile,
              groups: []
            } as unknown as Profile;
          })
        );
        
        console.log(`Setting ${profilesWithGroups.length} profiles in state`);
        setProfiles(profilesWithGroups);
      } else {
        console.log('No profile data received from query');
        setProfiles([]);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profiles'));
    } finally {
      setLoading(false);
      console.log('Profile fetch operation completed');
    }
  }, [fetchKey]); // Add fetchKey as dependency

  // Update the refetch function to use the key
  const refetch = useCallback(async () => {
    console.log('Manual refetch triggered');
    // Increment the key to force a new fetch
    setFetchKey(prevKey => prevKey + 1);
  }, []);
  
  // Initial fetch - also when fetchKey changes
  useEffect(() => {
    fetchProfiles();
  }, [fetchKey, fetchProfiles]);

  // Set up real-time subscriptions
  useEffect(() => {
    let sub: { unsubscribe: () => void } | undefined;

    const setupSubscription = async () => {
      try {
        // In Gen2, we don't need to filter in the subscription
        // The authorization rules in the schema will handle visibility
        sub = client.models.Profile.observeQuery().subscribe({
          next: async ({ items, isSynced }) => {
            if (isSynced) {
              // Get current user to filter the items
              const { userId } = await getCurrentUser();
              
              // Filter profiles by current user
              const userProfiles = items.filter(item => 
                (item as unknown as Profile).owner === userId
              );
              
              // Process profiles to add group associations
              const profilesWithGroups = await Promise.all(
                userProfiles.map(async (profile) => {
                  // Fetch group memberships for this profile
                  const groupMembershipsResult = await client.models.ProfileGroup.list({
                    filter: { profileID: { eq: profile.id } }
                  });
      
                  // Get the group IDs from the memberships
                  const groupIds = groupMembershipsResult.data
                    ?.map(pg => pg.groupID)
                    .filter((id): id is string => id !== null) || [];
                    
                  // If there are groups, fetch them
                  if (groupIds.length > 0) {
                    const groupsPromises = groupIds.map(groupId =>
                      client.models.Group.get({ id: groupId })
                    );
                    const groupsResults = await Promise.all(groupsPromises);
                    
                    // Add the groups to the profile
                    return {
                      ...profile,
                      groups: groupsResults
                        .map(g => g.data)
                        .filter(Boolean)
                        .map(g => ({
                          id: g!.id,
                          name: g!.name,
                          type: g!.type || 'general'
                        }))
                    } as unknown as Profile;
                  }
                  
                  // If no groups, return the profile as is
                  return {
                    ...profile,
                    groups: []
                  } as unknown as Profile;
                })
              );
              
              setProfiles(profilesWithGroups);
            }
          },
          error: (err) => {
            console.error('Subscription error:', err);
            setError(new Error('Subscription error occurred'));
          },
        });
      } catch (err) {
        console.error('Error setting up subscription:', err);
      }
    };

    setupSubscription();

    // Clean up subscription
    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, []);

  // Listen for network status changes
  useEffect(() => {
    const hubListener = async (data: any) => {
      if (data.payload.event === 'networkStatus') {
        if (data.payload.data.online) {
          // Refetch data when coming back online
          await fetchProfiles();
        }
      }
    };

    const unsubscribe = Hub.listen('network', hubListener);

    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    profiles,
    loading,
    error,
    refetch
  };
} 