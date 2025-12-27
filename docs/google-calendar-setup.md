# Google Calendar Integration Setup

## Environment Variables

Add these to your `.env.local` file:

```env
# Google Calendar Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details:
   - Name: `linda-calendar-sync` (or similar)
   - Description: "Service account for reading calendar events"
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### 3. Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Download the key file

### 4. Extract Credentials

From the downloaded JSON file, you need:
- `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

**Important**: When adding the private key to `.env.local`, keep the `\n` characters as they are.

### 5. Share Calendar with Service Account

1. Open Google Calendar
2. Find your shared team calendar
3. Click on the three dots > "Settings and sharing"
4. Under "Share with specific people or groups", add the service account email
5. Give it **"See all event details"** permission
6. Copy the **Calendar ID** from the "Integrate calendar" section

### 6. Run Database Migrations

In Supabase SQL Editor, run the migrations in order:

1. `supabase/migrations/001_create_sessions_and_attendance.sql`
2. `supabase/migrations/002_migrate_legacy_attendance.sql` (after first Google sync)

## Event Naming Convention

For events to be synced, they must start with:
- `TS` - Training Session (e.g., "TS Tuesday Morning Training")
- `TM` - Team Meeting (e.g., "TM Weekly Standup")

Events without these prefixes will be ignored.

## Troubleshooting

### "Google service account credentials not configured"
- Verify all three environment variables are set correctly
- Restart the development server after adding env variables

### "GOOGLE_CALENDAR_ID not configured"
- Make sure you've added the calendar ID from Google Calendar settings

### No events syncing
- Verify the service account has access to the calendar
- Check that events have the correct prefix (TS or TM)
- Ensure events have specific times (all-day events are skipped)

### Authentication errors
- Verify the private key is properly formatted with `\n` characters
- Make sure the Calendar API is enabled in Google Cloud Console
