/**
 * CloudFront utilities for image handling
 */

// CloudFront distribution URL
export const CLOUDFRONT_URL = 'https://dj3so7easbr2o.cloudfront.net';

/**
 * Converts an S3 key to a CloudFront URL
 * 
 * @param photoKey The S3 object key
 * @returns A CloudFront URL for the image
 */
export const getCloudFrontUrl = (photoKey: string): string => {
  if (!photoKey) return '';
  
  // URL encode the key to handle special characters like colons
  const encodedKey = encodeURIComponent(photoKey);
  
  // For keys that already have the proper format, just append to CloudFront URL
  return `${CLOUDFRONT_URL}/${encodedKey}`;
};

/**
 * Creates a CloudFront-compatible S3 key from a filename and identity ID
 * 
 * @param filename The image filename
 * @param identityId The user's identity ID
 * @returns A properly formatted S3 key for CloudFront
 */
export const createCloudFrontKey = (filename: string, identityId: string): string => {
  return `private/${identityId}/${filename}`;
}; 