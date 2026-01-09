# Deploying StudyQuest

## Step 1: Set up Supabase (Free Cloud Database)

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click "New Project" and create a project
3. Wait for the project to be ready (~2 minutes)
4. Go to **Settings → API** and copy:
   - Project URL (looks like `https://xxxxx.supabase.co`)
   - anon/public key

5. Go to **SQL Editor** and run this SQL to create the tables:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  display_name TEXT,
  avatar TEXT DEFAULT '🎓',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_data table
CREATE TABLE study_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_data ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for study_data
CREATE POLICY "Users can view own data" ON study_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON study_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON study_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

6. Go to **Authentication → Settings** and:
   - Enable "Email" provider
   - Disable "Confirm email" for easier testing (optional)

## Step 2: Configure Environment Variables

Create a `.env` file in your project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Deploy to Vercel (Recommended)

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "StudyQuest app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/studyquest.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) and sign in with GitHub

3. Click "Import Project" → Select your repo

4. Add Environment Variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

5. Click "Deploy"

6. Done! Your site will be live at `https://your-project.vercel.app`

## Alternative: Deploy to Netlify

1. Run `npm run build` locally
2. Go to [netlify.com](https://netlify.com)
3. Drag and drop the `dist` folder
4. Go to Site Settings → Environment Variables
5. Add the Supabase variables
6. Trigger a redeploy

## That's it! 🎉

Your StudyQuest app is now:
- ✅ Hosted online 24/7
- ✅ Data synced to cloud
- ✅ Accessible from any device
- ✅ Works even when your laptop is off
