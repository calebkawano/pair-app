# Setting Up Twilio for SMS Invites

## 1. Sign Up for Twilio
1. Go to https://www.twilio.com/try-twilio
2. Create a free trial account
3. Verify your email and phone number
4. You'll get free trial credit to test with

## 2. Get Your Credentials
1. Log in to [Twilio Console](https://console.twilio.com)
2. On the dashboard, find:
   - Account SID (starts with "AC...")
   - Auth Token (click "Show" to reveal)
   - Your Twilio phone number (or buy one if not assigned)

## 3. Set Up Environment Variables
1. In your project's `.env.local` file, add:
```
TWILIO_ACCOUNT_SID=AC...your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+1your_twilio_number_here
```

## 4. Testing
1. Your free trial account can only send SMS to verified numbers
2. To verify a number:
   - Go to [Verified Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)
   - Click "Add a new Caller ID"
   - Enter the number you want to test with
   - Follow verification steps

## 5. Going Live
1. When ready for production:
   - Upgrade your Twilio account
   - Buy a phone number if you haven't already
   - Update environment variables in your production environment

## Notes
- Keep your Auth Token secure and never commit it to version control
- Test thoroughly with verified numbers before going live
- Monitor your Twilio console for usage and costs
- Free trial limitations:
  * Can only send to verified numbers
  * Trial banner in messages
  * Limited credit
  * Some features restricted 