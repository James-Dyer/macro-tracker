# Edge Functions Deployment - Next Steps

## Status: Functions Updated ✅, Re-deployment Needed ⏳

Two Edge Functions have been updated with the simplified architecture:
- ✅ `analyze-meal` - AI food recognition WITH complete nutrition data
- ✅ `save-meal` - Database persistence (202 lines)
- ❌ `lookup-nutrition` - REMOVED (nutrition data now comes from AI)

## Architecture Change

The AI models (Gemini/OpenAI) now return complete nutrition data (calories, protein, carbs, fat, fiber) directly, eliminating the need for external nutrition databases. This simplifies the system to a single API call per meal photo.

## Before Deployment: Get API Keys

You need to obtain API keys before the functions will work:

### Required:
1. **Gemini API** (Primary, recommended)
   - URL: https://makersuite.google.com/app/apikey
   - Cost: $0.0025 per image (~$22/month for 100 users)
   - Returns complete nutrition data based on USDA knowledge
   - Save key for: `GEMINI_API_KEY`

### Optional:
2. **OpenAI API** (Fallback if Gemini fails)
   - URL: https://platform.openai.com/api-keys
   - Cost: $0.01-0.03 per image
   - Save key for: `OPENAI_API_KEY`

## Deployment Command

Once you have the API keys:

1. **Set secrets in Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/aphpvbalvookjladggku/settings/functions
   - Add secrets: `GEMINI_API_KEY` (required), `OPENAI_API_KEY` (optional)

2. **Deploy using Supabase CLI:**
   ```bash
   cd /Users/jdyer/Code/macro-tracker
   supabase functions deploy analyze-meal --project-ref aphpvbalvookjladggku
   supabase functions deploy save-meal --project-ref aphpvbalvookjladggku
   ```

3. **Or use MCP (requires file content to be passed):**
   See DEPLOYMENT.md for detailed MCP commands

## After Deployment

Once deployed and API keys are set, you can:
1. Test the functions using the Supabase Dashboard
2. Continue with frontend integration (next in todo list)
3. Monitor logs in Supabase Dashboard → Edge Functions

## Files Ready for Deployment

All files are in `supabase/functions/`:
- `analyze-meal/index.ts` + `deno.json`
- `save-meal/index.ts` + `deno.json`

## Key Change: Storage-First Flow

The analyze-meal function now expects a `photoPath` (storage path) instead of base64 image data. This reduces payload size and enables better caching. The client flow is:

1. Upload photo to Supabase Storage
2. Call analyze-meal with photoPath
3. Get complete nutrition data from AI
4. Call save-meal to persist

## Why Not Deploy Now?

The functions require API keys to work. Deploying without keys would result in:
- `analyze-meal`: Returns 500 "No AI API keys configured"

It's better to get the API keys first, then deploy all at once and test properly.
