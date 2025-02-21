import { useState } from 'react';
import { client } from '../amplify';

interface GroupInput {
  name: string;
  type: string;
  description?: string;
}

export const useGroup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroup = async (input: GroupInput) => {
    try {
      setLoading(true);
      const newGroup = await client.models.Group.create({
        ...input,
        memberCount: 1,
        owner: '', // Amplify will fill this
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return newGroup;
    } catch (err) {
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

  return {
    createGroup,
    listGroups,
    loading,
    error,
  };
}; 