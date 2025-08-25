/**
 * Core application data models
 * This file centralizes all shared type definitions used across the app
 */
import type { Nullable } from '@aws-amplify/data-schema';


/**
 * Group model - Represents a social group
 */
export interface Group {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  memberCount?: number;
  _version?: number;
  _deleted?: boolean;
  _lastChangedAt?: number;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Input for creating/updating a group
 */
export interface GroupInput {
  id?: string;
  name: string;
  type?: string;
  description?: string;
  memberCount?: number;
}

/**
 * Insight model - Represents a note or tip about a profile
 */
export interface Insight {
  id: string;
  text: string;
  timestamp: string;
  profileID?: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Input for creating/updating an insight
 */
export interface InsightInput {
  text: string;
  timestamp: string;
}

/**
 * Profile model - Represents a user profile
 */
export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  description: Nullable<string>;
  bio: Nullable<string>;
  photoUrl: Nullable<string>;
  insights?: Insight[];
  groups?: Array<{
    id: string;
    type: string;
    name: string;
  }>;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Input for creating/updating a profile
 */
export interface ProfileInput {
  firstName: string;
  lastName: string;
  description?: string;
  bio?: string;
  photoUrl?: string;
}

/**
 * ProfileGroup model - Represents the join table for many-to-many relationship
 */
export interface ProfileGroup {
  id: string;
  profileID: string;
  groupID: string;
  joinedDate: string;
  profile?: Profile;
  group?: Group;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Options for querying profiles
 */
export interface ProfileQueryOptions {
  limit?: number;
  nextToken?: string;
  filter?: Record<string, any>;
}

/**
 * Return type for useProfiles hook
 */
export interface UseProfilesReturn {
  profiles: Profile[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} 