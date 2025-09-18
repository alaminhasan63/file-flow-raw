# Environment Variables Setup Guide

## 🔧 Local Development Environment

Create a `.env.local` file in your project root:

```bash
# .env.local (for local development)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🚀 Production Environment (Vercel)

Set these in your Vercel dashboard:

```bash
# Production Environment Variables
NEXT_PUBLIC_SITE_URL=https://file-flow-raw.vercel.app
```

## 🧪 Staging Environment (Optional)

If you have a staging deployment:

```bash
# Staging Environment Variables
NEXT_PUBLIC_SITE_URL=https://file-flow-raw-staging.vercel.app
```

## 📋 Complete Example Files

### `.env.local` (Local Development)

```bash
# =============================================================================
# REQUIRED: Site URL Configuration
# =============================================================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# =============================================================================
# OPTIONAL: Supabase Configuration (if overriding defaults)
# =============================================================================
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### `.env.production` (Reference for Production Settings)

```bash
# =============================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# =============================================================================
# Set these in Vercel Dashboard → Settings → Environment Variables

NEXT_PUBLIC_SITE_URL=https://file-flow-raw.vercel.app

# Optional: Custom Supabase settings
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🛠️ How to Set Up

### 1. Local Development

```bash
# Create .env.local file
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" > .env.local
```

### 2. Vercel Production

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `file-flow-raw` project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `NEXT_PUBLIC_SITE_URL`
   - **Value**: `https://file-flow-raw.vercel.app`
   - **Environment**: Production, Preview, Development

### 3. Verify Setup

After setting the environment variables:

```bash
# Local development
npm run dev
# Visit: http://localhost:3000/app/start

# Production (after deployment)
# Visit: https://file-flow-raw.vercel.app/app/start
```

## ✅ Testing Checkout Flow

1. Complete the filing process
2. Click "Proceed to Payment"
3. Verify the checkout URL matches your environment:
   - **Local**: `http://localhost:3000/checkout/mock?session_id=...`
   - **Production**: `https://file-flow-raw.vercel.app/checkout/mock?session_id=...`

## ❌ Troubleshooting

If you see "NEXT_PUBLIC_SITE_URL environment variable is not configured":

1. Check that the environment variable is set correctly
2. Restart your development server: `npm run dev`
3. For production: redeploy after setting the variable in Vercel

## 🔒 Security Notes

- Never commit `.env.local` to git (it's in .gitignore)
- Use different values for different environments
- The `NEXT_PUBLIC_` prefix makes variables available to the browser
