import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Validate JWT by extracting user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Parse request body
    const { photoPath, useScale = true }: AnalyzeMealRequest = await req.json();

    if (!photoPath) {
      return new Response(
        JSON.stringify({ error: "Missing photoPath" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Download image from Supabase Storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase configuration missing" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from("meal-photos")
      .download(photoPath);

    if (downloadError || !imageBlob) {
      return new Response(
        JSON.stringify({
          error: `Failed to download image: ${downloadError?.message || "Unknown error"}`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

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
      return new Response(
        JSON.stringify({ error: "No AI API keys configured" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    let response: AnalyzeMealResponse;

    // Try Gemini first (cheaper, faster)
    if (geminiApiKey) {
      try {
        response = await analyzeWithGemini(image, useScale, geminiApiKey);
      } catch (geminiError) {
        console.error("Gemini API failed:", geminiError);

        // Fallback to OpenAI if Gemini fails
        if (openaiApiKey) {
          console.log("Falling back to OpenAI GPT-4V");
          response = await analyzeWithOpenAI(image, useScale, openaiApiKey);
        } else {
          throw geminiError;
        }
      }
    } else if (openaiApiKey) {
      response = await analyzeWithOpenAI(image, useScale, openaiApiKey);
    } else {
      throw new Error("No AI provider available");
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in analyze-meal:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to analyze meal",
        foods: [],
        scaleDetected: false,
        confidence: 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function analyzeWithGemini(
  imageBase64: string,
  detectScale: boolean,
  apiKey: string
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
    throw new Error(`Failed to parse Gemini JSON: ${parseError.message}`);
  }
}

async function analyzeWithOpenAI(
  imageBase64: string,
  detectScale: boolean,
  apiKey: string
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

  const result = JSON.parse(jsonMatch[1]);
  return result;
}
