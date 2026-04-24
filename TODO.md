
BETA-1:
create a ~5-10 sec video that quickly shows the user the value of the product
create a ~5-10 sec video for onboarding that shows the user how to add the app as a pwa

PROD-1
Message from supabase: You’re using the built-in supabase email service. This service has rate limits and is not meant to be used for production apps.
Emails should be sent using your custom SMTP provider.
- possible provider: resend. prereq: PROD-2 (requires a domain name)
- current short term fix: disabled email confirmation; so no need for a email service anymore.

PROD-2
buy a domain name and base product branding around it

UX-1
on the confirm meal page (also called the edit meal page), each detected food in placed in a editable card. all the editable text box fields feel a little too noisy, so i'm going to change the ux. on the page, let's not have the food info in editable text boxes, and instead have them sit as text on the card. then, we will have a little edit icon in the top left corner instead of the delete. the user will be able to tap anywhere on the card to open a new screen, the edit food screen. In the edit food screen:
- this will be where all the info is editable in text boxes. 
- we will move the trash icon to delete the meal here. (still small and red)
- we will have wide save/cancel button on top for easy editing. 
UPDATE: THIS IS FIXED, BUT AFTER TESTING:
- small ui bug: the little edit meal popup that appears after i click the meal. i can't scroll down on it. when i try to scroll it scrolls the page in the background instead.

BUG-2
sometimes when i delete a past meal from the history page, it shows the "loading your history" loading screen and gets stuck like that. ideally we shouldn't have to see a loading screen at all after deleting. the issue might be complex we will have to confirm the issue before applying a patch. it seems to work fine with meals i have just added.

UX-3
Big task: replace all loading screens with more UX friendly skeleton loading screens. a modern UI design pattern used to indicate that a page is loading by displaying a wireframe-like, animated mockup of the content to come

FEAT-2
Daily goal isnt beng cached, it should be cached like the rest of the home page/user info is.
Lets review our caching policies and make sure they all make sense first before implementing this.

UX-1
implement swipe right to delete instead of a dedicated button for food entries

UX-2
Confirm meal page: the save and canel buttons are on the bottom but i want them at the top instead

UX-3 
Save meal does an api call even if nothing in the meal has changed.

UX-4
The user should be able to trigger the goal setting onboarding from the goals page. when triggered from thegoals page, it should only set the goals on the one onboardingGoalsPage, not go thru the other onboarding pages.