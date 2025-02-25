import { useState } from 'react';
import { client } from '../amplify';

export const useInsight = (profileId: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInsight = async (text: string) => {
    try {
      setLoading(true);
      const newInsight = await client.models.Insight.create({
        text,
        timestamp: new Date().toISOString(),
        profileID: profileId,
        owner: '', // Amplify will fill this
      });
      return newInsight;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const insights = await client.models.Insight.list({
        filter: {
          profileID: {
            eq: profileId
          }
        }
      });
      return insights;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createInsight,
    listInsights,
    loading,
    error,
  };
}; 