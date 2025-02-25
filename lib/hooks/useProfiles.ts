import { useState, useEffect } from 'react';
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

  // Fetch profiles function
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current authenticated user
      const { userId } = await getCurrentUser();
      
      const response = await client.models.Profile.list({
        filter: {
          owner: {
            eq: userId
          }
        },
        limit: 100, // Adjust based on your needs
      });

      if (response.data) {
        // Process profiles to add group associations
        const profilesWithGroups = await Promise.all(
          response.data.map(async (profile) => {
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
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profiles'));
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchProfiles();
  }, []);

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
    refetch: fetchProfiles
  };
} 