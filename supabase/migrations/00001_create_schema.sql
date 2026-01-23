-- Create tables for MacroTracker MVP
-- Schema: daily_goal, meal, food_item with RLS policies

-- =====================================================
-- TABLE: daily_goal
-- One goal per user (unique constraint on user_id)
-- =====================================================
CREATE TABLE daily_goal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  fiber INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- TABLE: meal
-- Stores meal records with photos and timestamps
-- =====================================================
CREATE TABLE meal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meal_user_timestamp ON meal(user_id, timestamp DESC);

-- =====================================================
-- TABLE: food_item
-- Individual food items within a meal
-- =====================================================
CREATE TABLE food_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES meal(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight_g INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  protein NUMERIC(5,2) NOT NULL,
  carbs NUMERIC(5,2) NOT NULL,
  fat NUMERIC(5,2) NOT NULL,
  fiber NUMERIC(5,2) NOT NULL
);

CREATE INDEX idx_food_item_meal ON food_item(meal_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Isolate user data for multi-tenant security
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE daily_goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_item ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DAILY_GOAL POLICIES
-- =====================================================
CREATE POLICY "Users can view their own goals"
  ON daily_goal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON daily_goal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON daily_goal FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- MEAL POLICIES
-- =====================================================
CREATE POLICY "Users can view their own meals"
  ON meal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON meal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON meal FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FOOD_ITEM POLICIES
-- Access controlled via meal ownership
-- =====================================================
CREATE POLICY "Users can view food items from their meals"
  ON food_item FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal
      WHERE meal.id = food_item.meal_id
      AND meal.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert food items to their meals"
  ON food_item FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal
      WHERE meal.id = food_item.meal_id
      AND meal.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete food items from their meals"
  ON food_item FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal
      WHERE meal.id = food_item.meal_id
      AND meal.user_id = auth.uid()
    )
  );
