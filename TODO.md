

EDGE-CASE-4
- when user tried to sign up with an already existing email our system doesnt catch that, and still prompts the user to check thier email. I assume something in supabase side catches that and doesnt send and email, but that error is not forwarded to the user.

QOL-5
- scrolling position doesnt reset on switching pages: for example, when i scroll down on dashboard, and switch to history, my scroll postion is down at the bottom, instead starting at the top again. 

QOL-6
- free mode blocking screen only displays after the user creates and confirms thier account
- if a user is invited to closed beta and creates an account with their email without the code, they get assigned as a free account but since thier account is already made, they have to contact a dev to have thier acct upgraded.