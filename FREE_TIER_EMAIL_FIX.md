# Fixing Email Issues on Supabase Free Tier

If you're getting 504 timeouts on password reset/signup emails, here's what to check:

## Critical Settings to Verify

### 1. Enable Custom SMTP (Most Important!)

**In Supabase Dashboard:**
1. Go to **Authentication** → **Settings**
2. Scroll down to **SMTP Settings**
3. **Make sure "Enable Custom SMTP" toggle is ON** (this is often missed!)
4. Verify all SMTP fields are filled correctly

### 2. Free Tier Limitations

Supabase free tier has strict email limits:
- **Only 2 emails per hour** to addresses outside your organization
- Built-in email service is very limited
- Custom SMTP should bypass this, but only if properly enabled

### 3. Verify SMTP is Actually Being Used

Even if SMTP is configured, Supabase might still use its default service if:
- "Enable Custom SMTP" toggle is OFF
- SMTP credentials are incorrect
- SMTP connection fails

## Step-by-Step Fix

1. **Go to Authentication → Settings → SMTP Settings**
2. **Turn ON "Enable Custom SMTP"** (critical!)
3. **Fill in all fields:**
   - SMTP Host: `smtp.gmail.com` (or your provider)
   - SMTP Port: `587` (TLS) or `465` (SSL)
   - SMTP User: Your email or API key
   - SMTP Password: Your password or API key
   - Sender Email: Must match SMTP user (for Gmail)
   - Sender Name: Your app name

4. **Save the settings**

5. **Check Authentication → Settings → Email Templates**
   - Make sure templates are configured
   - Custom SMTP should use these templates

## Alternative: Disable Email Confirmation (Development)

If SMTP still doesn't work on free tier:

1. Go to **Authentication** → **Settings**
2. Turn OFF **"Enable email confirmations"**
3. Users can sign up without email verification
4. **Note:** Password reset will still require email

## Testing

After enabling custom SMTP:
1. Wait a few minutes for settings to propagate
2. Try password reset again
3. Check Supabase logs: **Logs** → **Auth Logs**
4. Look for SMTP connection errors

## If Still Not Working

1. **Double-check the "Enable Custom SMTP" toggle is ON**
2. **Verify SMTP credentials work** (test with a mail client)
3. **Check Supabase status page** for service issues
4. **Consider upgrading** to Pro plan for better email reliability
5. **Or use a third-party service** like Resend, SendGrid, or Mailgun

## Quick Test

Try this SQL to check if SMTP is configured:
```sql
-- This won't work directly, but check in Dashboard:
-- Authentication → Settings → SMTP Settings
-- Should show "Custom SMTP Enabled: Yes"
```

The most common issue is forgetting to toggle "Enable Custom SMTP" ON after configuring the SMTP settings!

