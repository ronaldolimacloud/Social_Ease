import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'photo-uploads',
  access: (allow) => ({
    // Allow private access for authenticated users
    // Amplify automatically creates paths like private/{identity_id}/*
    'private/{entity_id}/*': [
      // Owner can read, write, delete their own photos
      allow.entity('identity').to(['read', 'write', 'delete'])
    ],
    // Maintain backward compatibility with old path structure
    'profiles/{entity_id}/*': [
      // Owner can read, write, delete their own photos
      allow.entity('identity').to(['read', 'write', 'delete']),
      // Other authenticated users can only view photos
      allow.authenticated.to(['read']),
      // Guests can only view photos
      allow.guest.to(['read'])
    ]
  }),
  // Add versioning for PCI DSS compliance
  versioned: true
});