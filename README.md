# 🏈 NFL Bracket Backend Setup Guide

## Prerequisites ✅
- [x] Node.js installed
- [x] Backend dependencies installed (`npm install`)
- [ ] AWS RDS PostgreSQL database created
- [ ] Environment variables configured

## Step 1: Configure Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with your actual values:**
   ```bash
   # Get these values from AWS RDS Console
   DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
   DB_PASSWORD=your-secure-password
   
   # Get these from Firebase Console > Project Settings > Service Accounts
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY_ID=your-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   ```

## Step 2: Test Database Connection

```bash
node test-connection.js
```

If successful, you should see:
```
✅ Database connection successful!
✅ Table creation test successful!
✅ Cleanup successful!
```

## Step 3: Setup Database Schema

```bash
npm run setup-db
```

This creates all the tables (users, brackets, teams, etc.)

## Step 4: Seed NFL Teams Data

```bash
npm run seed-db
```

This populates the database with all 32 NFL teams and playoff seeds.

## Step 5: Start the Backend Server

```bash
npm run dev
```

Server will run on `http://localhost:3001`

## Step 6: Test API Endpoints

- **Health Check:** `GET http://localhost:3001/api/health`
- **Brackets:** `GET http://localhost:3001/api/brackets`
- **Leaderboard:** `GET http://localhost:3001/api/leaderboard/2025`

## Common Issues & Solutions

### "ENOTFOUND" Error
- Check your `DB_HOST` in `.env`
- Make sure RDS database is "Available" status

### "ECONNREFUSED" Error
- Database might still be starting up
- Check AWS RDS security group allows connections on port 5432

### "28P01" Authentication Error
- Check `DB_PASSWORD` matches what you set in AWS
- Verify `DB_USER` is correct (usually "postgres")

### Firebase Auth Errors
- Download service account key from Firebase Console
- Copy the private key exactly (including newlines)

## Next Steps
Once backend is running:
1. Update frontend API configuration
2. Test bracket submission
3. Deploy to AWS (EC2 or Lambda)

---
**Need help?** Check the console logs - they contain detailed error information!