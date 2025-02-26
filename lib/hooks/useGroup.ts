import { useState } from 'react';
import { client } from '../amplify';
import { Group, GroupInput } from '../types';
import { handleError, clearError } from '../utils';

export const useGroup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async (input: GroupInput) => {
    try {
      setLoading(true);
      setError(null);
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
      
      // More detailed error logging
      if (err instanceof Error) {
        console.error(`Error type: ${err.name}, Message: ${err.message}`);
        if (err.stack) console.error(`Stack trace: ${err.stack}`);
      }
      
      handleError(err, setError);
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
      // More detailed error logging
      if (err instanceof Error) {
        console.error(`Error listing groups - Type: ${err.name}, Message: ${err.message}`);
        if (err.stack) console.error(`Stack trace: ${err.stack}`);
      }
      
      handleError(err, setError);
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
      // More detailed error logging
      if (err instanceof Error) {
        console.error(`Error deleting group - Type: ${err.name}, Message: ${err.message}`);
        if (err.stack) console.error(`Stack trace: ${err.stack}`);
      }
      
      handleError(err, setError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add an update operation for groups
   */
  const updateGroup = async (id: string, input: Partial<GroupInput>) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await client.models.Group.update({
        id,
        ...input,
      });
      
      return result;
    } catch (err) {
      // More detailed error logging
      if (err instanceof Error) {
        console.error(`Error updating group - Type: ${err.name}, Message: ${err.message}`);
        if (err.stack) console.error(`Stack trace: ${err.stack}`);
      }
      
      handleError(err, setError);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createGroup,
    updateGroup,
    listGroups,
    deleteGroup,
    loading,
    error,
    clearError: () => clearError(setError),
  };
}; 