-- Seed data for MacroTracker MVP testing
-- IMPORTANT: Replace 'USER_ID_HERE' with the actual UUID from your test user
-- Get the user ID from: Supabase Dashboard → Authentication → Users

-- =====================================================
-- INSERT DAILY GOALS
-- =====================================================
INSERT INTO daily_goal (user_id, calories, protein, carbs, fat, fiber)
VALUES ('USER_ID_HERE', 2000, 150, 250, 65, 30)
ON CONFLICT (user_id) DO UPDATE SET
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fat = EXCLUDED.fat,
  fiber = EXCLUDED.fiber,
  updated_at = NOW();

-- =====================================================
-- INSERT SAMPLE MEALS WITH FOOD ITEMS
-- =====================================================

-- Breakfast (2 hours ago)
WITH breakfast AS (
  INSERT INTO meal (user_id, timestamp, notes)
  VALUES ('USER_ID_HERE', NOW() - INTERVAL '2 hours', 'Morning breakfast')
  RETURNING id
)
INSERT INTO food_item (meal_id, name, weight_g, calories, protein, carbs, fat, fiber)
SELECT id, 'Oatmeal with Berries', 250, 320, 12, 54, 8, 10 FROM breakfast
UNION ALL
SELECT id, 'Greek Yogurt', 150, 90, 15, 6, 0, 0 FROM breakfast
UNION ALL
SELECT id, 'Banana', 120, 105, 1.3, 27, 0.4, 3.1 FROM breakfast;

-- Lunch (5 hours ago)
WITH lunch AS (
  INSERT INTO meal (user_id, timestamp, notes)
  VALUES ('USER_ID_HERE', NOW() - INTERVAL '5 hours', 'Lunch meal')
  RETURNING id
)
INSERT INTO food_item (meal_id, name, weight_g, calories, protein, carbs, fat, fiber)
SELECT id, 'Grilled Chicken Breast', 150, 248, 47, 0, 5.4, 0 FROM lunch
UNION ALL
SELECT id, 'Brown Rice', 150, 165, 3.5, 34, 1.3, 1.8 FROM lunch
UNION ALL
SELECT id, 'Steamed Broccoli', 100, 35, 2.4, 7, 0.4, 2.6 FROM lunch
UNION ALL
SELECT id, 'Olive Oil (dressing)', 15, 120, 0, 0, 14, 0 FROM lunch;

-- Yesterday's Dinner
WITH dinner_yesterday AS (
  INSERT INTO meal (user_id, timestamp, notes)
  VALUES ('USER_ID_HERE', NOW() - INTERVAL '1 day 8 hours', 'Dinner from yesterday')
  RETURNING id
)
INSERT INTO food_item (meal_id, name, weight_g, calories, protein, carbs, fat, fiber)
SELECT id, 'Salmon Fillet', 180, 367, 39, 0, 22, 0 FROM dinner_yesterday
UNION ALL
SELECT id, 'Sweet Potato', 200, 180, 4, 41, 0.3, 6.6 FROM dinner_yesterday
UNION ALL
SELECT id, 'Green Beans', 120, 38, 2, 9, 0.1, 3.4 FROM dinner_yesterday;

-- Yesterday's Breakfast
WITH breakfast_yesterday AS (
  INSERT INTO meal (user_id, timestamp, notes)
  VALUES ('USER_ID_HERE', NOW() - INTERVAL '1 day 22 hours', 'Yesterday morning')
  RETURNING id
)
INSERT INTO food_item (meal_id, name, weight_g, calories, protein, carbs, fat, fiber)
SELECT id, 'Scrambled Eggs', 150, 210, 18, 2, 14, 0 FROM breakfast_yesterday
UNION ALL
SELECT id, 'Whole Wheat Toast', 60, 160, 6, 28, 2, 4 FROM breakfast_yesterday
UNION ALL
SELECT id, 'Avocado', 50, 80, 1, 4.3, 7.3, 3.4 FROM breakfast_yesterday;

-- Print confirmation
SELECT 'Seed data inserted successfully!' AS message;
SELECT 'Total meals created: ' || COUNT(*) AS meals_count FROM meal WHERE user_id = 'USER_ID_HERE';
SELECT 'Total food items created: ' || COUNT(*) AS food_items_count FROM food_item fi
JOIN meal m ON fi.meal_id = m.id
WHERE m.user_id = 'USER_ID_HERE';
