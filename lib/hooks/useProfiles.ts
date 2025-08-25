import { useState, useEffect, useCallback } from 'react';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from 'aws-amplify/auth';
import { client } from '../amplify';
import type { UseProfilesReturn, Profile } from '../types';

// Types now come from lib/types

// Use the shared Amplify client defined in lib/amplify

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
      
      // Rely on owner-based authorization; keep a smaller page size to avoid over-fetching
      const response = await client.models.Profile.list({
        limit: 50,
      });

      console.log(`Profile list response received: ${response.data?.length || 0} profiles found`);

      if (response.data) {
        // Items are already filtered by owner; remove deleted locally
        const userProfiles = response.data.filter(profile => 
          !(profile as any)._deleted
        );
        
        console.log(`After filtering for current user: ${userProfiles.length} profiles found`);
        
        // If no profiles, short-circuit
        if (userProfiles.length === 0) {
          setProfiles([]);
          return;
        }

        // Batch-load group memberships for all profiles
        const profileIds = userProfiles.map(p => p.id);
        const membershipsResult = await client.models.ProfileGroup.list({
          filter: { or: profileIds.map(id => ({ profileID: { eq: id } })) },
          limit: 1000,
        });

        const memberships = membershipsResult.data || [];
        const uniqueGroupIds = Array.from(new Set(
          memberships
            .map(m => m.groupID)
            .filter((id): id is string => id !== null)
        ));

        // Batch-load groups
        const groupsResults = await Promise.all(
          uniqueGroupIds.map(groupId => client.models.Group.get({ id: groupId }))
        );
        const groupMap = new Map<string, { id: string; name: string; type: string }>();
        groupsResults.forEach(result => {
          if (result.data) {
            groupMap.set(result.data.id, {
              id: result.data.id,
              name: result.data.name,
              type: result.data.type || 'general',
            });
          }
        });

        // Attach groups to each profile using the preloaded maps
        const profilesWithGroups = userProfiles.map(profile => {
          const profileGroupIds = memberships
            .filter(m => m.profileID === profile.id)
            .map(m => m.groupID)
            .filter((id): id is string => id !== null);

          const groups = profileGroupIds
            .map(gid => groupMap.get(gid))
            .filter(Boolean) as Array<{ id: string; name: string; type: string }>; 

          return {
            ...profile,
            groups,
          } as unknown as Profile;
        });
        
        // Resolve local image URIs for display (local-only image storage)
        const withLocalImages = await Promise.all(
          profilesWithGroups.map(async (p) => {
            try {
              const localUri = (await import('../services/localImages')).getProfilePhotoUri;
              const uri = await localUri(p.id);
              return uri ? ({ ...p, photoUrl: uri } as Profile) : p;
            } catch {
              return p;
            }
          })
        );
        
        console.log(`Setting ${withLocalImages.length} profiles in state`);
        setProfiles(withLocalImages);
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
              // Items already restricted by auth rules
              const userProfiles = items as any[];

              if (userProfiles.length === 0) {
                setProfiles([]);
                return;
              }

              const profileIds = userProfiles.map(p => p.id);
              const membershipsResult = await client.models.ProfileGroup.list({
                filter: { or: profileIds.map(id => ({ profileID: { eq: id } })) },
                limit: 1000,
              });

              const memberships = membershipsResult.data || [];
              const uniqueGroupIds = Array.from(new Set(
                memberships
                  .map(m => m.groupID)
                  .filter((id): id is string => id !== null)
              ));

              const groupsResults = await Promise.all(
                uniqueGroupIds.map(groupId => client.models.Group.get({ id: groupId }))
              );
              const groupMap = new Map<string, { id: string; name: string; type: string }>();
              groupsResults.forEach(result => {
                if (result.data) {
                  groupMap.set(result.data.id, {
                    id: result.data.id,
                    name: result.data.name,
                    type: result.data.type || 'general',
                  });
                }
              });

              const profilesWithGroups = userProfiles.map(profile => {
                const profileGroupIds = memberships
                  .filter(m => m.profileID === profile.id)
                  .map(m => m.groupID)
                  .filter((id): id is string => id !== null);

                const groups = profileGroupIds
                  .map(gid => groupMap.get(gid))
                  .filter(Boolean) as Array<{ id: string; name: string; type: string }>;

                return {
                  ...profile,
                  groups,
                } as unknown as Profile;
              });

              // Resolve local image URIs for display
              try {
                const { getProfilePhotoUri } = await import('../services/localImages');
                const withLocalImages = await Promise.all(
                  profilesWithGroups.map(async (p) => {
                    try {
                      const uri = await getProfilePhotoUri(p.id);
                      return uri ? ({ ...p, photoUrl: uri } as Profile) : p;
                    } catch {
                      return p;
                    }
                  })
                );
                setProfiles(withLocalImages);
              } catch {
                setProfiles(profilesWithGroups);
              }
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