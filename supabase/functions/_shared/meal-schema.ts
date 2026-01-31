/**
 * Shared TypeScript interfaces and JSON schemas for meal analysis.
 * Used by analyze-meal Edge Function for structured AI responses.
 */

/**
 * Detected food item with nutrition data
 */
export interface DetectedFood {
  name: string;
  weight_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

/**
 * Complete meal analysis response from AI
 */
export interface MealAnalysisResponse {
  foods: DetectedFood[];
  scaleDetected: boolean;
  scaleWeight?: number;
  confidence: number;
}

/**
 * JSON Schema for OpenAI structured output (strict mode)
 * Compatible with OpenAI's json_schema response format
 */
export const MEAL_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    foods: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          weight_g: { type: "number" },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          fiber: { type: "number" },
        },
        required: ["name", "weight_g", "calories", "protein", "carbs", "fat", "fiber"],
        additionalProperties: false,
      },
    },
    scaleDetected: { type: "boolean" },
    scaleWeight: { type: ["number", "null"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["foods", "scaleDetected", "confidence"],
  additionalProperties: false,
};

/**
 * Gemini-specific response schema
 * Gemini uses a different schema format with nullable types
 */
export const GEMINI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    foods: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          weight_g: { type: "number" },
          calories: { type: "number" },
          protein: { type: "number" },
          carbs: { type: "number" },
          fat: { type: "number" },
          fiber: { type: "number" },
        },
        required: ["name", "weight_g", "calories", "protein", "carbs", "fat", "fiber"],
      },
    },
    scaleDetected: { type: "boolean" },
    scaleWeight: { type: "number", nullable: true },
    confidence: { type: "number" },
  },
  required: ["foods", "scaleDetected", "confidence"],
};
