import { useState } from 'react';
import { client } from '../amplify';

// Simplified GroupInput interface - only name is required
interface GroupInput {
  name: string;
  type?: string;
  description?: string;
}

export const useGroup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async (input: GroupInput) => {
    try {
      setLoading(true);
      console.log('Creating group with input:', input);
      
      // Create a group with just a name and default values for other fields
      const result = await client.models.Group.create({
        name: input.name,
        type: input.type || 'general', // Default type if not provided
        description: input.description || '',
        memberCount: 1,
      });
      
      console.log('Group creation result:', result);
      return result;
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const groups = await client.models.Group.list();
      return groups;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Find and delete all ProfileGroup associations first to avoid orphaned references
      const profileGroups = await client.models.ProfileGroup.list({
        filter: {
          groupID: {
            eq: groupId
          }
        }
      });
      
      if (profileGroups.data.length > 0) {
        await Promise.all(profileGroups.data.map(pg => 
          client.models.ProfileGroup.delete({ id: pg.id })
        ));
      }
      
      // Now delete the group itself
      const result = await client.models.Group.delete({ id: groupId });
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createGroup,
    listGroups,
    deleteGroup,
    loading,
    error,
  };
}; 