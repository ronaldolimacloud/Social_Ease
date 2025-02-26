import { 
  isDataError, 
  isAuthError, 
  isStorageError, 
  isNetworkError 
} from './amplify-errors';

/**
 * Centralized error handling utility
 * Consistently formats errors and provides centralized logging
 * @param err - The error to be handled
 * @param setErrorFn - Optional function to set the error in a state variable
 * @returns Formatted error message
 */
export const handleError = (err: unknown, setErrorFn?: (msg: string) => void) => {
  let message = 'An unexpected error occurred';
  
  if (err instanceof Error) {
    // Check for specific Amplify error types using our helpers
    if (isDataError(err)) {
      // Handle Amplify Data/GraphQL specific errors
      message = `Database error: ${err.message}`;
    } else if (isAuthError(err)) {
      // Handle Amplify Auth specific errors
      message = `Authentication error: ${err.message}`;
    } else if (isStorageError(err)) {
      // Handle Amplify Storage specific errors
      message = `Storage error: ${err.message}`;
    } else if (isNetworkError(err)) {
      // Handle network-related errors
      message = 'Network error: Please check your connection and try again';
    } else {
      // Handle generic Error objects
      message = err.message;
    }
  }
  
  if (setErrorFn) setErrorFn(message);
  console.error('[Error]:', err);
  return message;
};

/**
 * Clear error in state
 * Utility function to clear error state
 * @param setErrorFn - Function to set/clear the error state
 */
export const clearError = (setErrorFn: (msg: string | null) => void) => {
  setErrorFn(null);
}; 