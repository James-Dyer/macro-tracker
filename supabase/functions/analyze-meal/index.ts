import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Logger } from '../_shared/logger.ts';
import { ApiError, ErrorCode, createErrorResponse } from '../_shared/errors.ts';
import { EnvValidator } from '../_shared/env.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface AnalyzeMealRequest {
  photoPath: string; // Path in Supabase Storage (e.g., "user-id/timestamp-random.jpg")
  useScale?: boolean;
}

interface DetectedFood {
  name: string;
  confidence: number;
  weightGrams: number;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber: number; // grams
}

interface AnalyzeMealResponse {
  foods: DetectedFood[];
  scaleDetected: boolean;
  scaleWeight?: number; // OCR reading from scale
  confidence: number;
  error?: string;
}

// Validate environment variables at startup - FAIL HARD if missing
const envValidation = EnvValidator.validate({
  required: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  optional: ['GEMINI_API_KEY', 'OPENAI_API_KEY'],
});

if (!envValidation.valid) {
  const errorMsg = `Missing required environment variables: ${envValidation.missing.join(', ')}`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

serve(async (req) => {
  const requestId = generateRequestId();
  const logger = new Logger('analyze-meal', { requestId });

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logger.info('Request received', { method: req.method });

  // Debug: log all headers
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value.substring(0, 50); // Truncate for security
  });
  logger.info('Request headers', { headers });

  // Method guard: only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logger.warn('Missing authorization header');
      throw new ApiError(
        ErrorCode.MISSING_AUTH,
        'Missing authorization header',
        401
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client for auth validation
    // Note: Must have valid SUPABASE_ANON_KEY or this will fail
    const supabaseClient = createClient(
      EnvValidator.getRequired("SUPABASE_URL"),
      EnvValidator.getRequired("SUPABASE_ANON_KEY")
    );

    // Validate JWT by passing token explicitly to getUser()
    // This is required when JWT verification is disabled on the Edge Function
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      logger.error('Authentication failed', {
        error: userError,
        hasToken: !!token,
        tokenLength: token?.length
      });
      throw new ApiError(
        ErrorCode.INVALID_AUTH,
        'Unauthorized',
        403
      );
    }

    logger.info('User authenticated', { userId: user.id });

    // Parse request body
    const { photoPath, useScale = true }: AnalyzeMealRequest = await req.json();

    if (!photoPath) {
      logger.warn('Missing photoPath in request');
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'Missing photoPath',
        400
      );
    }

    logger.info('Processing meal analysis', { photoPath, useScale });

    // Download image from Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Supabase configuration missing', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      throw new ApiError(
        ErrorCode.MISSING_CONFIG,
        'Supabase configuration missing',
        500,
        { missing: [!supabaseUrl && 'SUPABASE_URL', !supabaseServiceKey && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean) }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from("meal-photos")
      .download(photoPath);

    if (downloadError || !imageBlob) {
      logger.error('Failed to download image from storage', {
        photoPath,
        error: downloadError?.message
      });
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        `Failed to download image: ${downloadError?.message || "Unknown error"}`,
        400,
        { photoPath }
      );
    }

    logger.info('Image downloaded successfully', { size: imageBlob.size });

    // Convert blob to base64
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    const image = `data:${imageBlob.type};base64,${base64Image}`;

    // Get API keys from environment
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!geminiApiKey && !openaiApiKey) {
      logger.error('No AI API keys configured', {
        geminiConfigured: false,
        openaiConfigured: false,
      });

      throw new ApiError(
        ErrorCode.MISSING_CONFIG,
        'AI service is not configured. Please contact support.',
        500,
        { missingKeys: ['GEMINI_API_KEY', 'OPENAI_API_KEY'] }
      );
    }

    logger.info('API keys available', {
      gemini: !!geminiApiKey,
      openai: !!openaiApiKey,
    });

    let response: AnalyzeMealResponse;

    // Try Gemini first (cheaper, faster)
    if (geminiApiKey) {
      try {
        logger.info('Attempting Gemini API call');
        response = await analyzeWithGemini(image, useScale, geminiApiKey, logger);
        logger.info('Gemini API success', { foodCount: response.foods.length });
      } catch (geminiError) {
        logger.error('Gemini API failed', geminiError);

        // Fallback to OpenAI if Gemini fails
        if (openaiApiKey) {
          logger.info('Falling back to OpenAI GPT-4V');
          try {
            response = await analyzeWithOpenAI(image, useScale, openaiApiKey, logger);
            logger.info('OpenAI API success', { foodCount: response.foods.length });
          } catch (openaiError) {
            logger.error('OpenAI API also failed', openaiError);
            throw new ApiError(
              ErrorCode.EXTERNAL_API_ERROR,
              'All AI services failed. Please try again later.',
              503,
              { geminiError: geminiError.message, openaiError: openaiError.message }
            );
          }
        } else {
          throw new ApiError(
            ErrorCode.EXTERNAL_API_ERROR,
            'AI analysis failed and no fallback available',
            503,
            { error: geminiError.message }
          );
        }
      }
    } else if (openaiApiKey) {
      // Only OpenAI available
      logger.info('Only OpenAI configured, using GPT-4V');
      try {
        response = await analyzeWithOpenAI(image, useScale, openaiApiKey, logger);
        logger.info('OpenAI API success', { foodCount: response.foods.length });
      } catch (openaiError) {
        logger.error('OpenAI API failed', openaiError);
        throw new ApiError(
          ErrorCode.EXTERNAL_API_ERROR,
          'AI analysis failed',
          503,
          { error: openaiError.message }
        );
      }
    }

    logger.info('Analysis complete', { foodCount: response.foods.length });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logger.error('analyze-meal error', error);
    return createErrorResponse(error, requestId, corsHeaders);
  }
});

async function analyzeWithGemini(
  imageBase64: string,
  detectScale: boolean,
  apiKey: string,
  logger: Logger
): Promise<AnalyzeMealResponse> {
  // Remove data URL prefix if present
  const base64Image = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  // TODO: Update to latest Gemini model (gemini-1.5-flash or gemini-1.5-pro)
  // Consider using response_mime_type: "application/json" for structured output

  const prompt = `You are a nutrition expert analyzing a food photo. You must identify all foods and provide complete nutritional information.

${detectScale ? "IMPORTANT: Check if a kitchen scale is visible in the image with a weight reading displayed." : ""}

Analyze this image and return a JSON response with the following structure:
{
  "foods": [
    {
      "name": "food item name (be specific: 'grilled chicken breast' not just 'chicken')",
      "confidence": 0.0-1.0,
      "weightGrams": weight in grams (from scale if visible, otherwise estimate from visual cues),
      "calories": total calories for this food item,
      "protein": protein in grams,
      "carbs": carbohydrates in grams,
      "fat": fat in grams,
      "fiber": fiber in grams
    }
  ],
  "scaleDetected": true/false,
  "scaleWeight": weight in grams from scale display (null if no scale or unreadable),
  "confidence": overall confidence 0.0-1.0
}

Guidelines:
- Identify ALL distinct food items visible
- Be specific with food names (include cooking method if visible, e.g., "fried chicken" vs "grilled chicken")
- If a scale is visible, read the weight from the digital display using OCR and use that exact weight
- If no scale visible, estimate portion size and weight from visual cues (plate size, common portions)
- Calculate nutritional values based on the identified food and weight using standard USDA nutrition data
- Be as accurate as possible with macro calculations
- Return only valid JSON, no additional text`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();

  // Extract text from response (robust handling of multiple parts)
  const candidate = data.candidates?.[0];
  if (!candidate || !candidate.content || !candidate.content.parts) {
    throw new Error("No response from Gemini");
  }

  // Concatenate all text parts
  const text = candidate.content.parts
    .filter((part: any) => part.text)
    .map((part: any) => part.text)
    .join("");

  if (!text) {
    throw new Error("No text in Gemini response");
  }

  // Parse JSON from response (handle markdown code blocks, inline JSON, etc.)
  let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) {
    jsonMatch = text.match(/```\s*([\s\S]*?)\s*```/);
  }
  if (!jsonMatch) {
    jsonMatch = text.match(/(\{[\s\S]*\})/);
  }

  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Gemini response");
  }

  try {
    const result = JSON.parse(jsonMatch[1].trim());
    return result;
  } catch (parseError) {
    logger.error('Failed to parse Gemini JSON response', {
      responseText: text.substring(0, 500), // Log first 500 chars
      error: parseError,
    });
    throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
  }
}

async function analyzeWithOpenAI(
  imageBase64: string,
  detectScale: boolean,
  apiKey: string,
  logger: Logger
): Promise<AnalyzeMealResponse> {
  // TODO: Update to latest vision model (gpt-4o, gpt-4-turbo, etc.)
  // Consider using response_format: { type: "json_object" } for structured output

  // Ensure proper data URL format
  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const prompt = `You are a nutrition expert analyzing a food photo. You must identify all foods and provide complete nutritional information.

${detectScale ? "IMPORTANT: Check if a kitchen scale is visible in the image with a weight reading displayed." : ""}

Analyze this image and return a JSON response with the following structure:
{
  "foods": [
    {
      "name": "food item name (be specific: 'grilled chicken breast' not just 'chicken')",
      "confidence": 0.0-1.0,
      "weightGrams": weight in grams (from scale if visible, otherwise estimate from visual cues),
      "calories": total calories for this food item,
      "protein": protein in grams,
      "carbs": carbohydrates in grams,
      "fat": fat in grams,
      "fiber": fiber in grams
    }
  ],
  "scaleDetected": true/false,
  "scaleWeight": weight in grams from scale display (null if no scale or unreadable),
  "confidence": overall confidence 0.0-1.0
}

Guidelines:
- Identify ALL distinct food items visible
- Be specific with food names (include cooking method if visible, e.g., "fried chicken" vs "grilled chicken")
- If a scale is visible, read the weight from the digital display using OCR and use that exact weight
- If no scale visible, estimate portion size and weight from visual cues (plate size, common portions)
- Calculate nutritional values based on the identified food and weight using standard USDA nutrition data
- Be as accurate as possible with macro calculations
- Return only valid JSON, no additional text`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview", // TODO: Update to gpt-4o or latest vision model
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();

  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No response from OpenAI");
  }

  // Parse JSON from response
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new Error("Could not parse JSON from OpenAI response");
  }

  try {
    const result = JSON.parse(jsonMatch[1]);
    return result;
  } catch (parseError) {
    logger.error('Failed to parse OpenAI JSON response', {
      responseText: text.substring(0, 500),
      error: parseError,
    });
    throw new Error(`Invalid JSON response from OpenAI: ${parseError.message}`);
  }
}
