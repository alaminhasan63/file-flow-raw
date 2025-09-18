# Deployment Configuration

## Environment Variables Required

### NEXT_PUBLIC_SITE_URL

This variable is **REQUIRED** for the checkout functionality to work properly.

**Local Development:**

```bash
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Production (Vercel):**

```bash
NEXT_PUBLIC_SITE_URL=https://file-flow-raw.vercel.app
```

### Setting Environment Variables in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `file-flow-raw`
3. Navigate to **Settings** → **Environment Variables**
4. Add the environment variable:
   - Name: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://file-flow-raw.vercel.app`
   - Environment: Production, Preview, Development

### Verification

After deployment, test the checkout flow:

1. Go to: `https://file-flow-raw.vercel.app/app/start`
2. Complete the filing process
3. Verify checkout redirects to: `https://file-flow-raw.vercel.app/checkout/mock`

## Other Environment Variables

If you're using custom Supabase configuration, also set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
