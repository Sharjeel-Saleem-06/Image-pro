# 🔐 Supabase Authentication Setup Guide

This guide will walk you through setting up Supabase authentication for ImagePro step by step.

---

## 📋 Table of Contents

1. [Create Supabase Project](#1-create-supabase-project)
2. [Get API Keys](#2-get-api-keys)
3. [Configure Environment Variables](#3-configure-environment-variables)
4. [Run Database Setup Script](#4-run-database-setup-script)
5. [Configure Authentication Providers](#5-configure-authentication-providers)
6. [Configure Redirect URLs](#6-configure-redirect-urls)
7. [Test the Authentication](#7-test-the-authentication)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Create Supabase Project

### Step 1: Sign up for Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with GitHub (recommended) or email

### Step 2: Create a new project
1. Click **"New Project"**
2. Fill in the details:
   - **Organization**: Select or create one
   - **Project name**: `imagepro` (or your preferred name)
   - **Database password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
3. Click **"Create new project"**
4. Wait 2-3 minutes for setup to complete

---

## 2. Get API Keys

### Step 1: Go to Project Settings
1. In your Supabase dashboard, click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** in the settings menu

### Step 2: Copy the keys
You'll see two important values:

1. **Project URL**: `https://your-project-id.supabase.co`
2. **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

⚠️ **Important**: The `anon` key is safe to use in frontend code. Never expose the `service_role` key!

---

## 3. Configure Environment Variables

### Step 1: Create the .env file
In your project root, create a `.env` file (or copy from `.env.example`):

```bash
cp .env.example .env
```

### Step 2: Add your Supabase credentials
Edit the `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key
```

### Step 3: Restart your development server
```bash
npm run dev
```

---

## 4. Run Database Setup Script

### Step 1: Open SQL Editor
1. In Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**

### Step 2: Run the setup script
1. Open the file `supabase/setup.sql` from this project
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **"Run"** (or press Cmd/Ctrl + Enter)

### Step 3: Verify the tables
1. Click **"Table Editor"** in the left sidebar
2. You should see these tables:
   - `profiles`
   - `user_activity`
   - `user_projects`

---

## 5. Configure Authentication Providers

### Email/Password Authentication
Email/password is enabled by default in Supabase.

### Configure Email Templates (Optional)
1. Go to **Authentication** → **Email Templates**
2. Customize the templates for:
   - Confirm signup
   - Magic Link
   - Reset Password

### Set up Google OAuth

#### Step 1: Create Google Cloud credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
5. Configure consent screen if prompted:
   - Select "External" for user type
   - Fill in app name, support email, developer email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if in testing mode

#### Step 2: Create OAuth Client ID
1. Application type: **Web application**
2. Name: `ImagePro`
3. Authorized JavaScript origins:
   ```
   http://localhost:5173
   http://localhost:8080
   https://your-production-url.com
   ```
4. Authorized redirect URIs:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
5. Click **Create** and save the **Client ID** and **Client Secret**

#### Step 3: Add to Supabase
1. In Supabase, go to **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. Paste your **Client ID** and **Client Secret**
4. Click **Save**

---

## 6. Configure Redirect URLs

### Step 1: Add Site URL
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your app's URL:
   - Development: `http://localhost:5173`
   - Production: `https://your-app.netlify.app`

### Step 2: Add Redirect URLs
Add these to **Redirect URLs**:

```
http://localhost:5173/auth/callback
http://localhost:8080/auth/callback
https://your-production-url.com/auth/callback
```

---

## 7. Test the Authentication

### Start the development server
```bash
npm run dev
```

### Test Email/Password Sign Up
1. Go to `http://localhost:5173/auth/signup`
2. Enter your email and password
3. Click "Create Account"
4. Check your email for verification link
5. Click the link to verify

### Test Magic Link
1. Go to `http://localhost:5173/auth/login`
2. Click "Sign in with Magic Link"
3. Enter your email
4. Check your email and click the magic link

### Test Google Sign In
1. Go to `http://localhost:5173/auth/login`
2. Click "Continue with Google"
3. Select your Google account
4. You should be redirected back and logged in

### Test Sign Out
1. Click your profile avatar in the navigation
2. Click "Sign Out"
3. You should be logged out

---

## 8. Troubleshooting

### "Invalid API Key" Error
- Double-check your `.env` file has the correct values
- Make sure there are no extra spaces or quotes
- Restart the development server after changing `.env`

### Google Sign-In Not Working
- Verify your Google Cloud OAuth credentials
- Check that redirect URIs match exactly
- Make sure the Google provider is enabled in Supabase

### "Email not confirmed" Error
- Check your spam folder for the confirmation email
- Go to **Authentication** → **Settings** and temporarily disable "Enable email confirmations" for testing
- You can also manually confirm users in **Authentication** → **Users**

### Profile Not Created After Sign Up
- Check that the `handle_new_user` trigger exists in the database
- Run the setup.sql script again
- Check the database logs for errors

### CORS Errors
- Make sure your Site URL is set correctly in Supabase
- Add your local development URL to allowed redirect URLs

---

## 📁 File Structure Created

```
src/
├── lib/
│   └── supabase.ts           # Supabase client & auth helpers
├── contexts/
│   └── AuthContext.tsx       # Auth state management
├── components/
│   └── ProtectedRoute.tsx    # Route protection component
├── pages/
│   ├── AuthPage.tsx          # Login/Signup page
│   ├── AuthCallback.tsx      # OAuth callback handler
│   └── ProfilePage.tsx       # User profile page
supabase/
└── setup.sql                 # Database setup script
.env.example                  # Environment template
```

---

## 🎉 Done!

Your ImagePro app now has full authentication with:
- ✅ Email/Password login
- ✅ Magic links (passwordless)
- ✅ Google OAuth
- ✅ User profiles
- ✅ Protected routes
- ✅ Beautiful auth UI

---

## 📚 Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
