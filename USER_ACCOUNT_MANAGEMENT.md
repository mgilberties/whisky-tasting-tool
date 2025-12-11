# User Account Management

This document explains how to lock/disable user accounts.

## Database Setup

Run the migration file: `supabase-user-profiles-migration.sql`

This creates:
- `user_profiles` table to track account status
- Automatic profile creation when users sign up
- Helper functions to disable/enable accounts

## Disabling a User Account

### Using SQL Function (Recommended)

```sql
-- Disable a user account by user ID
SELECT disable_user_account('user-uuid-here');

-- Disable a user account and track who disabled it
SELECT disable_user_account('user-uuid-here', 'admin-user-uuid-here');

-- Disable by email
SELECT disable_user_account(
    (SELECT id FROM auth.users WHERE email = 'user@example.com')::uuid
);
```

### Using Direct SQL Update

```sql
-- Disable a user account
UPDATE public.user_profiles
SET 
    is_disabled = TRUE,
    disabled_at = NOW(),
    updated_at = NOW()
WHERE id = 'user-uuid-here';

-- Or by email
UPDATE public.user_profiles
SET 
    is_disabled = TRUE,
    disabled_at = NOW(),
    updated_at = NOW()
WHERE email = 'user@example.com';
```

## Enabling a User Account

### Using SQL Function (Recommended)

```sql
-- Enable a user account by user ID
SELECT enable_user_account('user-uuid-here');

-- Enable by email
SELECT enable_user_account(
    (SELECT id FROM auth.users WHERE email = 'user@example.com')::uuid
);
```

### Using Direct SQL Update

```sql
-- Enable a user account
UPDATE public.user_profiles
SET 
    is_disabled = FALSE,
    disabled_at = NULL,
    disabled_by = NULL,
    updated_at = NOW()
WHERE id = 'user-uuid-here';
```

## Checking Account Status

```sql
-- Check if a user is disabled
SELECT id, email, name, is_disabled, disabled_at, disabled_by
FROM public.user_profiles
WHERE email = 'user@example.com';

-- List all disabled accounts
SELECT id, email, name, disabled_at, disabled_by
FROM public.user_profiles
WHERE is_disabled = TRUE
ORDER BY disabled_at DESC;
```

## How It Works

1. **On Sign Up**: A profile is automatically created via trigger
2. **On Sign In**: The app checks if `is_disabled = TRUE` and blocks login
3. **Active Sessions**: Disabled users will be blocked on their next action (they'll need to sign in again)

## Using in Code

```typescript
import { disableUserAccount, enableUserAccount, checkIfUserDisabled } from '@/lib/supabase';

// Disable an account
await disableUserAccount(userId, currentAdminUserId);

// Enable an account
await enableUserAccount(userId);

// Check if disabled
const isDisabled = await checkIfUserDisabled(userId);
```

## Notes

- Disabled users cannot sign in
- Existing sessions may remain active until they expire or user tries to sign in again
- The `disabled_by` field tracks who disabled the account (useful for audit)
- The `disabled_at` field records when the account was disabled

