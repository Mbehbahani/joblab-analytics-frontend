# Vercel Deployment

## Required Environment Variables
Add these in Vercel project settings for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` (optional if same as `NEXT_PUBLIC_SUPABASE_URL`)

Optional:
- `LLM_BACKEND_URL` (if you want AI proxy routes to use env-based backend URL)
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

## Build Command
`next build`

## Verification Checklist
- Deployment build succeeds
- Dashboard loads at `/dashboard`
- API routes return data from Supabase
- Filters and charts update correctly
- Job Lookup, AI Explorer, and CV Match panels open and return responses

## Troubleshooting
- Confirm all required Supabase env vars are set in Vercel
- Check Vercel function logs for API route errors
- Verify Supabase RLS/policies and service role key validity
