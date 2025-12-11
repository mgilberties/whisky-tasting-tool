# SMTP Troubleshooting Guide

If you're getting 504 timeout errors when sending emails (signup, password reset), here's how to troubleshoot:

## Common Issues

### 1. SMTP Configuration Not Complete

**Check in Supabase Dashboard:**
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Verify all fields are filled:
   - SMTP Host
   - SMTP Port (usually 587 for TLS, 465 for SSL)
   - SMTP User
   - SMTP Password
   - Sender Email
   - Sender Name

### 2. SMTP Provider Issues

**For Gmail:**
- Use "App Password" not your regular password
- Enable 2FA first
- SMTP Host: `smtp.gmail.com`
- Port: `587` (TLS) or `465` (SSL)

**For SendGrid:**
- SMTP Host: `smtp.sendgrid.net`
- Port: `587`
- User: `apikey`
- Password: Your SendGrid API key

**For Mailgun:**
- SMTP Host: `smtp.mailgun.org`
- Port: `587`
- Use your Mailgun SMTP credentials

### 3. Redirect URL Configuration

**In Supabase Dashboard:**
1. Go to **Authentication** → **URL Configuration**
2. Add your site URL: `http://localhost:3000` (for development)
3. Add redirect URLs:
   - `http://localhost:3000/auth/reset-password`
   - `http://localhost:3000/auth/callback`
4. For production, add your production URLs

### 4. Test SMTP Connection

**In Supabase Dashboard:**
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Click "Test Email" or "Send Test Email"
3. Check if it succeeds or fails

### 5. Check Supabase Logs

1. Go to **Logs** → **Auth Logs** in Supabase Dashboard
2. Look for errors related to email sending
3. Check for SMTP connection errors

## Quick Fixes

### Option 1: Use Supabase's Built-in Email (Free Tier)
- Go to **Authentication** → **Settings**
- Disable custom SMTP
- Use Supabase's default email service
- Note: Limited emails per hour on free tier

### Option 2: Disable Email Confirmation (Development Only)
- Go to **Authentication** → **Settings**
- Turn OFF "Enable email confirmations"
- Users can sign up without email verification
- **Not recommended for production**

### Option 3: Check Firewall/Network
- Ensure Supabase can reach your SMTP server
- Check if port 587/465 is blocked
- Verify SMTP server allows connections from Supabase IPs

## Testing After Configuration

1. **Test Sign Up:**
   - Try creating a new account
   - Check if confirmation email arrives

2. **Test Password Reset:**
   - Click "Forgot password"
   - Enter your email
   - Check email for reset link

3. **Check Email Delivery:**
   - Check spam/junk folder
   - Verify sender email is correct
   - Check email server logs if possible

## Common Error Messages

- **504 Gateway Timeout**: SMTP server not responding or misconfigured
- **535 Authentication Failed**: Wrong SMTP credentials
- **550 Mailbox Unavailable**: Sender email not verified
- **Connection Refused**: SMTP host/port incorrect

## Still Having Issues?

1. Verify SMTP credentials are correct
2. Test SMTP connection outside of Supabase
3. Check Supabase status page for service issues
4. Contact Supabase support if problem persists

