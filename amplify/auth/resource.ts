import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  // Configure authentication methods
  loginWith: {
    // Enable email-based authentication
    // Users will be able to sign up and sign in using their email address
    email: true,
  },
  
  // Define required user attributes that will be collected during sign-up
  userAttributes: {
    // First name of the user
    givenName: {
      required: true,     // Must be provided during sign-up
      mutable: true,      // Can be changed after account creation
    },
    
    // Last name of the user
    familyName: {
      required: true,     // Must be provided during sign-up
      mutable: true,      // Can be changed after account creation
    },
    
    // User's gender
    gender: {
      required: false,     // Must be provided during sign-up
      mutable: true,      // Can be changed after account creation
    }
  }
});
