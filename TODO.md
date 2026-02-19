EDGE-CASE-2
Problem Summary                                                                                      
When users upload images that don't contain food, the Gemini AI model returns a valid response structure but with an empty foods array. The frontend currently navigates to ConfirmMealPage and shows a blank food list, only displaying an error when the user tries to save.                                           
- detect and return a NO_FOOD_DETECTED error when
   - foods array is empty
   - confidence is below a 0.3
- Show helpful tips when no food is detected:
   - Clear error message 
   - Tips for better photos (lighting, clarity, etc.)              
   - "Try Again" button           
- Optional Manual Entry Fallback - Let users skip AI and enter food manually if detection keeps failing 

QOL-3
- theme choice persists to localstorage, not the user's db
- this may cause the theme to reset when the user logs in from different device or localstorate is cleared
- i like the default kept at light mode, right now its default to dark

EDGE-CASE-4
- when user tried to sign up with an already existing email our system doesnt catch that, and still prompts the user to check thier email. I assume something in supabase side catches that and doesnt send and email, but that error is not forwarded to the user.