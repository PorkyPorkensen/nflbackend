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

## Step 7: Deploy to AWS Elastic Beanstalk

The application is configured for automatic deployment to AWS Elastic Beanstalk via GitHub Actions.

### Setup GitHub Secrets

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" > "Actions"
3. Add the following secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key

### Automatic Deployment

Once secrets are configured, pushes to the `main` branch will automatically deploy to Elastic Beanstalk.

### Manual Deployment

You can also trigger deployment manually:
1. Go to the "Actions" tab in GitHub
2. Select "Deploy to AWS Elastic Beanstalk" workflow
3. Click "Run workflow"

The application will be deployed to:
- **Application Name**: nfl-bracket-backend
- **Environment**: nfl-prod
- **Region**: us-east-1

---
**Need help?** Check the console logs - they contain detailed error information!