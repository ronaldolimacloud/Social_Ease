import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'photo-uploads',
  access: (allow) => ({
    // Use entity-based access control for profile pictures
    'profiles/{entity_id}/*': [
      // Owner can read, write, delete their own photos
      allow.entity('identity').to(['read', 'write', 'delete']),
      // Other authenticated users can only view photos
      allow.authenticated.to(['read']),
      // Guests can only view photos, can't list all photos
      allow.guest.to(['read'])
    ]
  })
});