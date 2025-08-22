import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';

/**
 * Creates a type-safe client for your Amplify Gen 2 Schema
 * This client is used throughout the application for all data operations
 */
// Ensure Amplify is configured before creating the data client
Amplify.configure(outputs);

export const client = generateClient<Schema>();

// Note: Keep this file as the single source of your client
// Add any additional client configuration here as needed in the future 