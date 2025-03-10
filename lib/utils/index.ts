/**
 * Utils index file
 * Re-exports all utility functions from the utils directory for easier imports
 */

export * from './error-handler';
export * from './amplify-errors';
export * from './cloudfront'; // Export CloudFront utilities

import { getUrl } from 'aws-amplify/storage';
import { CLOUDFRONT_URL, getCloudFrontUrl } from './cloudfront';

/**
 * Refreshes an image URL using CloudFront for display or falls back to S3 pre-signed URL if needed
 * 
 * @param photoKey The S3 object key
 * @param existingUrl Optional fallback URL if refresh fails
 * @returns A CloudFront URL for the image
 */
export const refreshImageUrl = async (photoKey: string | null | undefined, existingUrl?: string): Promise<string> => {
  console.log('refreshImageUrl called with:', { photoKey, existingUrl });
  
  if (!photoKey) {
    console.log('No photoKey provided, returning existingUrl:', existingUrl);
    return existingUrl || '';
  }
  
  try {
    // For private storage paths, construct the CloudFront URL
    // If the key already includes the private/ prefix, use it as is
    if (photoKey.startsWith('private/')) {
      const cloudFrontUrl = getCloudFrontUrl(photoKey);
      console.log('Using CloudFront URL for private/ path:', cloudFrontUrl);
      return cloudFrontUrl;
    }
    
    // If it's just a filename without a path, we need to add the private/{identityId}/ prefix
    // Since we don't have the identityId here, we'll fall back to the S3 pre-signed URL
    // This should only happen for older images that haven't been migrated
    if (!photoKey.includes('/')) {
      console.log('No path separator in photoKey, getting signed URL for:', photoKey);
      try {
        const { url } = await getUrl({ 
          key: photoKey,
          options: { 
            accessLevel: 'private',
            expiresIn: 3600 // 1 hour expiration
          }
        });
        const signedUrl = url.toString();
        console.log('Got signed URL:', signedUrl);
        return signedUrl;
      } catch (getUrlError) {
        console.error('Error getting signed URL:', getUrlError);
        return existingUrl || '';
      }
    }
    
    // For keys in the profiles/ format (backward compatibility)
    const cloudFrontUrl = getCloudFrontUrl(photoKey);
    console.log('Using CloudFront URL for other path format:', cloudFrontUrl);
    return cloudFrontUrl;
  } catch (error) {
    console.error('Error refreshing image URL:', error);
    return existingUrl || '';
  }
}; 