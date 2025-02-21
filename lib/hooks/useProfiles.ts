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
        setProfiles(response.data as unknown as Profile[]);
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
        const { userId } = await getCurrentUser();
        
        // Subscribe to profile changes for the current user only
        sub = client.models.Profile.observeQuery({
          filter: {
            owner: {
              eq: userId
            }
          }
        }).subscribe({
          next: ({ items, isSynced }) => {
            if (isSynced) {
              setProfiles(items as unknown as Profile[]);
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

    Hub.listen('network', hubListener);

    return () => {
      const cleanup = async () => {
        await Hub.listen('network', hubListener);
      };
      cleanup();
    };
  }, []);

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles
  };
} 