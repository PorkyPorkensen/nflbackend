# Fix for 403 Forbidden Error on Production

## Problem
Brackets can be submitted locally but get 403 Forbidden on the live Vercel site. This is because:

1. The backend Firebase initialization fails on production because environment variables aren't set on Elastic Beanstalk
2. When Firebase Admin SDK fails to initialize, `authenticateUser` middleware returns 401
3. The authentication check fails before the bracket submission can be processed

## Solution

### Step 1: Set Environment Variables on Elastic Beanstalk

You need to set these Firebase environment variables in your EB environment configuration:

1. Go to your [AWS Elastic Beanstalk Console](https://console.aws.amazon.com/elasticbeanstalk/)
2. Select your environment (likely `nfl-backend-env` or similar)
3. Click **Configuration** in the left sidebar
4. Click **Edit** on the **Software** section
5. Scroll down to **Environment properties**
6. Add these variables:

```
FIREBASE_PROJECT_ID=nfl-bracket-app
FIREBASE_PRIVATE_KEY_ID=922e1de89bf74db8eab15a406f82cbe1d4477d8c
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCr3ZR4kE+7wNvV\nUyh+Ph+ERfF26DpiRKaBzccY06RDoh5C5b1ji5Sc3BbwIOfF9Gb+ERBSwmgFZspo\nCQTli+ehJrAOcE/mJqRfRwfdSZUcNEE8n7pu/w0i+h2JQl++5BGTL5xTopn+4H2D\nVrrtkvmgAJDYuNs5zBhVypzTx0vVKNhSLxPGZ3WIbYJjHNt4oSKrc3nqEkPWmbK0\nBEZeC4zU/pybXdeXeYVSGfV6MobwGH6NJumaFvUTWUUTHal3H8pPFW2EFYGKNBHE\nm/UWzC4JUtV1dSwMgaomUJJ90rVTvzdjY2qijewWGRj3vcn6ebbhJQ6vG/yB+LpF\n4qX4RTy9AgMBAAECggEAAmbVy3uEybm6Y2LxRsEFKBA20skQVng2yss+iYUc9LRV\nb5eN9nqoXdV2Mpkwc/k5iTphe9lAoowFrxTVLy9YfM2GxKTi0PNgSlPlSGfeABIQ\n3qaCxfNQJ9l5Q9ucF+r6/eS6mVvv1/p4y+GQj3+wIlbFBL+h508IALGUpcxRWHi0\nOoZsnAjiHQDKKknNGBTvAfGtc4f6tDLarl/+pVke/w5NwJfa59rugLX4kJ0YluOg\nUucCtkgBaenrQEdiflnzhSVP0qSiAkTkWzJ9I0rmndGIIDqv5rP2sSrYQr0IWZ44\nQTj3PF0XiRxG/5uI0gljJkj31a1q8hy57BnR4H39RwKBgQDxzVZ0PDB5zBCkqEQt\nk+BbaigZhALn1tTdAiLlNn2UdjHXc/AhP08yocG/6LwqG6O2Gp9tIQ12BakiVfr5\nuTW4DhQ7S84Oh7lwuxCeSAdKUSUWL2G7+01vb6F8oSf5jrqzbWFn3Lfp82+bIGCG\nIjrVLDfdOKWeSl3Ynbk3uPcEvwKBgQC19PylAIzBuBqSPF6y3VZ8j/ngjMs6l6zs\nFgqmhWaloKNEdfIRjRaEK/72js72YzABpjHfV/37L5qow2MKkZQDUZcf4Hk1iosK\nHUtTs2lG1/Ts8zOvyJCYgTzHbnOMfMl6SW56mQUjBDMI8CPLuLG3E8sCyaTr4eHH\nSjhAdRrxgwKBgB4HfUQkMXT+1dZNG2J5qfRQY7h/f4jhUkA8Qq8qrD/iyd/TAzBt\n110XX6OAuNWV5yf3eHMqFqzgmReti+S1jqlT/kk66dU+H9aTNMYjddxR5YQy0DVz\nSTOcrnZ24SsKAb/ExsMKU0DXvbWLONGPsLTGsA1mOpNE8xCyzczQyMSrAoGARUNL\nhLfP3NHq822dkrKkgGgB81NE7TndbkT5queu6i9a1u2axsmRH6DrvgkgiTO6i3Yr\nF9yT5rD5S3KM2fIOiLDfORgmq5XgVWpPST5LPddo+WWecDSFrjfL3hKSU5EQ1Mbt\nEif7h5fKoYVf6uWUaJ9VMOt3Jv9mBYmgHhE1v2cCgYB+yjwlGaQemqscgm7Y9XRk\n10uE4bR1zznm30pF0DjRjAuyyzJbJqproKB7j9FyMkeTRYjPkPxy2gzVJttXpTGB\nSwcDEo8NXl7MmvIX+fCV83xmmjxcQMbmYPW0rwmGM6BeQ8q7Io7xO2loXM3Gtds9\n5yLJhMQWZg06G29jLZtq+g==\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@nfl-bracket-app.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=108922620479094586119
FIREBASE_DATABASE_URL=https://nfl-bracket-app-default-rtdb.firebaseio.com
NODE_ENV=production
```

7. Click **Apply** at the bottom
8. Wait for the environment to update (this will restart your EB instance)

### Step 2: Verify Firebase Authentication Works

After the EB instance restarts, test the health check endpoint:

```bash
curl https://dt391zudkqfrk.cloudfront.net/api/health
```

You should see a response like:
```json
{
  "status": "healthy",
  "server": "running",
  "firebase": "initialized"
}
```

### Step 3: Test Bracket Submission

1. Go to https://nflfrontend.vercel.app/nfl/bracket-maker
2. Sign in
3. Try submitting a bracket - it should work now

## Additional Notes

**Why this happened:**
- Your `.env` file contains the private Firebase key
- In production (Elastic Beanstalk), the `.env` file is not loaded
- Without these variables, Firebase Admin SDK fails to initialize
- All authenticated requests (like bracket submission) fail with 401
- Some error handling converts this to 403

**Security Note:**
- Never commit credentials to git (even though you have in `.env`)
- Add `.env` to `.gitignore` if not already done
- Consider rotating your Firebase credentials since they're now exposed

**For CI/CD deployments:**
- If you deploy with GitHub Actions, set these as secrets
- Use the `.ebextensions/01_set_environment.config` file to manage secrets more securely
