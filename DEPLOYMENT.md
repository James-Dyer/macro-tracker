# Edge Functions Deployment Guide

## Overview

Two Edge Functions have been created and are ready for deployment:
1. **analyze-meal** - AI-powered food recognition with complete nutrition data (Gemini/OpenAI)
2. **save-meal** - Database persistence with validation

## Prerequisites

### 1. Get API Keys

Before deploying, you need to obtain API keys from these providers:

#### Google Gemini API (Primary - Recommended)
- Go to: https://makersuite.google.com/app/apikey
- Create a new API key
- Cost: ~$0.0025 per image (very affordable)
- The AI returns complete nutrition data (calories, macros) based on USDA data
- Save as: `GEMINI_API_KEY`

#### OpenAI API (Optional - Fallback)
- Go to: https://platform.openai.com/api-keys
- Create a new API key
- Cost: ~$0.01-0.03 per image
- Save as: `OPENAI_API_KEY`

### 2. Set Secrets in Supabase

Go to Supabase Dashboard:
- Navigate to: https://supabase.com/dashboard/project/aphpvbalvookjladggku
- Go to: Settings → Edge Functions → Manage secrets
- Add the following secrets:
  ```
  GEMINI_API_KEY=your_gemini_key_here
  OPENAI_API_KEY=your_openai_key_here (optional)
  ```

## Deployment Methods

### Method 1: Using MCP Supabase Server (Recommended for Claude Code)

The Edge Functions are located in `supabase/functions/`. To deploy using MCP:

```typescript
// Deploy analyze-meal
mcp__supabase__deploy_edge_function({
  project_id: "aphpvbalvookjladggku",
  name: "analyze-meal",
  entrypoint_path: "index.ts",
  verify_jwt: true,
  files: [
    { name: "index.ts", content: "<file content>" },
    { name: "deno.json", content: "<file content>" }
  ]
})

// Deploy save-meal
mcp__supabase__deploy_edge_function({
  project_id: "aphpvbalvookjladggku",
  name: "save-meal",
  entrypoint_path: "index.ts",
  verify_jwt: true,
  files: [...]
})
```

### Method 2: Using Supabase CLI

From the project root:

```bash
# Deploy all functions
supabase functions deploy analyze-meal --project-ref aphpvbalvookjladggku
supabase functions deploy save-meal --project-ref aphpvbalvookjladggku
```

## Function Details

### analyze-meal
- **Purpose**: Analyze food photos using AI vision APIs and return complete nutrition data
- **Input**: `{ photoPath: string (storage path), useScale?: boolean }`
- **Output**: `{ foods: [{ name, confidence, weight_g, calories, protein, carbs, fat, fiber }], scaleDetected: boolean, scaleWeight?: number, confidence: number }`
- **Auth**: Required (JWT verification enabled)
- **Timeout**: ~3-5 seconds per request
- **Dependencies**: Gemini Pro Vision API or OpenAI GPT-4V
- **Note**: AI returns complete macro data based on USDA nutrition database knowledge

### save-meal
- **Purpose**: Persist meal and food items to database
- **Input**: `{ timestamp?, photoUrl?, notes?, foodItems: [{ name, weight_g, calories, protein, carbs, fat, fiber }] }`
- **Output**: `{ mealId: string, success: boolean }`
- **Auth**: Required (JWT verification enabled)
- **Database**: Inserts to `meal` and `food_item` tables
- **Validation**: Comprehensive input validation with proper error codes

## Testing Functions

After deployment, test each function:

### Test analyze-meal
```bash
# First, upload a meal photo to storage to get a photoPath
# Then test the analyze-meal function
curl -X POST \
  https://aphpvbalvookjladggku.supabase.co/functions/v1/analyze-meal \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"photoPath": "user-id/timestamp-random.jpg"}'
```

### Test save-meal
```bash
curl -X POST \
  https://aphpvbalvookjladggku.supabase.co/functions/v1/save-meal \
  -H "Authorization: Bearer YOUR_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "foodItems": [{
      "name": "Grilled Chicken",
      "weight_g": 150,
      "calories": 248,
      "protein": 47,
      "carbs": 0,
      "fat": 5.4,
      "fiber": 0
    }]
  }'
```

## Monitoring

View function logs:
- Supabase Dashboard → Edge Functions → Select function → Logs tab
- Or use MCP: `mcp__supabase__get_logs({ project_id: "aphpvbalvookjladggku", service: "edge-function" })`

## Troubleshooting

### "No AI API keys configured"
- Check that secrets are set in Supabase Dashboard
- Verify secret names match exactly: `GEMINI_API_KEY`, `OPENAI_API_KEY`

### "Missing authorization header" (401)
- Include `Authorization: Bearer <anon_key>` header
- For save-meal, user must be authenticated (use user JWT, not anon key)

### "Method not allowed" (405)
- Ensure you're using POST, not GET

### Gemini API errors
- Check API key is valid
- Verify billing is enabled on Google AI Studio
- Consider updating to gemini-1.5-flash model (see TODO comments)
- Ensure the model is prompted to return complete nutrition data

## Next Steps

After successful deployment:
1. ✅ Create storage bucket for meal photos
2. ✅ Create ConfirmMealPage for meal editing
3. ✅ Update LogMealPage to call Edge Functions
4. ✅ Create custom hooks for data management
5. ✅ Replace mock data with real queries

## Cost Estimates

Based on 100 users logging 3 meals/day (9,000 AI requests/month):

- **Edge Functions**: FREE (under 500K invocations/month)
- **Gemini API**: 9,000 × $0.0025 = $22.50/month
- **Supabase Storage**: FREE (5GB included)
- **Total**: ~$22.50/month

At 1,000 users: ~$275/month (AI analysis only, still very affordable)
