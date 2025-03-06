/**
 * Utils index file
 * Re-exports all utility functions from the utils directory for easier imports
 */

export * from './error-handler';
export * from './amplify-errors';
import { getUrl } from 'aws-amplify/storage';

/**
 * Refreshes an S3 image URL to ensure it hasn't expired
 * 
 * @param photoKey The S3 object key
 * @param existingUrl Optional fallback URL if refresh fails
 * @returns A fresh signed URL for the image
 */
export const refreshImageUrl = async (photoKey: string | null | undefined, existingUrl?: string): Promise<string> => {
  if (!photoKey) {
    return existingUrl || '';
  }
  
  try {
    // For private storage keys
    let key = photoKey;
    let accessLevel: 'private' | 'guest' | undefined = 'private';
    
    // If the key already includes the private/ prefix, extract just the filename
    if (photoKey.startsWith('private/')) {
      // The key format is private/{identityId}/{filename}
      // We need to extract just the filename part
      const parts = photoKey.split('/');
      if (parts.length >= 3) {
        // Get just the filename (last part)
        key = parts[parts.length - 1];
      }
    } else if (photoKey.startsWith('profiles/')) {
      // For backward compatibility with old path format
      accessLevel = undefined;
    }
    
    const { url } = await getUrl({ 
      key,
      options: { 
        accessLevel,
        expiresIn: 3600 // 1 hour expiration
      }
    });
    return url.toString();
  } catch (error) {
    console.error('Error refreshing image URL:', error);
    return existingUrl || '';
  }
}; 