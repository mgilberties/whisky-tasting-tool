# Fixing 504 Error on Sign Up

If you're getting a 504 Gateway Timeout error when signing up, it's likely because Supabase is trying to send a confirmation email but the email service isn't configured or is timing out.

## Quick Fix: Disable Email Confirmation (Development)

For development/testing, you can disable email confirmation:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Under **Email Auth**, find **"Enable email confirmations"**
4. **Turn it OFF** (disable email confirmations)
5. Save the changes

Now users can sign up without needing to confirm their email first.

## Alternative: Configure Email Service (Production)

If you want email confirmations (recommended for production), you need to configure email:

### Option 1: Use Supabase's Built-in Email (Free Tier)
- Supabase provides email service on free tier
- Make sure it's enabled in Authentication → Settings
- Check that email templates are configured

### Option 2: Use Custom SMTP (Recommended for Production)
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your SMTP provider (Gmail, SendGrid, Mailgun, etc.)
3. Test the connection
4. Update email templates if needed

## Testing After Configuration

After making changes:
1. Try signing up again
2. Check the browser console for any errors
3. If using email confirmation, check your email (and spam folder)

## Troubleshooting

- **504 Timeout**: Usually means email service isn't configured
- **Email not received**: Check spam folder, verify email address
- **Still having issues**: Check Supabase logs in Dashboard → Logs → Auth

