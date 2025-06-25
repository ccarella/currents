# Password Reset Setup Guide

This guide explains how to configure the password reset functionality in your Supabase project.

## Overview

The password reset functionality has been implemented with the following features:

- **Forgot Password Page** (`/auth/forgot-password`): Users can request a password reset by entering their email
- **Reset Password Page** (`/auth/reset-password`): Users can set a new password after clicking the link in their email
- **Rate Limiting**: Protection against too many reset requests
- **Strong Password Validation**: Enforces secure password requirements
- **Token Validation**: Handles expired or invalid reset tokens

## Supabase Email Template Configuration

To complete the setup, you need to configure the email template in your Supabase dashboard:

### 1. Access Email Templates

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Email Templates**

### 2. Configure the Reset Password Template

1. Select the **Reset Password** template
2. Update the template content with the following:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>
  You requested to reset your password. Click the link below to set a new
  password:
</p>
<p>
  <a
    href="{{ .SiteURL }}/auth/reset-password#access_token={{ .Token }}&type=recovery&token_hash={{ .TokenHash }}"
  >
    Reset Password
  </a>
</p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Best regards,<br />The Currents Team</p>
```

### 3. Configure Email Settings

Ensure your email settings are properly configured:

1. Go to **Authentication** > **Providers**
2. Under **Email**, ensure it's enabled
3. Configure the following settings:
   - **Enable Email Confirmations**: Toggle based on your preference
   - **Secure Email Change**: Recommended to be enabled
   - **Secure Password Change**: Recommended to be enabled

### 4. Custom SMTP (Production)

For production use, configure a custom SMTP server:

1. Go to **Settings** > **Auth**
2. Under **SMTP Settings**, configure your custom SMTP provider
3. Recommended providers:
   - SendGrid
   - AWS SES
   - Postmark
   - Mailgun

## Testing the Password Reset Flow

1. **Request Password Reset**:
   - Navigate to `/auth/forgot-password`
   - Enter a registered email address
   - Click "Send reset link"

2. **Check Email**:
   - For local development, check Inbucket at `http://localhost:54324`
   - For production, check the email inbox

3. **Reset Password**:
   - Click the link in the email
   - Enter and confirm your new password
   - Password must be at least 8 characters with uppercase, lowercase, and numbers

4. **Sign In**:
   - After successful reset, you'll be redirected to sign in
   - Use your new password to log in

## Security Considerations

1. **Rate Limiting**: The implementation includes rate limiting to prevent abuse
2. **Token Expiration**: Reset tokens expire after 1 hour
3. **Password Requirements**:
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
4. **HTTPS Only**: Ensure your production site uses HTTPS

## Troubleshooting

### "Invalid or expired link" error

- The reset token has expired (1 hour limit)
- The link was already used
- Solution: Request a new password reset

### "Rate limit exceeded" error

- Too many reset requests in a short time
- Solution: Wait before requesting again

### Email not received

- Check spam/junk folder
- Verify SMTP configuration in Supabase
- For local development, check Inbucket

## Environment Variables

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # or your production URL
```

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Custom SMTP Setup](https://supabase.com/docs/guides/auth/auth-smtp)
