import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../amplify/data/resource';

/**
 * Creates a type-safe client for your Amplify Gen 2 Schema
 * This client is used throughout the application for all data operations
 */
export const client = generateClient<Schema>();

// Note: Keep this file as the single source of your client
// Add any additional client configuration here as needed in the future 