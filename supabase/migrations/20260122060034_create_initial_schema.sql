-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- DailyGoal table: stores user's target macros
CREATE TABLE daily_goal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  fiber INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Meal table: represents a logged meal
CREATE TABLE meal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FoodItem table: individual foods within a meal
CREATE TABLE food_item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID NOT NULL REFERENCES meal(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight_g INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(10,2) NOT NULL,
  carbs DECIMAL(10,2) NOT NULL,
  fat DECIMAL(10,2) NOT NULL,
  fiber DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_meal_user_id ON meal(user_id);
CREATE INDEX idx_meal_timestamp ON meal(timestamp);
CREATE INDEX idx_food_item_meal_id ON food_item(meal_id);

-- Enable Row Level Security
ALTER TABLE daily_goal ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_item ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_goal
CREATE POLICY "Users can view their own daily goals"
  ON daily_goal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily goals"
  ON daily_goal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily goals"
  ON daily_goal FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily goals"
  ON daily_goal FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for meal
CREATE POLICY "Users can view their own meals"
  ON meal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
  ON meal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
  ON meal FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
  ON meal FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for food_item
-- Users can only access food_items from their own meals
CREATE POLICY "Users can view food items from their own meals"
  ON food_item FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal
      WHERE meal.id = food_item.meal_id
      AND meal.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert food items to their own meals"
  ON food_item FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal
      WHERE meal.id = food_item.meal_id
      AND meal.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update food items from their own meals"
  ON food_item FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal
      WHERE meal.id = food_item.meal_id
      AND meal.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete food items from their own meals"
  ON food_item FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal
      WHERE meal.id = food_item.meal_id
      AND meal.user_id = auth.uid()
    )
  );;
