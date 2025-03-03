import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'photo-uploads',
  access: (allow) => ({
    // Allow public read access to profile pictures, but only authenticated users can write/delete
    'profiles/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});