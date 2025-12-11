# Authentication & User Accounts Setup Guide

This document outlines the implementation of user accounts and authentication for the Whisky Tasting Tool.

## What's Been Implemented

### 1. Database Schema Updates
- ✅ Added `host_user_id` to `sessions` table (links sessions to authenticated hosts)
- ✅ Added `user_id` to `participants` table (links participants to authenticated users)
- ✅ Created `session_invitations` table for email-based invitations
- ✅ Updated RLS policies to support authenticated users while maintaining backward compatibility

### 2. TypeScript Types
- ✅ Updated database types to include new user-related fields
- ✅ Added `session_invitations` table types

### 3. Authentication Components
- ✅ Created `AuthForm` component for sign in/sign up/password reset
- ✅ Updated Supabase client configuration for auth

## What Still Needs Implementation

### 4. Update Home Page
- Update home page to require authentication for hosting
- Show login/signup options
- Add link to user dashboard

### 5. User Dashboard
- Create `/dashboard` page showing:
  - Hosted sessions (past and present)
  - Participated sessions
  - Ability to create new session

### 6. Update Session Creation
- Modify `createSession` to require authentication
- Link new sessions to `host_user_id`

### 7. Invitation System
- Add UI in host dashboard to invite participants by email
- Create invitation acceptance flow
- Send invitation emails (via Supabase or email service)

### 8. Participant History
- Create `/my-tastings` page showing:
  - All sessions user participated in
  - Their guesses and scores
  - Revealed results

### 9. Update Participant Flow
- Allow participants to join with or without authentication
- Link authenticated participants to their user account
- Show invitation acceptance for invited users

## Database Migration Steps

1. **Enable Supabase Auth** (if not already enabled):
   - Go to Authentication → Settings in Supabase Dashboard
   - Enable Email auth provider

2. **Run the migration**:
   ```sql
   -- Run supabase-auth-migration.sql in Supabase SQL Editor
   ```

3. **Configure email templates** (optional):
   - Customize email templates in Authentication → Email Templates
   - Set up SMTP if you want custom email sending

## Next Steps

1. Run the database migration
2. Test authentication flow
3. Implement remaining UI components
4. Test invitation system
5. Deploy and test end-to-end

## Notes

- The RLS policies allow anonymous participation for backward compatibility
- Hosts MUST be authenticated to create sessions
- Invited participants should authenticate to accept invitations
- All user data is linked via `auth.users` (Supabase's built-in auth table)

