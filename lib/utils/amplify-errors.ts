/**
 * Amplify Error Types
 * This file contains type definitions and helper functions for Amplify errors
 */

// Define error type constants
export const ERROR_TYPES = {
  DATA_STORE: 'DataStoreError',
  GRAPHQL: 'GraphQLError',
  AUTH: 'AuthError',
  STORAGE: 'StorageError',
  NETWORK: 'NetworkError',
  API: 'ApiError',
};

/**
 * Check if error is a specific Amplify error type
 * @param err The error to check
 * @param errorType The error type to check for
 * @returns boolean indicating if the error matches the specified type
 */
export const isAmplifyError = (err: unknown, errorType: string): boolean => {
  return err instanceof Error && err.name === errorType;
};

/**
 * Check if error is a data-related error (DataStore or GraphQL)
 * @param err The error to check
 * @returns boolean indicating if the error is data-related
 */
export const isDataError = (err: unknown): boolean => {
  return (
    err instanceof Error &&
    (err.name === ERROR_TYPES.DATA_STORE || err.name === ERROR_TYPES.GRAPHQL)
  );
};

/**
 * Check if error is an authentication-related error
 * @param err The error to check
 * @returns boolean indicating if the error is auth-related
 */
export const isAuthError = (err: unknown): boolean => {
  return err instanceof Error && err.name === ERROR_TYPES.AUTH;
};

/**
 * Check if error is a storage-related error
 * @param err The error to check
 * @returns boolean indicating if the error is storage-related
 */
export const isStorageError = (err: unknown): boolean => {
  return err instanceof Error && err.name === ERROR_TYPES.STORAGE;
};

/**
 * Check if error is network-related
 * @param err The error to check
 * @returns boolean indicating if the error is network-related
 */
export const isNetworkError = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  
  return (
    err.name === ERROR_TYPES.NETWORK ||
    err.message.toLowerCase().includes('network') ||
    err.message.toLowerCase().includes('connection') ||
    err.message.toLowerCase().includes('offline')
  );
}; 