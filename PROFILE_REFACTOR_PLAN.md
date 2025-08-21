## Profiles Module — Remaining Tasks

This trimmed plan removes completed work (single Amplify client, centralized types, N+1 fix in `useProfiles`, extracted `ProfileForm`) and focuses on what’s next.

### 1) Reuse `ProfileForm` in both UIs (or choose one)
- Why: Reduce code paths; ensure consistent UX.
- Actions:
  - In `components/ProfileModal.tsx`, replace inner form with `<ProfileForm onSubmit={createProfile…} onCancel={onClose} />`.
  - In `app/(tabs)/profilesao/new_profile.tsx`, render `<ProfileForm />` and on success navigate to profiles (e.g., `router.replace('/(tabs)/profilesao/profiles')`).
  - Optional: Keep only one entry point and have the other navigate there.
- Acceptance:
  - No duplicated form logic remains across the modal and screen.

### 2) Extract `GroupPicker` component
- Why: Group selection UI is duplicated.
- Actions:
  - Add `components/GroupPicker.tsx` to fetch groups, show a selectable list, and return selected groups via callback/props.
  - Use it inside `ProfileForm`.
- Acceptance:
  - Group selection lives in one place and is reused.

### 3) Normalize photo storage key handling (choose one approach and apply everywhere)
- Why: Avoid mismatches between upload/delete and ensure CloudFront URLs are consistent.
- Recommended: Adopt Option A for consistency and simpler Storage calls.
  - A) Store only the filename in `photoKey`. Use `accessLevel: 'private'` in Storage so the SDK applies `private/{identityId}`. Build CloudFront path when needed with `createCloudFrontKey(filename, identityId)`.
  - If you keep Option B (store full S3 key), ensure delete/update calls use the raw path without double-prefixing via `accessLevel`.
- Files to change:
  - `lib/hooks/useProfile.ts`: update `handlePhotoUpload` to store filename in `photoKey`; ensure `createProfile`, `updateProfile`, and `deleteProfile` use consistent key semantics. Use `getFilenameFromPath` as a migration-safe helper for existing data.
  - `lib/utils/cloudfront.ts`: confirm `getCloudFrontUrl`/`createCloudFrontKey` align with the chosen option.
- Acceptance:
  - Create/update/delete of photos work without orphaned S3 objects; CloudFront images render correctly for new and existing profiles.

### 4) Cleanup imports and alias config
- Why: Prevent runtime issues and keep code tidy.
- Actions:
  - Remove unused imports in `lib/hooks/useProfile.ts` (e.g., `generateClient`, `Schema`, `Alert`, `getCurrentUser`, `Dispatch`, `SetStateAction`, unused assets).
  - Keep Babel alias (`@`) and TS `paths` in sync. Use `import type` where appropriate.
- Acceptance:
  - No unused imports or unresolved modules; app starts cleanly.

### 5) Optional: adopt a form library
- Why: Reduce form boilerplate and unify validation.
- Actions:
  - Add `react-hook-form` and optionally `zod` for schema validation. Implement `ProfileForm` with RHF controllers.
- Acceptance:
  - Simpler form code; consistent validation and error handling.

### 6) QA checklist
- Run `npx expo start -c` if caches interfere.
- Validate flows end-to-end:
  - Create profile via modal and via page.
  - Add/remove insights and select groups.
  - Image picking, upload, CloudFront display, and deletion on profile delete.
  - Profiles list loads without N+1 spikes.
  - Auth redirects still correct (`/start` ↔ `/(tabs)`).

---

Notes
- `app/(tabs)/profilesao/profiles.tsx` is compatible with the new hooks and photo handling approach that prefers `photoKey` then falls back to `photoUrl`.
- If migrating existing `photoKey` values from full S3 keys to filenames, keep `getFilenameFromPath` in place to handle old records gracefully.


