import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../amplify/data/resource';

// Create a type-safe client for your Schema
export const client = generateClient<Schema>(); 